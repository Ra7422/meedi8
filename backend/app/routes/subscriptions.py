"""
Subscription and Stripe Integration Routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import stripe

from app.db import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.services.stripe_service import (
    create_checkout_session,
    create_guest_checkout_session,
    create_portal_session,
    handle_checkout_complete,
    handle_subscription_updated,
    handle_subscription_deleted
)
from app.services.subscription_service import get_or_create_subscription
from app.config import settings

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


# ========================================
# REQUEST/RESPONSE SCHEMAS
# ========================================

class CreateCheckoutRequest(BaseModel):
    tier: str  # "plus" or "pro"
    interval: str = "monthly"  # "monthly" or "yearly"


class CheckoutResponse(BaseModel):
    client_secret: str
    session_id: str


class SubscriptionStatusResponse(BaseModel):
    tier: str
    status: str
    voice_conversations_used: int
    voice_conversations_limit: int
    stripe_subscription_id: Optional[str]
    can_use_voice: bool
    can_use_audio_mode: bool


class PortalResponse(BaseModel):
    portal_url: str


# ========================================
# SUBSCRIPTION ROUTES
# ========================================

@router.get("/status", response_model=SubscriptionStatusResponse)
def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription status"""
    subscription = get_or_create_subscription(db, current_user.id)

    return SubscriptionStatusResponse(
        tier=subscription.tier.value,
        status=subscription.status.value,
        voice_conversations_used=subscription.voice_conversations_used,
        voice_conversations_limit=subscription.voice_conversations_limit,
        stripe_subscription_id=subscription.stripe_subscription_id,
        can_use_voice=subscription.tier.value in ["plus", "pro"],
        can_use_audio_mode=subscription.tier.value == "pro"
    )


@router.post("/create-checkout", response_model=CheckoutResponse)
def create_checkout(
    request: CreateCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Create Stripe Checkout session for subscription.

    Works for both authenticated and unauthenticated users:
    - Authenticated: Links subscription to existing account
    - Unauthenticated: Creates checkout, user completes registration after payment

    Args:
        tier: "plus" or "pro"
        interval: "monthly" or "yearly"

    Returns:
        client_secret and session_id for embedded checkout
    """
    if request.tier not in ["plus", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'plus' or 'pro'")

    if request.interval not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid interval. Must be 'monthly' or 'yearly'")

    # Get frontend URL from environment or use default
    frontend_url = settings.FRONTEND_URL
    success_url = f"{frontend_url}/subscription/success"
    cancel_url = f"{frontend_url}/subscription/cancelled"

    try:
        # If user is authenticated, use regular checkout
        if current_user:
            result = create_checkout_session(
                db=db,
                user=current_user,
                tier=request.tier,
                interval=request.interval,
                success_url=success_url,
                cancel_url=cancel_url
            )
        else:
            # If not authenticated, use guest checkout (email collected in Stripe)
            result = create_guest_checkout_session(
                tier=request.tier,
                interval=request.interval,
                success_url=success_url,
                cancel_url=cancel_url
            )

        return CheckoutResponse(**result)

    except Exception as e:
        print(f"Checkout creation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.post("/create-portal", response_model=PortalResponse)
def create_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create Stripe Customer Portal session for managing subscription.

    User can:
    - Cancel subscription
    - Update payment method
    - View invoices
    - Update billing details
    """
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No active subscription found"
        )

    # Return to subscription page after managing subscription
    frontend_url = settings.FRONTEND_URL
    return_url = f"{frontend_url}/subscription"

    try:
        portal_url = create_portal_session(
            customer_id=current_user.stripe_customer_id,
            return_url=return_url
        )

        return PortalResponse(portal_url=portal_url)

    except Exception as e:
        print(f"Portal creation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create portal session: {str(e)}"
        )


# ========================================
# STRIPE WEBHOOKS
# ========================================

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events.

    Events handled:
    - checkout.session.completed: Subscription activated
    - customer.subscription.updated: Subscription changed
    - customer.subscription.deleted: Subscription cancelled
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]

    print(f"🔔 Stripe webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        # Payment successful, activate subscription
        handle_checkout_complete(db, data)

    elif event_type == "customer.subscription.updated":
        # Subscription updated (renewal, plan change, etc.)
        handle_subscription_updated(db, data)

    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled
        handle_subscription_deleted(db, data)

    elif event_type == "invoice.payment_failed":
        # Payment failed - you might want to send notification
        print(f"⚠️ Payment failed for subscription: {data.get('subscription')}")

    else:
        print(f"ℹ️ Unhandled event type: {event_type}")

    return {"status": "success"}
