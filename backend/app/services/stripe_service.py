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
        # Validate that customer still exists in Stripe
        try:
            stripe.Customer.retrieve(user.stripe_customer_id)
            return user.stripe_customer_id
        except stripe.InvalidRequestError as e:
            # Customer was deleted or doesn't exist - clear stale ID and create new
            print(f"⚠️ Stale Stripe customer ID {user.stripe_customer_id} for user {user.id}: {str(e)}")
            user.stripe_customer_id = None
            db.commit()

    # Create new Stripe customer
    customer = stripe.Customer.create(
        email=user.email,
        name=user.name,
        metadata={
            "user_id": str(user.id)
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


def create_subscription_with_payment_intent(
    db: Session,
    user: User,
    tier: str,
    interval: str
) -> dict:
    """
    Create Stripe Subscription with PaymentIntent for Express Checkout Element.

    This approach shows actual price in Apple Pay/Google Pay sheets and provides
    native wallet payment experience.

    Returns:
        client_secret: For mounting Express Checkout Element
        subscription_id: For tracking
        payment_intent_id: For webhook correlation
    """
    customer_id = get_or_create_stripe_customer(db, user)
    price_id = get_price_id(tier, interval)

    # Create subscription with payment_behavior='default_incomplete'
    # This creates subscription in incomplete status, waiting for payment
    # NOTE: Using confirmation_secret instead of payment_intent (Stripe Basil API change)
    subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{'price': price_id}],
        payment_behavior='default_incomplete',  # CRITICAL: Don't auto-charge
        payment_settings={
            'payment_method_types': ['card', 'link'],
            'save_default_payment_method': 'on_subscription',  # Save for recurring
        },
        expand=['latest_invoice.confirmation_secret', 'pending_setup_intent'],
        metadata={
            'user_id': str(user.id),
            'tier': tier,
            'interval': interval
        }
    )

    # Get client_secret using confirmation_secret (new Stripe API)
    client_secret = None
    intent_id = None

    if subscription.pending_setup_intent:
        # Free trial or $0 subscription
        client_secret = subscription.pending_setup_intent.client_secret
        intent_id = subscription.pending_setup_intent.id
    elif subscription.latest_invoice and hasattr(subscription.latest_invoice, 'confirmation_secret'):
        # Paid subscription
        client_secret = subscription.latest_invoice.confirmation_secret.client_secret
        if hasattr(subscription.latest_invoice.confirmation_secret, 'payment_intent'):
            intent_id = subscription.latest_invoice.confirmation_secret.payment_intent
    else:
        raise ValueError("No client_secret available from subscription")

    return {
        'client_secret': client_secret,
        'subscription_id': subscription.id,
        'payment_intent_id': intent_id
    }


def create_guest_subscription_with_payment_intent(
    tier: str,
    interval: str,
    customer_email: str = None
) -> dict:
    """
    Create subscription for unauthenticated users with Express Checkout.
    Creates a temporary customer first, then attaches subscription.
    """
    try:
        price_id = get_price_id(tier, interval)

        # Create a temporary Stripe customer for guest checkout
        # Email will be updated from payment method after successful payment
        customer_params = {
            'metadata': {
                'tier': tier,
                'interval': interval,
                'guest_checkout': 'true'
            }
        }

        # Pre-fill customer email if provided (e.g., from OAuth)
        if customer_email:
            customer_params['email'] = customer_email

        print(f"Creating Stripe customer for guest checkout: {customer_params}")
        customer = stripe.Customer.create(**customer_params)
        print(f"✓ Created customer: {customer.id}")

        # Create subscription with the customer ID
        # NOTE: Using confirmation_secret instead of payment_intent (Stripe Basil API change)
        subscription_params = {
            'customer': customer.id,  # CRITICAL: Must provide customer ID
            'items': [{'price': price_id}],
            'payment_behavior': 'default_incomplete',
            'payment_settings': {
                'payment_method_types': ['card', 'link'],
                'save_default_payment_method': 'on_subscription',
            },
            'expand': ['latest_invoice.confirmation_secret', 'pending_setup_intent'],
            'metadata': {
                'tier': tier,
                'interval': interval,
                'guest_checkout': 'true'
            }
        }

        print(f"Creating subscription with params: customer={customer.id}, price={price_id}")
        subscription = stripe.Subscription.create(**subscription_params)
        print(f"✓ Created subscription: {subscription.id}")

        # Get client_secret - Stripe returns different intent types based on amount
        # For paid subscriptions: Use confirmation_secret (contains PaymentIntent)
        # For free trials or $0: Use pending_setup_intent (SetupIntent)
        client_secret = None
        intent_id = None

        if subscription.pending_setup_intent:
            # Free trial or $0 subscription - uses SetupIntent
            print(f"✓ Using SetupIntent for free/trial subscription")
            client_secret = subscription.pending_setup_intent.client_secret
            intent_id = subscription.pending_setup_intent.id
        elif subscription.latest_invoice and hasattr(subscription.latest_invoice, 'confirmation_secret'):
            # Paid subscription - uses PaymentIntent via confirmation_secret
            print(f"✓ Using confirmation_secret for paid subscription")
            client_secret = subscription.latest_invoice.confirmation_secret.client_secret
            # Extract PaymentIntent ID from confirmation_secret if available
            if hasattr(subscription.latest_invoice.confirmation_secret, 'payment_intent'):
                intent_id = subscription.latest_invoice.confirmation_secret.payment_intent
        else:
            print(f"❌ ERROR: No confirmation_secret or pending_setup_intent found")
            print(f"   Subscription: {subscription.id}")
            print(f"   Latest invoice: {subscription.latest_invoice}")
            raise ValueError("No client_secret available - subscription may not require payment")

        if not client_secret:
            raise ValueError("Failed to extract client_secret from subscription")

        print(f"✓ Extracted client_secret successfully")

        return {
            'client_secret': client_secret,
            'subscription_id': subscription.id,
            'payment_intent_id': intent_id
        }
    except Exception as e:
        print(f"❌ Error in create_guest_subscription_with_payment_intent: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


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
        # Subscription not in our database yet - this happens when a new subscription becomes active
        # from Express Checkout flow. We need to create it.
        if status == "active":
            print(f"ℹ️ Subscription {stripe_sub_id} not found but status is active - creating new subscription")

            # Get user_id from metadata or customer
            metadata = subscription_data.get("metadata", {})
            user_id = metadata.get("user_id")
            customer_id = subscription_data.get("customer")

            if not user_id and customer_id:
                # Try to find user by stripe_customer_id
                user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
                if user:
                    user_id = user.id
                    print(f"✅ Found user {user_id} by customer_id {customer_id}")

            if not user_id:
                print(f"⚠️ Cannot create subscription - no user_id found for {stripe_sub_id}")
                return

            user_id = int(user_id)

            # Get tier from price
            price_id = subscription_data["items"]["data"][0]["price"]["id"]
            tier = get_tier_from_price_id(price_id)

            # Get or create subscription for user
            from app.services.subscription_service import get_or_create_subscription
            subscription = get_or_create_subscription(db, user_id)

            # Update subscription with Stripe data
            subscription.tier = tier
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.stripe_subscription_id = stripe_sub_id
            subscription.stripe_price_id = price_id
            subscription.updated_at = datetime.utcnow()

            # Set appropriate limits based on tier
            if tier == SubscriptionTier.PRO:
                subscription.voice_conversations_limit = 999999  # Unlimited
            elif tier == SubscriptionTier.PLUS:
                subscription.voice_conversations_limit = 999999  # Unlimited

            db.commit()
            print(f"✅ Created subscription for user {user_id}: {tier.value}")
            return
        else:
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


def handle_payment_intent_succeeded(db: Session, payment_intent: dict):
    """
    Handle successful payment for Express Checkout subscriptions.
    Activates subscription after PaymentIntent succeeds.
    """
    # Get subscription ID from invoice
    # Try multiple locations for invoice ID
    invoice_id = payment_intent.get("invoice")

    # Fallback: check payment_details.order_reference (newer Stripe API)
    if not invoice_id:
        payment_details = payment_intent.get("payment_details", {})
        order_ref = payment_details.get("order_reference")
        if order_ref and order_ref.startswith("in_"):
            invoice_id = order_ref
            print(f"ℹ️ Found invoice ID from payment_details.order_reference: {invoice_id}")

    if not invoice_id:
        print(f"⚠️ No invoice found for PaymentIntent {payment_intent.get('id')}")
        print(f"   payment_intent keys: {list(payment_intent.keys())}")
        return

    try:
        # Retrieve full invoice to get subscription
        invoice = stripe.Invoice.retrieve(invoice_id)
        subscription_id = invoice.get("subscription")

        if not subscription_id:
            print("⚠️ No subscription found in invoice")
            return

        # Retrieve full subscription
        stripe_subscription = stripe.Subscription.retrieve(subscription_id)

        # Extract metadata
        metadata = stripe_subscription.get("metadata", {})
        customer_id = stripe_subscription.get("customer")
        price_id = stripe_subscription["items"]["data"][0]["price"]["id"]
        tier = get_tier_from_price_id(price_id)

        # Handle guest checkout or authenticated user
        is_guest_checkout = metadata.get("guest_checkout") == "true"

        if is_guest_checkout:
            # Create user account for guest checkout
            customer = stripe.Customer.retrieve(customer_id)
            customer_email = customer.get("email")

            # If customer email is not set, try to get it from the payment method
            if not customer_email:
                # First try the payment method from the payment_intent itself
                payment_method_id = payment_intent.get("payment_method")
                if not payment_method_id:
                    # Fallback to subscription's default payment method
                    payment_method_id = stripe_subscription.get("default_payment_method")

                if payment_method_id:
                    payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
                    # Email can be in billing_details or link object
                    customer_email = payment_method.get("billing_details", {}).get("email")
                    if not customer_email and payment_method.get("link"):
                        customer_email = payment_method.get("link", {}).get("email")

                    # Update customer with the email for future reference
                    if customer_email:
                        stripe.Customer.modify(customer_id, email=customer_email)
                        print(f"✅ Updated customer {customer_id} with email {customer_email}")

                # Also check receipt_email on payment_intent as last resort
                if not customer_email:
                    customer_email = payment_intent.get("receipt_email")
                    if customer_email:
                        stripe.Customer.modify(customer_id, email=customer_email)
                        print(f"✅ Updated customer {customer_id} with email from receipt_email: {customer_email}")

            if not customer_email:
                print("⚠️ Guest checkout missing customer email - could not find in customer or payment method")
                return

            # Check if user already exists with this email
            existing_user = db.query(User).filter(User.email == customer_email).first()
            if existing_user:
                print(f"ℹ️ User already exists for {customer_email}, linking subscription")
                user = existing_user
            else:
                # Create new user account
                import secrets
                user = User(
                    email=customer_email,
                    name=customer_email.split("@")[0],  # Use email prefix as default name
                    password_hash=secrets.token_urlsafe(32),  # Temporary password
                    stripe_customer_id=customer_id,
                    has_completed_screening=False
                )
                db.add(user)
                db.flush()  # Get user.id without committing
                print(f"✅ Created new user account for guest: {customer_email}")

            user_id = user.id
        else:
            # Authenticated checkout - get user_id from metadata
            user_id = metadata.get("user_id")
            if not user_id:
                print("⚠️ Missing user_id in subscription metadata")
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
        print(f"✅ Subscription activated via PaymentIntent for user {user_id}: {tier.value}")

    except Exception as e:
        print(f"❌ Error handling PaymentIntent: {e}")
        import traceback
        traceback.print_exc()
