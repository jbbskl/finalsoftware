from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime
import requests
import os

from db import get_db
from models import Run, RunEvent
from schemas import RunCreate, RunRead, RunEventRead, DevRunRequest, DevRunResponse

router = APIRouter(prefix="/v1/runs", tags=["runs"])

# Hardcoded dev org for now
DEV_ORG_ID = "dev-org"

@router.post("/", response_model=RunRead)
def create_run(run: RunCreate, db: Session = Depends(get_db)):
    db_run = Run(
        id=str(uuid.uuid4()),
        org_id=DEV_ORG_ID,
        bot_id=run.bot_id,
        config_id=run.config_id,
        schedule_id=run.schedule_id,
        status="queued",
        image_ref=run.image_ref
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

@router.get("/{run_id}", response_model=RunRead)
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.id == run_id, Run.org_id == DEV_ORG_ID).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.get("/{run_id}/events", response_model=List[RunEventRead])
def get_run_events(run_id: str, db: Session = Depends(get_db)):
    # Verify run exists and belongs to dev org
    run = db.query(Run).filter(Run.id == run_id, Run.org_id == DEV_ORG_ID).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    events = db.query(RunEvent).filter(RunEvent.run_id == run_id).order_by(RunEvent.ts).all()
    return events

@router.post("/{run_id}/events")
def create_run_event(run_id: str, event: dict, db: Session = Depends(get_db)):
    # Verify run exists and belongs to dev org
    run = db.query(Run).filter(Run.id == run_id, Run.org_id == DEV_ORG_ID).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    db_event = RunEvent(
        id=str(uuid.uuid4()),
        run_id=run_id,
        level=event.get("level", "info"),
        code=event.get("code"),
        message=event.get("message", ""),
        data_json=event.get("data")
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return {"id": db_event.id}

@router.post("/dev", response_model=DevRunResponse)
def enqueue_dev_run(request: DevRunRequest, db: Session = Depends(get_db)):
    # Create a run record
    db_run = Run(
        id=request.run_id,
        org_id=DEV_ORG_ID,
        bot_id="dev-bot",  # Hardcoded for dev
        config_id="dev-config",  # Hardcoded for dev
        status="queued",
        image_ref=request.image_ref
    )
    db.add(db_run)
    db.commit()
    
    # Enqueue Celery task
    try:
        # Import here to avoid circular imports
        from celery_app import app
        app.send_task("tasks.run_bot", args=[request.image_ref, request.run_id, request.config])
        return DevRunResponse(enqueued=True, run_id=request.run_id)
    except Exception as e:
        # Clean up the run record if enqueue fails
        db.delete(db_run)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to enqueue task: {str(e)}")
