"""
Schedules CRUD API with time rules and day copy functionality.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from schedule_rules import (
    can_create, can_delete, parse_schedule_time, 
    copy_schedule_to_date, get_minute_key
)

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from db import get_db
from models import Schedule, BotInstance, Phase, Run
from schemas import (
    ScheduleCreate, ScheduleUpdate, ScheduleRead,
    CopyDayRequest, CopyDayResponse
)

router = APIRouter(prefix="/api", tags=["schedules"])


@router.get("/schedules", response_model=List[ScheduleRead])
async def list_schedules(
    bot_instance_id: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    List schedules within a date range.
    """
    query = db.query(Schedule)
    
    # Filter by bot instance
    if bot_instance_id:
        query = query.filter(Schedule.bot_instance_id == bot_instance_id)
    
    # Filter by date range
    if from_date:
        from_dt = parse_schedule_time(from_date + " 00:00")
        query = query.filter(Schedule.start_at >= from_dt)
    
    if to_date:
        to_dt = parse_schedule_time(to_date + " 23:59")
        query = query.filter(Schedule.start_at <= to_dt)
    
    schedules = query.order_by(Schedule.start_at).all()
    return schedules


@router.post("/schedules", response_model=ScheduleRead)
async def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new schedule.
    """
    # Verify bot instance exists
    instance = db.query(BotInstance).filter(
        BotInstance.id == schedule_data.bot_instance_id
    ).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Parse start_at
    try:
        start_at = parse_schedule_time(schedule_data.start_at)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Invalid start_at format: {str(e)}")
    
    # Validate kind and phase_id
    if schedule_data.kind == "phase":
        if not schedule_data.phase_id:
            raise HTTPException(status_code=422, detail="phase_id required for phase schedules")
        
        # Verify phase exists and belongs to same bot instance
        phase = db.query(Phase).filter(
            Phase.id == schedule_data.phase_id,
            Phase.bot_instance_id == schedule_data.bot_instance_id
        ).first()
        if not phase:
            raise HTTPException(status_code=404, detail="Phase not found")
    
    elif schedule_data.kind == "full":
        if schedule_data.phase_id:
            raise HTTPException(status_code=422, detail="phase_id not allowed for full schedules")
    
    else:
        raise HTTPException(status_code=422, detail="kind must be 'full' or 'phase'")
    
    # Enforce 1h create rule
    if not can_create(start_at):
        raise HTTPException(
            status_code=422,
            detail="Schedule must be created at least 1 hour in advance"
        )
    
    # Prevent overlapping runs (idempotency check)
    minute_key = get_minute_key(start_at)
    
    # Check for existing runs at the same minute
    existing_run = db.query(Run).filter(
        Run.bot_id == instance.bot_code,
        Run.org_id == instance.owner_id,
        Run.status.in_(['queued', 'running']),
        Run.queued_at >= start_at - timedelta(minutes=1),
        Run.queued_at <= start_at + timedelta(minutes=1)
    ).first()
    
    if existing_run:
        raise HTTPException(
            status_code=422,
            detail="A run is already scheduled for this bot at this time"
        )
    
    # Create schedule
    schedule = Schedule(
        id=str(uuid.uuid4()),
        bot_instance_id=schedule_data.bot_instance_id,
        kind=schedule_data.kind,
        phase_id=schedule_data.phase_id,
        payload_json=schedule_data.payload_json,
        start_at=start_at
    )
    
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return schedule


@router.patch("/schedules/{schedule_id}", response_model=ScheduleRead)
async def update_schedule(
    schedule_id: str,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a schedule. Clear dispatched_at if time changed to future.
    """
    # Get schedule
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Update fields if provided
    if schedule_data.start_at is not None:
        try:
            new_start_at = parse_schedule_time(schedule_data.start_at)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=f"Invalid start_at format: {str(e)}")
        
        # If time changed, recheck rules
        if new_start_at != schedule.start_at:
            if not can_create(new_start_at):
                raise HTTPException(
                    status_code=422,
                    detail="Updated schedule must be at least 1 hour in advance"
                )
            
            # Clear dispatched_at if moved to future
            if new_start_at > datetime.now():
                schedule.dispatched_at = None
        
        schedule.start_at = new_start_at
    
    if schedule_data.payload_json is not None:
        schedule.payload_json = schedule_data.payload_json
    
    db.commit()
    db.refresh(schedule)
    
    return schedule


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, db: Session = Depends(get_db)):
    """
    Delete a schedule. Enforce 10m delete rule.
    """
    # Get schedule
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Enforce 10m delete rule
    if not can_delete(schedule.start_at):
        raise HTTPException(
            status_code=422,
            detail="Schedule can only be deleted at least 10 minutes before start time"
        )
    
    # Delete schedule
    db.delete(schedule)
    db.commit()
    
    return {"ok": True}


@router.post("/schedules/copy-day", response_model=CopyDayResponse)
async def copy_day_schedules(
    copy_data: CopyDayRequest,
    db: Session = Depends(get_db)
):
    """
    Copy all schedules from one day to another.
    """
    # Verify bot instance exists
    instance = db.query(BotInstance).filter(
        BotInstance.id == copy_data.bot_instance_id
    ).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Bot instance not found")
    
    # Parse dates
    try:
        from datetime import datetime
        from_dt = datetime.strptime(copy_data.from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(copy_data.to_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get all schedules for the source day
    from_start = from_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    from_end = from_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    source_schedules = db.query(Schedule).filter(
        Schedule.bot_instance_id == copy_data.bot_instance_id,
        Schedule.start_at >= from_start,
        Schedule.start_at <= from_end
    ).all()
    
    copied_count = 0
    skipped_count = 0
    
    for source_schedule in source_schedules:
        # Calculate new start time
        new_start_at = copy_schedule_to_date(source_schedule.start_at, copy_data.to_date)
        
        # Apply create rule - skip if less than 1 hour in advance
        if not can_create(new_start_at):
            skipped_count += 1
            continue
        
        # Check for duplicate schedules at the same time
        existing = db.query(Schedule).filter(
            Schedule.bot_instance_id == copy_data.bot_instance_id,
            Schedule.start_at == new_start_at
        ).first()
        
        if existing:
            skipped_count += 1
            continue
        
        # Create new schedule
        new_schedule = Schedule(
            id=str(uuid.uuid4()),
            bot_instance_id=copy_data.bot_instance_id,
            kind=source_schedule.kind,
            phase_id=source_schedule.phase_id,
            payload_json=source_schedule.payload_json,
            start_at=new_start_at
        )
        
        db.add(new_schedule)
        copied_count += 1
    
    db.commit()
    
    return CopyDayResponse(
        copied_count=copied_count,
        skipped_count=skipped_count
    )