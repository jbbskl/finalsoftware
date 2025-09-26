from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime
from croniter import croniter

from db import get_db
from models import Schedule
from schemas import ScheduleCreate, ScheduleRead

router = APIRouter(prefix="/v1/schedules", tags=["schedules"])

# Hardcoded dev org for now
DEV_ORG_ID = "dev-org"

@router.post("/", response_model=ScheduleRead)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    # Calculate next_fire_at from cron expression
    try:
        cron = croniter(schedule.cron_expr, datetime.utcnow())
        next_fire_at = cron.get_next(datetime)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid cron expression: {str(e)}")
    
    db_schedule = Schedule(
        id=str(uuid.uuid4()),
        org_id=DEV_ORG_ID,
        bot_id=schedule.bot_id,
        config_id=schedule.config_id,
        cron_expr=schedule.cron_expr,
        timezone=schedule.timezone,
        phase_json=schedule.phase_json,
        is_active=schedule.is_active,
        next_fire_at=next_fire_at
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.get("/", response_model=List[ScheduleRead])
def list_schedules(db: Session = Depends(get_db)):
    schedules = db.query(Schedule).filter(Schedule.org_id == DEV_ORG_ID).all()
    return schedules
