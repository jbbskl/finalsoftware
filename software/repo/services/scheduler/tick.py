import os, time, datetime
from croniter import croniter
import requests
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://app:app@db:5432/app")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# API endpoint for enqueueing runs
API_BASE_URL = "http://api:8000"

INTERVAL = int(os.getenv("SCHED_INTERVAL_SEC", "30"))

def get_due_schedules(db_session):
    """Get schedules that are due to run"""
    now = datetime.datetime.utcnow()
    
    # Query for active schedules where next_fire_at <= now
    result = db_session.execute(text("""
        SELECT s.id, s.org_id, s.bot_id, s.config_id, s.cron_expr, s.timezone, s.phase_json,
               bv.image_ref
        FROM schedules s
        JOIN bot_configs bc ON s.config_id = bc.id
        JOIN bots b ON s.bot_id = b.id
        JOIN bot_versions bv ON b.current_version = bv.id
        WHERE s.is_active = true AND s.next_fire_at <= :now
    """), {"now": now})
    
    return result.fetchall()

def advance_schedule_next_fire(db_session, schedule_id, cron_expr):
    """Advance the next_fire_at time for a schedule"""
    try:
        cron = croniter(cron_expr, datetime.datetime.utcnow())
        next_fire_at = cron.get_next(datetime.datetime)
        
        db_session.execute(text("""
            UPDATE schedules 
            SET next_fire_at = :next_fire_at 
            WHERE id = :schedule_id
        """), {"next_fire_at": next_fire_at, "schedule_id": schedule_id})
        
        db_session.commit()
        return next_fire_at
    except Exception as e:
        print(f"[scheduler] Error advancing schedule {schedule_id}: {e}")
        db_session.rollback()
        return None

def create_run_via_api(schedule_data):
    """Create a run via API call"""
    try:
        run_id = str(uuid.uuid4())
        payload = {
            "bot_id": schedule_data.bot_id,
            "config_id": schedule_data.config_id,
            "schedule_id": schedule_data.id,
            "image_ref": schedule_data.image_ref
        }
        
        response = requests.post(f"{API_BASE_URL}/v1/runs", json=payload, timeout=10)
        if response.status_code == 200:
            print(f"[scheduler] Created run {run_id} for schedule {schedule_data.id}")
            return True
        else:
            print(f"[scheduler] Failed to create run: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[scheduler] Error creating run: {e}")
        return False

def main():
    print("[scheduler] starting")
    while True:
        try:
            db_session = SessionLocal()
            
            # Get due schedules
            due_schedules = get_due_schedules(db_session)
            
            for schedule in due_schedules:
                print(f"[scheduler] Processing due schedule {schedule.id}")
                
                # Create run via API
                if create_run_via_api(schedule):
                    # Advance the schedule's next_fire_at
                    advance_schedule_next_fire(db_session, schedule.id, schedule.cron_expr)
                else:
                    print(f"[scheduler] Failed to process schedule {schedule.id}")
            
            db_session.close()
            
        except Exception as e:
            print(f"[scheduler] Error in main loop: {e}")
        
        print(f"[scheduler] tick {datetime.datetime.utcnow().isoformat()}Z")
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
