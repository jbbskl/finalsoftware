"""
Billing endpoints for invoice creation and webhook handling.
"""

import os
import uuid
import logging
from typing import Union
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from db import get_db
from models import Invoice, Subscription, Entitlement
from schemas import (
    InvoiceCreateCreator, 
    InvoiceCreateAgency, 
    InvoiceResponse, 
    InvoiceRead
)

# Import lib modules with proper path handling
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from pricing import price_for_creator, price_for_agency
from owners import resolve_owner_from_request
from provisioner import (
    create_entitlements_for_creator,
    create_entitlements_for_agency,
    provision_instances_for_entitlements
)

router = APIRouter(prefix="/api/billing", tags=["billing"])
logger = logging.getLogger(__name__)


@router.post("/invoice", response_model=InvoiceResponse)
async def create_invoice(
    request: Union[InvoiceCreateCreator, InvoiceCreateAgency],
    db: Session = Depends(get_db)
):
    """
    Create an invoice for creator or agency plan.
    """
    # Resolve owner from request context (simplified for demo)
    owner_info = resolve_owner_from_request(Request)
    
    # Calculate pricing
    if request.kind == "creator":
        pricing = price_for_creator(len(request.bots))
        owner_type = "user"  # Creator plans are always user-owned
        owner_id = owner_info["owner_id"]
    elif request.kind == "agency":
        pricing = price_for_agency(len(request.platforms), request.models)
        owner_type = "org"  # Agency plans are org-owned
        owner_id = owner_info["owner_id"]  # In real app, this would come from org context
    else:
        raise HTTPException(status_code=400, detail="Invalid invoice kind")
    
    # Create invoice record
    invoice_id = str(uuid.uuid4())
    provider = os.getenv("BILLING_PROVIDER", "stripe")
    
    # Create invoice URL (stub for now)
    if provider == "stripe" and os.getenv("USE_STRIPE", "false").lower() == "true":
        # Real Stripe integration would go here
        invoice_url = f"https://checkout.stripe.com/pay/test_{invoice_id}"
        ext_id = f"stripe_test_{invoice_id}"
    else:
        # Mock URL for development
        invoice_url = f"/pay/test/{invoice_id}"
        ext_id = f"mock_{invoice_id}"
    
    invoice = Invoice(
        id=invoice_id,
        provider=provider,
        status='pending',
        amount_eur=pricing["amountEUR"],
        url=invoice_url,
        ext_id=ext_id,
        owner_type=owner_type,
        owner_id=owner_id
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    logger.info(f"Created invoice {invoice_id} for {owner_type}:{owner_id} - €{pricing['amountEUR']}")
    
    return InvoiceResponse(
        invoice_id=invoice_id,
        invoice_url=invoice_url
    )


@router.get("/invoices/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """
    Get invoice details by ID.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return InvoiceRead.from_orm(invoice)


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events.
    """
    # In production, verify Stripe signature here
    # For development, accept all requests
    
    try:
        body = await request.json()
        logger.info(f"Stripe webhook received: {body}")
        
        # Extract invoice ID and event type from webhook
        invoice_id = body.get("invoice_id") or body.get("data", {}).get("object", {}).get("id")
        event_type = body.get("event") or body.get("type", "invoice.payment_succeeded")
        
        if event_type in ["invoice.payment_succeeded", "payment_intent.succeeded", "paid"]:
            await handle_payment_success(db, invoice_id)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/webhook/crypto")
async def crypto_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle crypto payment webhook events.
    """
    try:
        body = await request.json()
        logger.info(f"Crypto webhook received: {body}")
        
        # Extract invoice ID and event type from webhook
        invoice_id = body.get("invoice_id")
        event_type = body.get("event", "payment_confirmed")
        
        if event_type in ["payment_confirmed", "paid"]:
            await handle_payment_success(db, invoice_id)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Crypto webhook error: {e}")
        return {"status": "error", "message": str(e)}


async def handle_payment_success(db: Session, invoice_id: str):
    """
    Handle successful payment - activate subscription, create entitlements, provision instances.
    """
    if not invoice_id:
        logger.warning("No invoice_id provided in webhook")
        return
    
    # Get invoice
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        logger.warning(f"Invoice {invoice_id} not found")
        return
    
    # Check if already processed (idempotent)
    if invoice.status == "paid":
        logger.info(f"Invoice {invoice_id} already processed")
        return
    
    # Mark invoice as paid
    from datetime import datetime
    invoice.status = "paid"
    invoice.paid_at = datetime.utcnow()
    db.commit()
    
    # Create or update subscription
    subscription = db.query(Subscription).filter(
        Subscription.org_id == invoice.owner_id
    ).first()
    
    if not subscription:
        subscription = Subscription(
            id=str(uuid.uuid4()),
            org_id=invoice.owner_id,
            status="active",
            plan="creator" if invoice.owner_type == "user" else "agency",
            entitlements_json={}
        )
        db.add(subscription)
    else:
        subscription.status = "active"
    
    db.commit()
    
    # Create entitlements and provision instances
    # Note: In a real implementation, we'd need to store the original request data
    # For now, we'll create default entitlements based on the plan type
    
    if invoice.owner_type == "user":
        # Creator plan - create entitlements for common bots
        default_bots = ["f2f_post", "f2f_dm", "of_post", "of_dm"]
        entitlements = create_entitlements_for_creator(
            db, invoice.owner_type, invoice.owner_id, default_bots
        )
    else:
        # Agency plan - create entitlements for all platforms
        platforms = ["f2f", "onlyfans", "fanvue"]
        models = 10  # Default models per platform
        entitlements = create_entitlements_for_agency(
            db, invoice.owner_type, invoice.owner_id, platforms, models
        )
    
    # Provision bot instances
    instances = provision_instances_for_entitlements(
        db, invoice.owner_type, invoice.owner_id, entitlements
    )
    
    logger.info(f"Payment processed for invoice {invoice_id}: "
               f"created {len(entitlements)} entitlements and {len(instances)} instances")