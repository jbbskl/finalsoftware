from fastapi import FastAPI
from pydantic import BaseModel
import os
import datetime
import subprocess
import sys

from routers import configs, schedules, runs, bot_instances

app = FastAPI(title="Control Plane API")

class Health(BaseModel):
    status: str
    time: str
    version: str = "0.1.0"

@app.on_event("startup")
async def startup_event():
    """Run database migrations on startup"""
    try:
        # Run migrations
        result = subprocess.run([
            sys.executable, 
            "/app/db/migrate.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Database migrations completed successfully")
        else:
            print(f"Migration failed: {result.stderr}")
            # Don't exit - let the service start anyway for debugging
    except Exception as e:
        print(f"Error running migrations: {e}")

@app.get("/health", response_model=Health)
@app.get("/healthz", response_model=Health)
def health():
    return Health(status="ok", time=datetime.datetime.utcnow().isoformat()+"Z")

# Include routers
app.include_router(configs.router)
app.include_router(schedules.router)
app.include_router(runs.router)
app.include_router(bot_instances.router)
