"""
Owner resolution helpers for user/org context.
"""

from typing import Dict, Any, Optional
from fastapi import Request
import os


def resolve_owner_from_request(request: Request, user_id: Optional[str] = None, org_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Resolve owner type and ID from request context.
    
    Args:
        request: FastAPI request object
        user_id: Optional user ID from auth context
        org_id: Optional org ID from request params/body
        
    Returns:
        Dict with owner_type and owner_id
    """
    # In a real implementation, this would check authentication context
    # For now, we'll use environment variables or request headers for demo
    
    # Check if this is an org context (agency)
    if org_id:
        return {
            "owner_type": "org",
            "owner_id": org_id
        }
    
    # Default to user context (creator)
    if user_id:
        return {
            "owner_type": "user", 
            "owner_id": user_id
        }
    
    # Fallback for development
    dev_user_id = os.getenv("DEV_USER_ID", "dev-user-123")
    return {
        "owner_type": "user",
        "owner_id": dev_user_id
    }


def get_owner_prefix(owner_type: str, owner_id: str) -> str:
    """
    Generate tenant directory prefix for owner.
    
    Args:
        owner_type: 'user' or 'org'
        owner_id: Owner identifier
        
    Returns:
        Directory prefix like 'user-123' or 'org-456'
    """
    return f"{owner_type}-{owner_id}"


def get_tenant_base_path(owner_type: str, owner_id: str) -> str:
    """
    Get base tenant directory path.
    
    Args:
        owner_type: 'user' or 'org'
        owner_id: Owner identifier
        
    Returns:
        Full path to tenant directory
    """
    prefix = get_owner_prefix(owner_type, owner_id)
    return f"/data/tenants/{prefix}"