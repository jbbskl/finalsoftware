"""
Health check endpoint with system status monitoring.
"""

import os
import redis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from db import get_db

router = APIRouter(prefix="/api", tags=["health"])


class HealthResponse(BaseModel):
    ok: bool
    db: bool
    redis: bool
    worker: Optional[bool] = None


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check endpoint.
    
    Checks:
    - Database connectivity
    - Redis connectivity  
    - Worker status (optional)
    
    Returns:
        HealthResponse with status of each component
    """
    health_status = {
        "ok": True,
        "db": False,
        "redis": False,
        "worker": None
    }
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        health_status["db"] = True
    except Exception as e:
        health_status["ok"] = False
    
    # Check Redis
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(redis_url)
        r.ping()
        health_status["redis"] = True
    except Exception as e:
        health_status["ok"] = False
    
    # Check worker (optional)
    try:
        # Try to get a worker status from Redis
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(redis_url)
        
        # Check if there are any worker keys in Redis
        worker_keys = r.keys("celery*")
        if worker_keys:
            health_status["worker"] = True
        else:
            health_status["worker"] = False
    except Exception:
        # Worker check is optional, don't fail health check
        health_status["worker"] = None
    
    return HealthResponse(**health_status)