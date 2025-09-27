# services/worker/worker.py
import json, os, subprocess, tempfile, shutil, time
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

@app.task(name="tasks.validate_bot")
def validate_bot(instance_id: str, config_dir: str):
    """Validate bot instance by checking required files"""
    log.info(f"Validating bot instance {instance_id} in {config_dir}")
    
    try:
        # Check if config_dir exists
        config_path = Path(config_dir)
        if not config_path.exists():
            log.error(f"Config directory does not exist: {config_dir}")
            return {"status": "error", "message": "Config directory not found"}
        
        # Check for required files
        secrets_dir = config_path / "secrets"
        storage_state_file = secrets_dir / "storageState.json"
        config_file = config_path / "config.yaml"
        
        missing_files = []
        if not storage_state_file.exists():
            missing_files.append("secrets/storageState.json")
        if not config_file.exists():
            missing_files.append("config.yaml")
        
        if missing_files:
            log.error(f"Missing required files: {missing_files}")
            return {"status": "error", "message": f"Missing files: {', '.join(missing_files)}"}
        
        log.info(f"Bot instance {instance_id} validation successful")
        return {"status": "success", "message": "Validation passed"}
        
    except Exception as e:
        log.error(f"Error validating bot {instance_id}: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.task(name="tasks.run_bot")
def run_bot(instance_id: str, config_dir: str):
    """Run bot instance - stub implementation"""
    log.info(f"Starting bot run for instance {instance_id} in {config_dir}")
    
    try:
        # Create logs directory
        logs_dir = Path("/data/tenants") / "default" / instance_id / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Create timestamped log file
        timestamp = int(time.time())
        log_file = logs_dir / f"run_{timestamp}.log"
        
        # Write initial log entry
        with open(log_file, "w") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting bot run for instance {instance_id}\n")
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Config directory: {config_dir}\n")
        
        log.info(f"Created log file: {log_file}")
        
        # Simulate bot work (sleep for 2 seconds as requested)
        time.sleep(2)
        
        # Write success message
        with open(log_file, "a") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Bot run completed successfully\n")
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] SUCCESS\n")
        
        log.info(f"Bot run completed for instance {instance_id}")
        return {"status": "success", "message": "Bot run completed", "log_file": str(log_file)}
        
    except Exception as e:
        log.error(f"Error running bot {instance_id}: {str(e)}")
        return {"status": "error", "message": str(e)}
