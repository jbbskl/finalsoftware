"""
Monitoring endpoints for runs listing, details, and overview aggregates.
"""

import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from rbac import RBACContext, get_current_user
from queries.runs import (
    get_runs_for_bot_instance, get_run_details,
    get_runs_today_count, get_runs_last_7d_count,
    get_error_runs_last_24h_count, get_active_bots_count,
    get_total_bots_count
)

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from db import get_db
from models import Run

router = APIRouter(prefix="/api", tags=["monitoring"])


class RunListResponse(BaseModel):
    id: str
    bot_id: str
    status: str
    queued_at: str
    started_at: Optional[str]
    finished_at: Optional[str]
    exit_code: Optional[int]
    error_code: Optional[str]
    summary_json: Optional[dict]

    class Config:
        from_attributes = True


class RunDetailResponse(BaseModel):
    id: str
    org_id: str
    bot_id: str
    config_id: str
    schedule_id: Optional[str]
    status: str
    queued_at: str
    started_at: Optional[str]
    finished_at: Optional[str]
    worker_host: Optional[str]
    image_ref: str
    exit_code: Optional[int]
    error_code: Optional[str]
    artifacts_url: Optional[str]
    cost_credits: Optional[int]
    summary_json: Optional[dict]

    class Config:
        from_attributes = True


class MonitoringOverviewResponse(BaseModel):
    bots_total: int
    bots_active: int
    runs_today: int
    runs_last_7d: int
    errors_last_24h: int


@router.get("/runs", response_model=List[RunListResponse])
async def list_runs(
    request: Request,
    bot_instance_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List runs with pagination and RBAC filtering.
    
    Args:
        bot_instance_id: Optional bot instance ID to filter by
        limit: Maximum number of results (1-100)
        offset: Offset for pagination
        db: Database session
    """
    rbac_context = get_current_user(request)
    
    if bot_instance_id:
        # Get runs for specific bot instance
        runs = get_runs_for_bot_instance(
            db, bot_instance_id, rbac_context, limit, offset
        )
    else:
        # Get runs for all bot instances owned by user
        if rbac_context.is_admin:
            # Admin sees all runs
            runs = db.query(Run).order_by(Run.queued_at.desc()).offset(offset).limit(limit).all()
        else:
            # Filter by owner
            from models import BotInstance
            bot_instances = db.query(BotInstance).filter(
                BotInstance.owner_type == rbac_context.owner_type,
                BotInstance.owner_id == rbac_context.owner_id
            ).all()
            
            bot_codes = [bi.bot_code for bi in bot_instances]
            owner_ids = [bi.owner_id for bi in bot_instances]
            
            if not bot_codes:
                runs = []
            else:
                runs = db.query(Run).filter(
                    Run.bot_id.in_(bot_codes),
                    Run.org_id.in_(owner_ids)
                ).order_by(Run.queued_at.desc()).offset(offset).limit(limit).all()
    
    return runs


@router.get("/runs/{run_id}", response_model=RunDetailResponse)
async def get_run_detail(
    run_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific run.
    
    Args:
        run_id: Run ID
        db: Database session
    """
    rbac_context = get_current_user(request)
    
    run = get_run_details(db, run_id, rbac_context)
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found or access denied")
    
    return run


@router.get("/monitoring/overview", response_model=MonitoringOverviewResponse)
async def get_monitoring_overview(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get monitoring overview with role-aware aggregates.
    
    For creator/agency: returns counts for their scope
    For admin: returns global counts
    
    Returns:
        MonitoringOverviewResponse with aggregated metrics
    """
    rbac_context = get_current_user(request)
    
    # Get all metrics
    bots_total = get_total_bots_count(db, rbac_context)
    bots_active = get_active_bots_count(db, rbac_context)
    runs_today = get_runs_today_count(db, rbac_context)
    runs_last_7d = get_runs_last_7d_count(db, rbac_context)
    errors_last_24h = get_error_runs_last_24h_count(db, rbac_context)
    
    return MonitoringOverviewResponse(
        bots_total=bots_total,
        bots_active=bots_active,
        runs_today=runs_today,
        runs_last_7d=runs_last_7d,
        errors_last_24h=errors_last_24h
    )