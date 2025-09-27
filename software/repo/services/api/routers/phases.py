"""
Phases CRUD API for bot instances.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from db import get_db
from models import Phase, BotInstance, Schedule
from schemas import PhaseCreate, PhaseUpdate, PhaseRead

router = APIRouter(prefix="/api", tags=["phases"])


@router.get("/bot-instances/{instance_id}/phases", response_model=List[PhaseRead])
async def list_phases(instance_id: str, db: Session = Depends(get_db)):
    """
    List phases for a bot instance, ordered by order_no.
    """
    # Verify bot instance exists
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Get phases ordered by order_no
    phases = db.query(Phase).filter(
        Phase.bot_instance_id == instance_id
    ).order_by(Phase.order_no).all()
    
    return phases


@router.post("/bot-instances/{instance_id}/phases", response_model=PhaseRead)
async def create_phase(
    instance_id: str,
    phase_data: PhaseCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new phase for a bot instance.
    """
    # Verify bot instance exists
    instance = db.query(BotInstance).filter(BotInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Validate order_no range
    if not (1 <= phase_data.order_no <= 200):
        raise HTTPException(
            status_code=422, 
            detail="order_no must be between 1 and 200"
        )
    
    # Check for duplicate order_no
    existing = db.query(Phase).filter(
        Phase.bot_instance_id == instance_id,
        Phase.order_no == phase_data.order_no
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=422,
            detail=f"Phase with order_no {phase_data.order_no} already exists"
        )
    
    # Validate config_json is valid JSON
    try:
        if not isinstance(phase_data.config_json, dict):
            raise ValueError("config_json must be a valid JSON object")
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid config_json: {str(e)}"
        )
    
    # Create phase
    phase = Phase(
        id=str(uuid.uuid4()),
        bot_instance_id=instance_id,
        name=phase_data.name,
        order_no=phase_data.order_no,
        config_json=phase_data.config_json
    )
    
    db.add(phase)
    db.commit()
    db.refresh(phase)
    
    return phase


@router.put("/phases/{phase_id}", response_model=PhaseRead)
async def update_phase(
    phase_id: str,
    phase_data: PhaseUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing phase.
    """
    # Get phase
    phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Update fields if provided
    if phase_data.name is not None:
        phase.name = phase_data.name
    
    if phase_data.order_no is not None:
        # Validate order_no range
        if not (1 <= phase_data.order_no <= 200):
            raise HTTPException(
                status_code=422, 
                detail="order_no must be between 1 and 200"
            )
        
        # Check for duplicate order_no (excluding current phase)
        existing = db.query(Phase).filter(
            Phase.bot_instance_id == phase.bot_instance_id,
            Phase.order_no == phase_data.order_no,
            Phase.id != phase_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=422,
                detail=f"Phase with order_no {phase_data.order_no} already exists"
            )
        
        phase.order_no = phase_data.order_no
    
    if phase_data.config_json is not None:
        # Validate config_json is valid JSON
        try:
            if not isinstance(phase_data.config_json, dict):
                raise ValueError("config_json must be a valid JSON object")
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid config_json: {str(e)}"
            )
        
        phase.config_json = phase_data.config_json
    
    db.commit()
    db.refresh(phase)
    
    return phase


@router.delete("/phases/{phase_id}")
async def delete_phase(phase_id: str, db: Session = Depends(get_db)):
    """
    Delete a phase. Block if referenced by future schedules.
    """
    # Get phase
    phase = db.query(Phase).filter(Phase.id == phase_id).first()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Check for future schedules referencing this phase
    from datetime import datetime
    now = datetime.utcnow()
    
    future_schedules = db.query(Schedule).filter(
        Schedule.phase_id == phase_id,
        Schedule.start_at > now
    ).count()
    
    if future_schedules > 0:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot delete phase: {future_schedules} future schedule(s) reference it"
        )
    
    # Delete phase
    db.delete(phase)
    db.commit()
    
    return {"ok": True}