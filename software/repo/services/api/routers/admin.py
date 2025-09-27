"""
Admin endpoints for subscriptions, invoices, and bots inventory.
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
from models import Subscription, Invoice, BotInstance

router = APIRouter(prefix="/api/admin", tags=["admin"])


class SubscriptionListResponse(BaseModel):
    id: str
    org_id: str
    status: str
    plan: str
    entitlements_json: Optional[dict]
    current_period_end: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    id: str
    provider: str
    status: str
    amount_eur: int
    url: Optional[str]
    ext_id: Optional[str]
    owner_type: str
    owner_id: str
    created_at: str
    paid_at: Optional[str]

    class Config:
        from_attributes = True


class BotInventoryResponse(BaseModel):
    id: str
    owner_type: str
    owner_id: str
    bot_code: str
    status: str
    validation_status: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


@router.get("/subscriptions", response_model=List[SubscriptionListResponse])
async def list_subscriptions(
    request: Request,
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List subscriptions with admin-only access.
    
    Args:
        status: Optional status filter
        limit: Maximum number of results (1-100)
        offset: Offset for pagination
        db: Database session
    """
    # Require admin role
    rbac_context = get_current_user(request)
    if not rbac_context.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Subscription)
    
    if status:
        query = query.filter(Subscription.status == status)
    
    subscriptions = query.order_by(Subscription.created_at.desc()).offset(offset).limit(limit).all()
    
    return subscriptions


@router.get("/invoices", response_model=List[InvoiceListResponse])
async def list_invoices(
    request: Request,
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List invoices with admin-only access.
    
    Args:
        status: Optional status filter
        limit: Maximum number of results (1-100)
        offset: Offset for pagination
        db: Database session
    """
    # Require admin role
    rbac_context = get_current_user(request)
    if not rbac_context.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Invoice)
    
    if status:
        query = query.filter(Invoice.status == status)
    
    invoices = query.order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()
    
    return invoices


@router.get("/bots", response_model=List[BotInventoryResponse])
async def list_bots_inventory(
    request: Request,
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List bot instances inventory with admin-only access.
    
    Args:
        status: Optional status filter
        limit: Maximum number of results (1-100)
        offset: Offset for pagination
        db: Database session
    """
    # Require admin role
    rbac_context = get_current_user(request)
    if not rbac_context.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(BotInstance)
    
    if status:
        query = query.filter(BotInstance.status == status)
    
    bots = query.order_by(BotInstance.created_at.desc()).offset(offset).limit(limit).all()
    
    return bots


@router.get("/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Download invoice file or return download URL.
    
    Args:
        invoice_id: Invoice ID
        db: Database session
    """
    # Require admin role
    rbac_context = get_current_user(request)
    if not rbac_context.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # For now, return the stored URL or generate a stub
    if invoice.url:
        return {"download_url": invoice.url}
    else:
        # Generate stub download URL
        download_url = f"/api/admin/invoices/{invoice_id}/download/stub"
        return {"download_url": download_url}


@router.get("/invoices/{invoice_id}/download/stub")
async def download_invoice_stub(
    invoice_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generate and download a stub invoice PDF.
    
    Args:
        invoice_id: Invoice ID
        db: Database session
    """
    # Require admin role
    rbac_context = get_current_user(request)
    if not rbac_context.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Generate stub PDF content
    stub_content = f"""
    INVOICE STUB
    ============
    
    Invoice ID: {invoice.id}
    Provider: {invoice.provider}
    Amount: €{invoice.amount_eur / 100}
    Status: {invoice.status}
    Owner: {invoice.owner_type} - {invoice.owner_id}
    Created: {invoice.created_at}
    
    Note: This is a stub invoice. In production, this would be a proper PDF.
    """
    
    from fastapi.responses import Response
    
    return Response(
        content=stub_content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice.id}.txt"}
    )