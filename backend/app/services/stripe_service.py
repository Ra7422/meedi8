"""
Stripe Integration Service
Handles checkout, subscriptions, and webhooks
"""
import stripe
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from datetime import datetime

stripe.api_key = settings.STRIPE_SECRET_KEY


def get_price_id(tier: str, interval: str) -> str:
    """Get Stripe price ID for tier and billing interval"""
    if tier == "plus":
        return settings.STRIPE_PRICE_PLUS_MONTHLY if interval == "monthly" else settings.STRIPE_PRICE_PLUS_YEARLY
    elif tier == "pro":
        return settings.STRIPE_PRICE_PRO_MONTHLY if interval == "monthly" else settings.STRIPE_PRICE_PRO_YEARLY
    else:
        raise ValueError(f"Invalid tier: {tier}")


def get_tier_from_price_id(price_id: str) -> SubscriptionTier:
    """Determine subscription tier from Stripe price ID"""
    if price_id in [settings.STRIPE_PRICE_PLUS_MONTHLY, settings.STRIPE_PRICE_PLUS_YEARLY]:
        return SubscriptionTier.PLUS
    elif price_id in [settings.STRIPE_PRICE_PRO_MONTHLY, settings.STRIPE_PRICE_PRO_YEARLY]:
        return SubscriptionTier.PRO
    else:
        return SubscriptionTier.FREE


def get_or_create_stripe_customer(db: Session, user: User) -> str:
    """Get existing Stripe customer ID or create new customer"""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    # Create new Stripe customer
    customer = stripe.Customer.create(
        email=user.email,
        name=user.name,
        metadata={
            "user_id": user.id
        }
    )

    # Save customer ID
    user.stripe_customer_id = customer.id
    db.commit()

    return customer.id


def create_checkout_session(db: Session, user: User, tier: str, interval: str, success_url: str, cancel_url: str) -> dict:
    """
    Create Stripe Checkout session for subscription (embedded mode).

    Args:
        db: Database session
        user: User object
        tier: "plus" or "pro"
        interval: "monthly" or "yearly"
        success_url: URL to redirect after successful payment
        cancel_url: URL to redirect if user cancels (unused in embedded mode)

    Returns:
        dict with client_secret and session_id for embedded checkout
    """
    customer_id = get_or_create_stripe_customer(db, user)
    price_id = get_price_id(tier, interval)

    checkout_session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=['card', 'link'],
        line_items=[{
            'price': price_id,
            'quantity': 1,
        }],
        mode='subscription',
        ui_mode='embedded',
        return_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        metadata={
            "user_id": user.id,
            "tier": tier,
            "interval": interval
        },
        subscription_data={
            "metadata": {
                "user_id": user.id
            }
        }
    )

    return {
        "client_secret": checkout_session.client_secret,
        "session_id": checkout_session.id
    }


def create_guest_checkout_session(tier: str, interval: str, success_url: str, cancel_url: str, customer_email: str = None) -> dict:
    """
    Create Stripe Checkout session for unauthenticated guest users.
    Email is collected during checkout, user account created via webhook after payment.

    Args:
        tier: "plus" or "pro"
        interval: "monthly" or "yearly"
        success_url: URL to redirect after successful payment
        cancel_url: URL to redirect if user cancels
        customer_email: Optional pre-filled email (from OAuth or form)

    Returns:
        dict with client_secret and session_id for embedded checkout
    """
    price_id = get_price_id(tier, interval)

    session_params = {
        'payment_method_types': ['card', 'link'],
        'line_items': [{
            'price': price_id,
            'quantity': 1,
        }],
        'mode': 'subscription',
        'ui_mode': 'embedded',
        'return_url': success_url + "?session_id={CHECKOUT_SESSION_ID}",
        'metadata': {
            "tier": tier,
            "interval": interval,
            "guest_checkout": "true"  # Flag for webhook to create user
        },
        'subscription_data': {
            "metadata": {
                "tier": tier
            }
        }
    }

    # Pre-fill email if provided (e.g., from OAuth)
    if customer_email:
        session_params['customer_email'] = customer_email

    checkout_session = stripe.checkout.Session.create(**session_params)

    return {
        "client_secret": checkout_session.client_secret,
        "session_id": checkout_session.id
    }


def create_portal_session(customer_id: str, return_url: str) -> str:
    """
    Create Stripe Customer Portal session for managing subscription.

    Returns:
        Portal URL
    """
    portal_session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )

    return portal_session.url


def handle_checkout_complete(db: Session, session: dict):
    """
    Handle successful checkout completion.

    Supports both authenticated and guest checkouts:
    - Authenticated: user_id in metadata, link to existing account
    - Guest: guest_checkout=true in metadata, create new user account
    """
    metadata = session.get("metadata", {})
    subscription_id = session.get("subscription")
    is_guest_checkout = metadata.get("guest_checkout") == "true"

    if not subscription_id:
        print("⚠️ Missing subscription_id in checkout session")
        return

    # Get Stripe subscription details
    stripe_subscription = stripe.Subscription.retrieve(subscription_id)
    price_id = stripe_subscription["items"]["data"][0]["price"]["id"]
    tier = get_tier_from_price_id(price_id)
    customer_id = stripe_subscription.get("customer")

    # Handle guest checkout - create new user account
    if is_guest_checkout:
        # Get customer email from Stripe
        customer = stripe.Customer.retrieve(customer_id)
        customer_email = customer.get("email")

        if not customer_email:
            print("⚠️ Guest checkout missing customer email")
            return

        # Check if user already exists with this email
        existing_user = db.query(User).filter(User.email == customer_email).first()
        if existing_user:
            print(f"ℹ️ User already exists for {customer_email}, linking subscription")
            user = existing_user
        else:
            # Create new user account (password will be set later via success page)
            import secrets
            temp_password = secrets.token_urlsafe(32)  # Temporary, user will reset

            user = User(
                email=customer_email,
                name=customer_email.split("@")[0],  # Use email prefix as default name
                password_hash=temp_password,  # Temporary password
                stripe_customer_id=customer_id,
                has_completed_screening=False  # Will complete on first login
            )
            db.add(user)
            db.flush()  # Get user.id without committing
            print(f"✅ Created new user account for guest: {customer_email}")

        user_id = user.id
    else:
        # Authenticated checkout - get user_id from metadata
        user_id = metadata.get("user_id")
        if not user_id:
            print("⚠️ Missing user_id in authenticated checkout session")
            return
        user_id = int(user_id)

    # Get or create subscription for user
    from app.services.subscription_service import get_or_create_subscription
    subscription = get_or_create_subscription(db, user_id)

    # Update subscription
    subscription.tier = tier
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.stripe_subscription_id = subscription_id
    subscription.stripe_price_id = price_id
    subscription.updated_at = datetime.utcnow()

    # Update limits for paid tiers
    if tier in [SubscriptionTier.PLUS, SubscriptionTier.PRO]:
        subscription.voice_conversations_limit = 999999  # Unlimited

    db.commit()
    print(f"✅ Subscription activated for user {user_id}: {tier.value}")


def handle_subscription_updated(db: Session, subscription_data: dict):
    """Handle subscription update (renewal, change, etc.)"""
    stripe_sub_id = subscription_data.get("id")
    status = subscription_data.get("status")

    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == stripe_sub_id
    ).first()

    if not subscription:
        print(f"Subscription not found: {stripe_sub_id}")
        return

    # Map Stripe status to our status
    if status == "active":
        subscription.status = SubscriptionStatus.ACTIVE
    elif status == "canceled":
        subscription.status = SubscriptionStatus.CANCELLED
    elif status == "past_due" or status == "unpaid":
        subscription.status = SubscriptionStatus.EXPIRED

    subscription.updated_at = datetime.utcnow()
    db.commit()
    print(f"✅ Subscription updated: {stripe_sub_id} -> {status}")


def handle_subscription_deleted(db: Session, subscription_data: dict):
    """Handle subscription cancellation"""
    stripe_sub_id = subscription_data.get("id")

    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == stripe_sub_id
    ).first()

    if not subscription:
        print(f"Subscription not found: {stripe_sub_id}")
        return

    # Downgrade to free tier
    subscription.tier = SubscriptionTier.FREE
    subscription.status = SubscriptionStatus.CANCELLED
    subscription.voice_conversations_limit = 1  # Back to trial
    subscription.updated_at = datetime.utcnow()

    db.commit()
    print(f"✅ Subscription cancelled: {stripe_sub_id}")
