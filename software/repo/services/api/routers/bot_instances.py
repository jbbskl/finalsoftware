from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
import json
import asyncio
from pathlib import Path
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/bot-instances", tags=["bot-instances"])

class BotInstanceResponse(BaseModel):
    id: str
    name: str
    platform: str
    status: str

class ValidateResponse(BaseModel):
    valid: bool
    message: str

class StartResponse(BaseModel):
    run_id: str
    status: str

class StopResponse(BaseModel):
    status: str
    message: str

@router.post("/{instance_id}/upload-cookies")
async def upload_cookies(
    instance_id: str,
    file: UploadFile = File(...),
    owner: str = "default"
):
    """Upload cookies file for a bot instance"""
    try:
        # Create directory structure: /data/tenants/{owner}/{id}/secrets/
        secrets_dir = Path(f"/data/tenants/{owner}/{instance_id}/secrets")
        secrets_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file as storageState.json
        file_path = secrets_dir / "storageState.json"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return {"status": "success", "message": f"Cookies uploaded to {file_path}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload cookies: {str(e)}")

@router.post("/{instance_id}/validate", response_model=ValidateResponse)
async def validate_bot(instance_id: str, owner: str = "default"):
    """Validate bot instance configuration"""
    try:
        # Check if secrets/storageState.json exists
        secrets_dir = Path(f"/data/tenants/{owner}/{instance_id}/secrets")
        storage_state_path = secrets_dir / "storageState.json"
        config_path = secrets_dir / "config.yaml"
        
        if not storage_state_path.exists():
            return ValidateResponse(
                valid=False, 
                message="storageState.json not found"
            )
        
        if not config_path.exists():
            return ValidateResponse(
                valid=False,
                message="config.yaml not found"
            )
        
        # TODO: Add actual validation logic here
        # For now, just check if files exist
        return ValidateResponse(
            valid=True,
            message="Bot configuration is valid"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.post("/{instance_id}/start", response_model=StartResponse)
async def start_bot(instance_id: str, background_tasks: BackgroundTasks):
    """Start a bot instance"""
    try:
        # Generate run ID
        run_id = str(uuid.uuid4())
        
        # TODO: Insert run record into database
        # For now, just create a log file
        logs_dir = Path("/app/logs")
        logs_dir.mkdir(exist_ok=True)
        
        log_file = logs_dir / f"run_{run_id}.log"
        
        # Start background task
        background_tasks.add_task(run_bot_task, instance_id, run_id, str(log_file))
        
        return StartResponse(
            run_id=run_id,
            status="queued"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start bot: {str(e)}")

@router.post("/{instance_id}/stop", response_model=StopResponse)
async def stop_bot(instance_id: str):
    """Stop a bot instance"""
    try:
        # TODO: Implement actual stopping logic
        # For now, just return success
        return StopResponse(
            status="stopped",
            message="Bot stop requested"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop bot: {str(e)}")

@router.get("/{instance_id}/logs/stream")
async def stream_logs(instance_id: str, run_id: Optional[str] = None):
    """Stream logs for a bot instance"""
    try:
        logs_dir = Path("/app/logs")
        
        # Find the latest log file if run_id not specified
        if not run_id:
            log_files = list(logs_dir.glob(f"run_*.log"))
            if not log_files:
                raise HTTPException(status_code=404, detail="No log files found")
            log_file = max(log_files, key=lambda f: f.stat().st_mtime)
        else:
            log_file = logs_dir / f"run_{run_id}.log"
            if not log_file.exists():
                raise HTTPException(status_code=404, detail="Log file not found")
        
        def generate_logs():
            with open(log_file, 'r') as f:
                # Read existing content
                content = f.read()
                yield f"data: {json.dumps({'type': 'content', 'data': content})}\n\n"
                
                # Tail new content
                f.seek(0, 2)  # Go to end of file
                while True:
                    line = f.readline()
                    if line:
                        yield f"data: {json.dumps({'type': 'line', 'data': line.strip()})}\n\n"
                    else:
                        yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                        asyncio.sleep(1)
        
        return StreamingResponse(
            generate_logs(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream logs: {str(e)}")

async def run_bot_task(instance_id: str, run_id: str, log_file_path: str):
    """Background task to run bot"""
    try:
        # Write initial log
        with open(log_file_path, 'w') as f:
            f.write(f"[{datetime.now().isoformat()}] Starting bot run {run_id}\n")
            f.write(f"[{datetime.now().isoformat()}] Bot instance: {instance_id}\n")
        
        # Simulate bot work (sleep 2 seconds as per requirements)
        await asyncio.sleep(2)
        
        # Write success message
        with open(log_file_path, 'a') as f:
            f.write(f"[{datetime.now().isoformat()}] SUCCESS\n")
    
    except Exception as e:
        # Write error message
        with open(log_file_path, 'a') as f:
            f.write(f"[{datetime.now().isoformat()}] ERROR: {str(e)}\n")