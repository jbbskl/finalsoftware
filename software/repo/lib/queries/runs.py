"""
Query helpers for runs monitoring and analytics.
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

# Add the API directory to the path to import models
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'services', 'api'))
from models import Run, BotInstance, Schedule
from rbac import RBACContext


def get_runs_for_bot_instance(
    db: Session,
    bot_instance_id: str,
    rbac_context: RBACContext,
    limit: int = 50,
    offset: int = 0
) -> List[Run]:
    """
    Get runs for a specific bot instance with RBAC filtering.
    
    Args:
        db: Database session
        bot_instance_id: Bot instance ID
        rbac_context: RBAC context for authorization
        limit: Maximum number of results
        offset: Offset for pagination
        
    Returns:
        List of Run objects
    """
    # Verify bot instance exists and user has access
    bot_instance = db.query(BotInstance).filter(
        BotInstance.id == bot_instance_id
    ).first()
    
    if not bot_instance:
        return []
    
    # Check RBAC access
    if not rbac_context.is_admin:
        if (bot_instance.owner_type != rbac_context.owner_type or 
            bot_instance.owner_id != rbac_context.owner_id):
            return []
    
    # Get runs for this bot instance
    runs = db.query(Run).filter(
        Run.bot_id == bot_instance.bot_code,
        Run.org_id == bot_instance.owner_id
    ).order_by(desc(Run.queued_at)).offset(offset).limit(limit).all()
    
    return runs


def get_run_details(db: Session, run_id: str, rbac_context: RBACContext) -> Optional[Run]:
    """
    Get detailed information about a specific run.
    
    Args:
        db: Database session
        run_id: Run ID
        rbac_context: RBAC context for authorization
        
    Returns:
        Run object or None if not found/not authorized
    """
    run = db.query(Run).filter(Run.id == run_id).first()
    
    if not run:
        return None
    
    # Check RBAC access through bot instance
    bot_instance = db.query(BotInstance).filter(
        BotInstance.bot_code == run.bot_id,
        BotInstance.owner_id == run.org_id
    ).first()
    
    if not bot_instance:
        return None
    
    # Check RBAC access
    if not rbac_context.is_admin:
        if (bot_instance.owner_type != rbac_context.owner_type or 
            bot_instance.owner_id != rbac_context.owner_id):
            return None
    
    return run


def get_runs_count_for_period(
    db: Session,
    rbac_context: RBACContext,
    days: int = 7
) -> int:
    """
    Get count of runs for a specific period.
    
    Args:
        db: Database session
        rbac_context: RBAC context for authorization
        days: Number of days to look back
        
    Returns:
        Count of runs
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    if rbac_context.is_admin:
        # Admin sees all runs
        count = db.query(Run).filter(
            Run.queued_at >= since
        ).count()
    else:
        # Filter by owner
        bot_instances = db.query(BotInstance).filter(
            BotInstance.owner_type == rbac_context.owner_type,
            BotInstance.owner_id == rbac_context.owner_id
        ).all()
        
        bot_codes = [bi.bot_code for bi in bot_instances]
        owner_ids = [bi.owner_id for bi in bot_instances]
        
        if not bot_codes:
            return 0
        
        count = db.query(Run).filter(
            Run.queued_at >= since,
            Run.bot_id.in_(bot_codes),
            Run.org_id.in_(owner_ids)
        ).count()
    
    return count


def get_runs_today_count(db: Session, rbac_context: RBACContext) -> int:
    """Get count of runs started today."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return get_runs_count_for_period(db, rbac_context, days=1)


def get_runs_last_7d_count(db: Session, rbac_context: RBACContext) -> int:
    """Get count of runs in the last 7 days."""
    return get_runs_count_for_period(db, rbac_context, days=7)


def get_error_runs_last_24h_count(db: Session, rbac_context: RBACContext) -> int:
    """
    Get count of error runs in the last 24 hours.
    
    Args:
        db: Database session
        rbac_context: RBAC context for authorization
        
    Returns:
        Count of error runs
    """
    since = datetime.utcnow() - timedelta(hours=24)
    
    if rbac_context.is_admin:
        # Admin sees all error runs
        count = db.query(Run).filter(
            Run.queued_at >= since,
            Run.status.in_(['error', 'failed'])
        ).count()
    else:
        # Filter by owner
        bot_instances = db.query(BotInstance).filter(
            BotInstance.owner_type == rbac_context.owner_type,
            BotInstance.owner_id == rbac_context.owner_id
        ).all()
        
        bot_codes = [bi.bot_code for bi in bot_instances]
        owner_ids = [bi.owner_id for bi in bot_instances]
        
        if not bot_codes:
            return 0
        
        count = db.query(Run).filter(
            Run.queued_at >= since,
            Run.status.in_(['error', 'failed']),
            Run.bot_id.in_(bot_codes),
            Run.org_id.in_(owner_ids)
        ).count()
    
    return count


def get_active_bots_count(db: Session, rbac_context: RBACContext) -> int:
    """
    Get count of active (running) bot instances.
    
    Args:
        db: Database session
        rbac_context: RBAC context for authorization
        
    Returns:
        Count of active bots
    """
    if rbac_context.is_admin:
        # Admin sees all active bots
        count = db.query(BotInstance).filter(
            BotInstance.status == 'active'
        ).count()
    else:
        # Filter by owner
        count = db.query(BotInstance).filter(
            BotInstance.owner_type == rbac_context.owner_type,
            BotInstance.owner_id == rbac_context.owner_id,
            BotInstance.status == 'active'
        ).count()
    
    return count


def get_total_bots_count(db: Session, rbac_context: RBACContext) -> int:
    """
    Get total count of bot instances.
    
    Args:
        db: Database session
        rbac_context: RBAC context for authorization
        
    Returns:
        Count of all bots
    """
    if rbac_context.is_admin:
        # Admin sees all bots
        count = db.query(BotInstance).count()
    else:
        # Filter by owner
        count = db.query(BotInstance).filter(
            BotInstance.owner_type == rbac_context.owner_type,
            BotInstance.owner_id == rbac_context.owner_id
        ).count()
    
    return count


def get_runs_by_status(
    db: Session,
    rbac_context: RBACContext,
    status: str,
    limit: int = 50
) -> List[Run]:
    """
    Get runs by status with RBAC filtering.
    
    Args:
        db: Database session
        rbac_context: RBAC context for authorization
        status: Run status to filter by
        limit: Maximum number of results
        
    Returns:
        List of Run objects
    """
    if rbac_context.is_admin:
        # Admin sees all runs
        runs = db.query(Run).filter(
            Run.status == status
        ).order_by(desc(Run.queued_at)).limit(limit).all()
    else:
        # Filter by owner
        bot_instances = db.query(BotInstance).filter(
            BotInstance.owner_type == rbac_context.owner_type,
            BotInstance.owner_id == rbac_context.owner_id
        ).all()
        
        bot_codes = [bi.bot_code for bi in bot_instances]
        owner_ids = [bi.owner_id for bi in bot_instances]
        
        if not bot_codes:
            return []
        
        runs = db.query(Run).filter(
            Run.status == status,
            Run.bot_id.in_(bot_codes),
            Run.org_id.in_(owner_ids)
        ).order_by(desc(Run.queued_at)).limit(limit).all()
    
    return runs