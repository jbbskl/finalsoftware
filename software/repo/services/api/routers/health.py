"""
Health check endpoint with system status monitoring.
"""

import os
import sys
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

# Add lib path for health checker
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from health import get_health_status, get_readiness_status

router = APIRouter(prefix="/api", tags=["health"])


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, Any]
    system: Dict[str, Any]


class ReadinessResponse(BaseModel):
    ready: bool
    timestamp: str
    checks: Dict[str, Any]


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint.
    
    Checks:
    - Database connectivity and migrations
    - Redis connectivity
    - Worker status
    - S3/MinIO connectivity (if configured)
    - System metrics
    
    Returns:
        HealthResponse with detailed status of all components
    """
    health_status = await get_health_status()
    return HealthResponse(**health_status)


@router.get("/healthz", response_model=HealthResponse)
async def healthz():
    """
    Kubernetes-style health check endpoint.
    
    Returns:
        HealthResponse with status of all components
    """
    health_status = await get_health_status()
    return HealthResponse(**health_status)


@router.get("/readyz", response_model=ReadinessResponse)
async def readyz():
    """
    Kubernetes-style readiness check endpoint.
    
    Checks:
    - Database connectivity and migrations applied
    - Redis connectivity
    
    Returns:
        ReadinessResponse with readiness status
    """
    readiness_status = await get_readiness_status()
    return ReadinessResponse(**readiness_status)