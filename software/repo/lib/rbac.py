"""
Role-Based Access Control (RBAC) middleware and utilities.
"""

import os
from typing import Optional, Union
from fastapi import HTTPException, Depends, Request
from sqlalchemy.orm import Session
from enum import Enum

# Add the API directory to the path to import models
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api'))
from models import User, Organization, BotInstance, Subscription, Entitlement


class UserRole(Enum):
    CREATOR = "creator"
    AGENCY = "agency" 
    ADMIN = "admin"


class RBACContext:
    """RBAC context containing user/org information."""
    
    def __init__(self, user_id: str, role: UserRole, org_id: Optional[str] = None):
        self.user_id = user_id
        self.role = role
        self.org_id = org_id
    
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
    
    @property
    def is_creator(self) -> bool:
        return self.role == UserRole.CREATOR
    
    @property
    def is_agency(self) -> bool:
        return self.role == UserRole.AGENCY
    
    @property
    def owner_type(self) -> str:
        """Get owner type for this role."""
        if self.is_creator:
            return "user"
        elif self.is_agency:
            return "org"
        else:
            return "admin"
    
    @property
    def owner_id(self) -> str:
        """Get owner ID for this role."""
        if self.is_creator:
            return self.user_id
        elif self.is_agency:
            return self.org_id or self.user_id
        else:
            return "admin"


def get_current_user(request: Request) -> RBACContext:
    """
    Extract current user context from request.
    
    In a real implementation, this would:
    1. Verify JWT token
    2. Extract user_id and role from token
    3. For agency users, get org_id from token or database
    
    For now, we'll use environment variables for development.
    """
    # Development mode - get from environment
    user_id = os.getenv("DEV_USER_ID", "dev-user-123")
    role_str = os.getenv("DEV_USER_ROLE", "creator")
    org_id = os.getenv("DEV_ORG_ID", None)
    
    try:
        role = UserRole(role_str)
    except ValueError:
        role = UserRole.CREATOR
    
    return RBACContext(user_id=user_id, role=role, org_id=org_id)


def require_role(allowed_roles: Union[str, list[str]]):
    """
    Decorator to require specific roles.
    
    Args:
        allowed_roles: Single role string or list of allowed roles
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request from kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            rbac_context = get_current_user(request)
            
            # Normalize allowed_roles to list
            if isinstance(allowed_roles, str):
                allowed_roles_list = [allowed_roles]
            else:
                allowed_roles_list = allowed_roles
            
            # Check if user role is allowed
            if rbac_context.role.value not in allowed_roles_list:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied. Required roles: {allowed_roles_list}"
                )
            
            # Add RBAC context to kwargs
            kwargs['rbac_context'] = rbac_context
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_owner(bot_instance_id: str, db: Session = None):
    """
    Dependency to ensure requester owns the bot instance.
    
    Args:
        bot_instance_id: ID of the bot instance to check ownership for
        db: Database session
    
    Returns:
        RBACContext: The authenticated user context
    """
    async def dependency(request: Request, db: Session = Depends(db)):
        rbac_context = get_current_user(request)
        
        if rbac_context.is_admin:
            # Admin can access everything
            return rbac_context
        
        # Get bot instance
        bot_instance = db.query(BotInstance).filter(
            BotInstance.id == bot_instance_id
        ).first()
        
        if not bot_instance:
            raise HTTPException(status_code=404, detail="Bot instance not found")
        
        # Check ownership based on role
        if rbac_context.is_creator:
            # Creator owns user-type bot instances
            if bot_instance.owner_type != "user" or bot_instance.owner_id != rbac_context.user_id:
                raise HTTPException(status_code=403, detail="Access denied: not your bot instance")
        
        elif rbac_context.is_agency:
            # Agency owns org-type bot instances
            if bot_instance.owner_type != "org" or bot_instance.owner_id != rbac_context.org_id:
                raise HTTPException(status_code=403, detail="Access denied: not your organization's bot instance")
        
        return rbac_context
    
    return dependency


def require_admin():
    """Dependency to require admin role."""
    return require_role("admin")


def require_creator_or_agency():
    """Dependency to require creator or agency role."""
    return require_role(["creator", "agency"])


def get_owner_filter(rbac_context: RBACContext):
    """
    Get database filter for owner-based queries.
    
    Args:
        rbac_context: RBAC context
        
    Returns:
        Filter condition for SQLAlchemy queries
    """
    if rbac_context.is_admin:
        # Admin sees everything - no filter
        return None
    
    if rbac_context.is_creator:
        # Creator sees only user-owned resources
        return BotInstance.owner_type == "user", BotInstance.owner_id == rbac_context.user_id
    
    elif rbac_context.is_agency:
        # Agency sees only org-owned resources
        return BotInstance.owner_type == "org", BotInstance.owner_id == rbac_context.org_id
    
    else:
        raise HTTPException(status_code=403, detail="Access denied")


def get_subscription_filter(rbac_context: RBACContext):
    """
    Get database filter for subscription queries.
    
    Args:
        rbac_context: RBAC context
        
    Returns:
        Filter condition for SQLAlchemy queries
    """
    if rbac_context.is_admin:
        # Admin sees all subscriptions
        return None
    
    if rbac_context.is_creator:
        # Creator sees only user subscriptions (if any)
        return Subscription.org_id == rbac_context.user_id
    
    elif rbac_context.is_agency:
        # Agency sees only org subscriptions
        return Subscription.org_id == rbac_context.org_id
    
    else:
        raise HTTPException(status_code=403, detail="Access denied")


def get_invoice_filter(rbac_context: RBACContext):
    """
    Get database filter for invoice queries.
    
    Args:
        rbac_context: RBAC context
        
    Returns:
        Filter condition for SQLAlchemy queries
    """
    if rbac_context.is_admin:
        # Admin sees all invoices
        return None
    
    if rbac_context.is_creator:
        # Creator sees only user invoices
        from models import Invoice
        return Invoice.owner_type == "user", Invoice.owner_id == rbac_context.user_id
    
    elif rbac_context.is_agency:
        # Agency sees only org invoices
        from models import Invoice
        return Invoice.owner_type == "org", Invoice.owner_id == rbac_context.org_id
    
    else:
        raise HTTPException(status_code=403, detail="Access denied")