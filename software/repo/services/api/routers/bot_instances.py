"""
Bot instance management endpoints for cookies, validate, start/stop, logs.
"""

import os
import uuid
import json
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from db import get_db
from models import BotInstance, Run
from schemas import (
    BotInstanceRead, 
    UploadCookiesResponse,
    ValidateResponse,
    StartRunResponse,
    StopRunResponse
)

# Import lib modules with proper path handling
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from owners import get_tenant_base_path
from crypto import encrypt_bot_cookies, get_cookie_key_from_env, CryptoError

router = APIRouter(prefix="/api/bot-instances", tags=["bot-instances"])


@router.get("/{instance_id}", response_model=BotInstanceRead)
async def get_bot_instance(instance_id: str, db: Session = Depends(get_db)):
    """Get bot instance details."""
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    return BotInstanceRead.from_orm(instance)


@router.post("/{instance_id}/upload-cookies", response_model=UploadCookiesResponse)
async def upload_cookies(
    instance_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload cookies file for bot instance.
    Writes to /data/tenants/{ownerType}-{ownerId}/bots/{botInstanceId}/secrets/storageState.json
    """
    # Get bot instance
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Ensure directory exists
    tenant_base = get_tenant_base_path(instance.owner_type, instance.owner_id)
    secrets_dir = f"{tenant_base}/bots/{instance_id}/secrets"
    os.makedirs(secrets_dir, exist_ok=True)
    
    # Write and encrypt file
    temp_file_path = f"{secrets_dir}/storageState_temp.json"
    encrypted_file_path = f"{secrets_dir}/storageState.enc"
    
    try:
        # Get cookie encryption key
        cookie_key = get_cookie_key_from_env()
        
        # Write to temporary file first
        content = await file.read()
        with open(temp_file_path, 'wb') as f:
            f.write(content)
        
        # Encrypt the file
        encrypt_bot_cookies(temp_file_path, encrypted_file_path, cookie_key)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return UploadCookiesResponse(ok=True)
    except CryptoError as e:
        # Clean up on crypto error
        for path in [temp_file_path, encrypted_file_path]:
            if os.path.exists(path):
                os.unlink(path)
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")
    except Exception as e:
        # Clean up on any error
        for path in [temp_file_path, encrypted_file_path]:
            if os.path.exists(path):
                os.unlink(path)
        raise HTTPException(status_code=500, detail=f"Failed to upload cookies: {str(e)}")


@router.post("/{instance_id}/validate", response_model=ValidateResponse)
async def validate_instance(instance_id: str, db: Session = Depends(get_db)):
    """
    Validate bot instance configuration.
    Calls Celery task validate_bot(instanceId, configDir).
    """
    # Get bot instance
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Update validation status
    instance.validation_status = 'pending'
    instance.last_validated_at = datetime.utcnow()
    db.commit()
    
    # Get config directory
    tenant_base = get_tenant_base_path(instance.owner_type, instance.owner_id)
    config_dir = f"{tenant_base}/bots/{instance_id}"
    
    # Call Celery task (stubbed for now)
    try:
        # Import Celery app
        from celery_app import app
        
        # Call validate task
        task = app.send_task(
            'tasks.validate_bot',
            args=[instance_id, config_dir],
            queue='celery'
        )
        
        return ValidateResponse(
            job_id=task.id,
            status='queued'
        )
    except ImportError:
        # Fallback for development - simulate validation
        return ValidateResponse(
            job_id=str(uuid.uuid4()),
            status='queued'
        )


@router.post("/{instance_id}/start", response_model=StartRunResponse)
async def start_instance(instance_id: str, db: Session = Depends(get_db)):
    """
    Start bot instance run.
    Creates run row and calls Celery task run_bot(instanceId, configDir).
    """
    # Get bot instance
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Create run record
    run_id = str(uuid.uuid4())
    tenant_base = get_tenant_base_path(instance.owner_type, instance.owner_id)
    config_dir = f"{tenant_base}/bots/{instance_id}"
    
    # Create run record
    run = Run(
        id=run_id,
        org_id=instance.owner_id,  # Using owner_id as org_id for now
        bot_id=instance.bot_code,  # Using bot_code as bot_id for now
        config_id=str(uuid.uuid4()),  # Generate config_id
        status='queued',
        image_ref=f"bot-{instance.bot_code}:latest"  # Default image ref
    )
    
    db.add(run)
    db.commit()
    
    # Call Celery task
    try:
        from celery_app import app
        
        # Read config file
        config_path = f"{config_dir}/config.yaml"
        if os.path.exists(config_path):
            import yaml
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
        else:
            config = {"bot_code": instance.bot_code}
        
        # Call run task
        task = app.send_task(
            'tasks.run_bot',
            args=[f"bot-{instance.bot_code}:latest", run_id, config],
            queue='celery'
        )
        
        return StartRunResponse(run_id=run_id, status='queued')
        
    except ImportError:
        # Fallback for development
        return StartRunResponse(run_id=run_id, status='queued')


@router.post("/{instance_id}/stop", response_model=StopRunResponse)
async def stop_instance(instance_id: str, db: Session = Depends(get_db)):
    """
    Stop bot instance.
    Marks latest active run as stopped in DB.
    TODO: later send kill signal to container.
    """
    # Get bot instance
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Find latest active run for this instance
    latest_run = db.query(Run).filter(
        Run.bot_id == instance.bot_code,
        Run.org_id == instance.owner_id,
        Run.status.in_(['queued', 'running'])
    ).order_by(Run.queued_at.desc()).first()
    
    if latest_run:
        latest_run.status = 'stopped'
        latest_run.finished_at = datetime.utcnow()
        db.commit()
    
    return StopRunResponse(ok=True)


@router.get("/{instance_id}/logs/stream")
async def stream_logs(instance_id: str, db: Session = Depends(get_db)):
    """
    Stream bot instance logs via Server-Sent Events.
    Tails latest logs/run-<timestamp>.log file in instance's /logs/ dir.
    """
    # Get bot instance
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Get logs directory
    tenant_base = get_tenant_base_path(instance.owner_type, instance.owner_id)
    logs_dir = f"{tenant_base}/bots/{instance_id}/logs"
    
    # Find latest log file
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir, exist_ok=True)
    
    # For now, create a dummy log file for testing
    log_file = f"{logs_dir}/run-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"
    if not os.path.exists(log_file):
        with open(log_file, 'w') as f:
            f.write(f"Starting bot instance {instance_id}...\n")
            f.write(f"Bot code: {instance.bot_code}\n")
            f.write(f"Status: {instance.status}\n")
    
    async def generate_logs():
        """Generate SSE log stream."""
        try:
            with open(log_file, 'r') as f:
                # Read existing content
                content = f.read()
                if content:
                    yield f"data: {content.strip()}\n\n"
                
                # Tail new content
                f.seek(0, 2)  # Go to end of file
                while True:
                    line = f.readline()
                    if line:
                        yield f"data: {line.strip()}\n\n"
                    else:
                        await asyncio.sleep(0.1)
        except Exception as e:
            yield f"data: Error reading logs: {str(e)}\n\n"
    
    return StreamingResponse(
        generate_logs(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/{instance_id}/runs")
async def get_instance_runs(instance_id: str, db: Session = Depends(get_db)):
    """Get all runs for a bot instance."""
    # Get bot instance
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Get runs for this instance
    runs = db.query(Run).filter(
        Run.bot_id == instance.bot_code,
        Run.org_id == instance.owner_id
    ).order_by(Run.queued_at.desc()).all()
    
    return runs


@router.post("/{instance_id}/validate/complete")
async def complete_validation(
    instance_id: str, 
    result: dict,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint to handle validation completion from Celery task.
    This would typically be called by a Celery result backend webhook.
    """
    # Get bot instance
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Update validation status based on result
    if result.get("status") == "valid":
        instance.validation_status = "valid"
    else:
        instance.validation_status = "invalid"
    
    instance.last_validated_at = datetime.utcnow()
    db.commit()
    
    return {"ok": True}