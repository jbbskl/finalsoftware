from fastapi import FastAPI
from pydantic import BaseModel
import os
import sys
import datetime

# Import environment validation and configuration
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from env_validation import get_config, setup_logging, EnvValidationError

# Import rate limiting and security middleware
from rate_limiter import rate_limit_middleware, configure_rate_limiter
from security import setup_security_middleware, setup_request_logging
from error_handler import setup_error_handlers

from routers import configs, schedules, runs, billing, bot_instances, phases, monitoring, admin, affiliate, health

# Setup logging first
setup_logging()

# Validate environment variables at startup
try:
    config = get_config()
except EnvValidationError as e:
    print(f"❌ Environment validation failed: {e}")
    sys.exit(1)

app = FastAPI(title="Control Plane API")

# Configure rate limiter
configure_rate_limiter(config["rate_limit_per_minute"])

# Setup error handlers
setup_error_handlers(app)

# Setup security middleware
setup_security_middleware(app, config)

# Setup request logging
setup_request_logging(app)

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
