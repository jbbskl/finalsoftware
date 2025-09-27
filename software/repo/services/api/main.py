from fastapi import FastAPI
from pydantic import BaseModel
import os
import datetime

# Import rate limiting middleware
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from rate_limiter import rate_limit_middleware

from routers import configs, schedules, runs, billing, bot_instances, phases, monitoring, admin, affiliate, health

app = FastAPI(title="Control Plane API")

# Add rate limiting middleware
app.middleware("http")(rate_limit_middleware())

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
app.include_router(monitoring.router)
app.include_router(admin.router)
app.include_router(affiliate.router)
app.include_router(health.router)
