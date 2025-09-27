from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import json
import time
from pathlib import Path
from celery_app import app as celery_app

from db import get_db
from models import BotInstance, Run

router = APIRouter(prefix="/api/bot-instances", tags=["bot-instances"])

class BotInstanceResponse(BaseModel):
    id: str
    name: str
    platform: str
    status: str
    created_at: str

class RunResponse(BaseModel):
    id: str
    status: str
    queued_at: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None

@router.post("/{instance_id}/upload-cookies")
async def upload_cookies(
    instance_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload cookies file for a bot instance"""
    try:
        # Get bot instance
        bot_instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
        if not bot_instance:
            raise HTTPException(status_code=404, detail="Bot instance not found")
        
        # Create directory structure: /data/tenants/{owner}/{id}/secrets/
        owner = "default"  # For now, use default owner
        secrets_dir = Path(f"/data/tenants/{owner}/{instance_id}/secrets")
        secrets_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file as storageState.json
        file_path = secrets_dir / "storageState.json"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return {"status": "success", "message": f"Cookies uploaded to {file_path}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{instance_id}/validate")
async def validate_bot_instance(
    instance_id: str,
    db: Session = Depends(get_db)
):
    """Validate bot instance configuration"""
    try:
        # Get bot instance
        bot_instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
        if not bot_instance:
            raise HTTPException(status_code=404, detail="Bot instance not found")
        
        # Get config directory
        config_dir = bot_instance.config_dir or f"/data/tenants/default/{instance_id}"
        
        # Queue validation task
        task = celery_app.send_task(
            "tasks.validate_bot",
            args=[instance_id, config_dir]
        )
        
        return {"status": "queued", "task_id": task.id, "message": "Validation task queued"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{instance_id}/start")
async def start_bot_instance(
    instance_id: str,
    db: Session = Depends(get_db)
):
    """Start a bot instance run"""
    try:
        # Get bot instance
        bot_instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
        if not bot_instance:
            raise HTTPException(status_code=404, detail="Bot instance not found")
        
        # Create new run record
        run = Run(
            id=f"run_{int(time.time())}_{instance_id}",
            bot_instance_id=instance_id,
            status="queued",
            queued_at=time.time()
        )
        db.add(run)
        db.commit()
        
        # Get config directory
        config_dir = bot_instance.config_dir or f"/data/tenants/default/{instance_id}"
        
        # Queue run task
        task = celery_app.send_task(
            "tasks.run_bot",
            args=[instance_id, config_dir]
        )
        
        return {
            "status": "queued", 
            "run_id": run.id,
            "task_id": task.id,
            "message": "Bot run queued"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{instance_id}/stop")
async def stop_bot_instance(
    instance_id: str,
    db: Session = Depends(get_db)
):
    """Stop a bot instance (mark latest run as stopped)"""
    try:
        # Get latest run for this bot instance
        latest_run = db.query(Run).filter(
            Run.bot_instance_id == instance_id
        ).order_by(Run.queued_at.desc()).first()
        
        if not latest_run:
            raise HTTPException(status_code=404, detail="No runs found for this bot instance")
        
        # Mark as stopped
        latest_run.status = "stopped"
        latest_run.finished_at = time.time()
        db.commit()
        
        return {"status": "success", "message": "Bot instance stopped", "run_id": latest_run.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{instance_id}/logs/stream")
async def stream_logs(instance_id: str):
    """Stream logs for a bot instance using Server-Sent Events"""
    try:
        # Find the latest log file
        logs_dir = Path(f"/data/tenants/default/{instance_id}/logs")
        if not logs_dir.exists():
            raise HTTPException(status_code=404, detail="No logs found")
        
        # Get the most recent log file
        log_files = list(logs_dir.glob("*.log"))
        if not log_files:
            raise HTTPException(status_code=404, detail="No log files found")
        
        latest_log = max(log_files, key=lambda f: f.stat().st_mtime)
        
        def generate_log_stream():
            with open(latest_log, 'r') as f:
                for line in f:
                    yield f"data: {line}\n\n"
                    time.sleep(0.1)  # Small delay to simulate streaming
        
        return StreamingResponse(
            generate_log_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{instance_id}")
async def get_bot_instance(instance_id: str, db: Session = Depends(get_db)):
    """Get bot instance details"""
    bot_instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not bot_instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    return BotInstanceResponse(
        id=bot_instance.id,
        name=bot_instance.name,
        platform=bot_instance.platform,
        status=bot_instance.status,
        created_at=bot_instance.created_at.isoformat()
    )