"""
Affiliate read-only endpoints for user and admin access.
"""

import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from rbac import RBACContext, get_current_user, require_admin

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from db import get_db

router = APIRouter(prefix="/api", tags=["affiliate"])


class AffiliateResponse(BaseModel):
    code: str
    clicks_count: int
    signups_count: int
    paid_total_eur: int


class AffiliateListResponse(BaseModel):
    id: str
    code: str
    user_id: str
    clicks_count: int
    signups_count: int
    paid_total_eur: int
    created_at: str

    class Config:
        from_attributes = True


@router.get("/affiliate", response_model=AffiliateResponse)
async def get_user_affiliate(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get affiliate information for the current user (creator/agency).
    
    Args:
        db: Database session
    """
    rbac_context = get_current_user(request)
    
    # Only creators and agencies can access their affiliate info
    if rbac_context.is_admin:
        raise HTTPException(status_code=403, detail="Admins don't have affiliate accounts")
    
    # Generate affiliate code based on user ID
    affiliate_code = f"AF_{rbac_context.user_id[:8].upper()}"
    
    # For now, return mock data
    # In production, this would query the affiliate tables
    return AffiliateResponse(
        code=affiliate_code,
        clicks_count=42,
        signups_count=5,
        paid_total_eur=250  # Amount in cents
    )


@router.get("/admin/affiliates", response_model=List[AffiliateListResponse])
async def list_affiliates(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List all affiliates with summary metrics (admin-only).
    
    Args:
        limit: Maximum number of results (1-100)
        offset: Offset for pagination
        db: Database session
    """
    # Require admin role
    rbac_context = get_current_user(request)
    if not rbac_context.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # For now, return mock data
    # In production, this would query the affiliate tables
    mock_affiliates = [
        {
            "id": "aff-001",
            "code": "AF_USER123",
            "user_id": "user-123",
            "clicks_count": 150,
            "signups_count": 12,
            "paid_total_eur": 1200,
            "created_at": "2024-01-15T10:00:00Z"
        },
        {
            "id": "aff-002", 
            "code": "AF_ORG456",
            "user_id": "org-456",
            "clicks_count": 89,
            "signups_count": 7,
            "paid_total_eur": 700,
            "created_at": "2024-01-14T15:30:00Z"
        }
    ]
    
    # Apply pagination to mock data
    start = offset
    end = offset + limit
    paginated_affiliates = mock_affiliates[start:end]
    
    return paginated_affiliates