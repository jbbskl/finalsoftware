"""
Celery Beat scheduler for dispatching due schedules.
"""

import os
import sys
import uuid
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from celery.utils.log import get_task_logger

from celery_app import app

log = get_task_logger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://app:app@db:5432/app")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.task(name="tasks.scan_and_dispatch", bind=True)
def scan_and_dispatch(self):
    """
    Periodic task to scan for due schedules and dispatch them.
    Runs every 60 seconds via Celery Beat.
    """
    log.info("Scanning for due schedules...")
    
    db = SessionLocal()
    try:
        # Import models here to avoid circular imports
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))
        from models import Schedule, BotInstance, Run
        
        # Query for schedules within dispatch window
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=2)
        
        due_schedules = db.query(Schedule).filter(
            Schedule.start_at <= now,
            Schedule.start_at > window_start,
            Schedule.dispatched_at.is_(None)
        ).all()
        
        dispatched_count = 0
        
        for schedule in due_schedules:
            try:
                # Get bot instance
                bot_instance = db.query(BotInstance).filter(
                    BotInstance.id == schedule.bot_instance_id
                ).first()
                
                if not bot_instance:
                    log.error(f"Bot instance not found for schedule {schedule.id}")
                    continue
                
                # Check for existing runs at the same time (idempotency)
                existing_run = db.query(Run).filter(
                    Run.bot_id == bot_instance.bot_code,
                    Run.org_id == bot_instance.owner_id,
                    Run.status.in_(['queued', 'running']),
                    Run.queued_at >= schedule.start_at - timedelta(minutes=1),
                    Run.queued_at <= schedule.start_at + timedelta(minutes=1)
                ).first()
                
                if existing_run:
                    log.info(f"Run already exists for schedule {schedule.id}, skipping")
                    # Mark as dispatched to avoid repeated checks
                    schedule.dispatched_at = now
                    db.commit()
                    continue
                
                # Create run record
                run_id = str(uuid.uuid4())
                
                # Prepare run metadata
                meta = {
                    "schedule_id": schedule.id,
                    "kind": schedule.kind,
                    "phase_id": schedule.phase_id,
                    "payload": schedule.payload_json
                }
                
                # Create run
                run = Run(
                    id=run_id,
                    org_id=bot_instance.owner_id,
                    bot_id=bot_instance.bot_code,
                    config_id=str(uuid.uuid4()),  # Generate config_id
                    schedule_id=schedule.id,
                    status='queued',
                    image_ref=f"bot-{bot_instance.bot_code}:latest",
                    summary_json=meta
                )
                
                db.add(run)
                db.commit()
                
                # Get config directory
                tenant_base = f"/data/tenants/{bot_instance.owner_type}-{bot_instance.owner_id}"
                config_dir = f"{tenant_base}/bots/{bot_instance.id}"
                
                # Prepare config
                import yaml
                config_path = f"{config_dir}/config.yaml"
                if os.path.exists(config_path):
                    with open(config_path, 'r') as f:
                        config = yaml.safe_load(f)
                else:
                    config = {"bot_code": bot_instance.bot_code}
                
                # Add schedule metadata to config
                config["schedule_meta"] = meta
                
                # Call run_bot task
                task = app.send_task(
                    'tasks.run_bot',
                    args=[f"bot-{bot_instance.bot_code}:latest", run_id, config],
                    queue='celery'
                )
                
                log.info(f"Dispatched schedule {schedule.id} as run {run_id} with task {task.id}")
                
                # Mark schedule as dispatched
                schedule.dispatched_at = now
                db.commit()
                
                dispatched_count += 1
                
            except Exception as e:
                log.error(f"Error dispatching schedule {schedule.id}: {e}")
                db.rollback()
                continue
        
        log.info(f"Dispatched {dispatched_count} schedules")
        
    except Exception as e:
        log.error(f"Error in scan_and_dispatch: {e}")
        db.rollback()
    finally:
        db.close()


# Configure Celery Beat schedule
app.conf.beat_schedule = {
    'scan-and-dispatch': {
        'task': 'tasks.scan_and_dispatch',
        'schedule': 60.0,  # Run every 60 seconds
    },
}
app.conf.timezone = 'UTC'