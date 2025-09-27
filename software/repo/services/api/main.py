from fastapi import FastAPI
from pydantic import BaseModel
import os
import datetime

from routers import configs, schedules, runs, billing, bot_instances, phases

app = FastAPI(title="Control Plane API")

class Health(BaseModel):
    status: str
    time: str
    version: str = "0.1.0"

@app.get("/healthz", response_model=Health)
def healthz():
    return Health(status="ok", time=datetime.datetime.utcnow().isoformat()+"Z")

# Include routers
app.include_router(configs.router)
app.include_router(schedules.router)
app.include_router(runs.router)
app.include_router(billing.router)
app.include_router(bot_instances.router)
app.include_router(phases.router)
