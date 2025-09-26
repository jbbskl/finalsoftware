# services/worker/worker.py
import json, os, subprocess, tempfile, shutil
from pathlib import Path
from celery.utils.log import get_task_logger
import boto3
from botocore.exceptions import ClientError

from celery_app import app  # <-- import the SAME Celery app

log = get_task_logger(__name__)

def _stream_lines(proc):
    for line in iter(proc.stdout.readline, b""):
        try:
            ev = json.loads(line.decode("utf-8").strip())
            log.info(f"[event] {ev}")
        except Exception:
            log.info(line.decode("utf-8").rstrip())

def upload_artifacts_to_minio(artifacts_dir: Path, run_id: str):
    """Upload artifacts to MinIO"""
    try:
        # Initialize MinIO client
        s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv('S3_ENDPOINT'),
            aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('S3_SECRET_KEY'),
            region_name='us-east-1'  # MinIO doesn't care about region
        )
        
        bucket_name = os.getenv('S3_BUCKET', 'artifacts')
        
        # Upload all files in artifacts directory
        uploaded_files = []
        for file_path in artifacts_dir.rglob('*'):
            if file_path.is_file():
                # Create S3 key: runs/{run_id}/{relative_path}
                relative_path = file_path.relative_to(artifacts_dir)
                s3_key = f"runs/{run_id}/{relative_path}"
                
                s3_client.upload_file(
                    str(file_path),
                    bucket_name,
                    s3_key
                )
                uploaded_files.append(s3_key)
                log.info(f"Uploaded {file_path} to {s3_key}")
        
        return f"http://minio:9000/{bucket_name}/runs/{run_id}/"
        
    except ClientError as e:
        log.error(f"Failed to upload artifacts: {e}")
        return None
    except Exception as e:
        log.error(f"Unexpected error uploading artifacts: {e}")
        return None

@app.task(name="tasks.run_bot", bind=True, max_retries=0)
def run_bot(self, image_ref: str, run_id: str, config: dict):
    artifacts_dir = Path(f"/tmp/artifacts-{run_id}")
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmpd:
        cfg_path = Path(tmpd) / "config.json"
        cfg_path.write_text(json.dumps(config, indent=2))
        cmd = [
            "docker","run","--rm",
            "-e","RUN_ID="+run_id,
            "-e","ARTIFACTS_DIR=/artifacts",
            "-e","CONFIG_PATH=/config/config.json",
            "-v",f"{cfg_path}:/config/config.json:ro",
            "-v",f"{artifacts_dir}:/artifacts",
            image_ref,
        ]
        log.info("Running: " + " ".join(cmd))
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        _stream_lines(proc)
        code = proc.wait()
        log.info(f"Exit code: {code}")
        
        # Upload artifacts to MinIO
        artifacts_url = upload_artifacts_to_minio(artifacts_dir, run_id)
        if artifacts_url:
            log.info(f"Artifacts uploaded to: {artifacts_url}")
        else:
            log.error("Failed to upload artifacts")
        
        # Clean up local artifacts
        shutil.rmtree(artifacts_dir, ignore_errors=True)
        return {"run_id": run_id, "exit_code": code, "artifacts_url": artifacts_url}
