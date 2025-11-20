from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import httpx

from ..models.user import User
from ..security import hash_password, verify_password, create_access_token
from ..db import get_db
from ..config import settings
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

async def verify_turnstile(token: str) -> bool:
    """Verify a Cloudflare Turnstile token"""
    if not settings.TURNSTILE_SECRET_KEY:
        # If Turnstile is not configured, skip verification
        return True

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.TURNSTILE_SECRET_KEY,
                    "response": token
                }
            )
            result = response.json()
            return result.get("success", False)
    except Exception as e:
        print(f"Turnstile verification error: {e}")
        return False

class RegisterIn(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: str
    turnstile_token: Optional[str] = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginIn(BaseModel):
    email: EmailStr
    password: str
    turnstile_token: Optional[str] = None

class GoogleAuthIn(BaseModel):
    token: str  # Google OAuth ID token

class FacebookAuthIn(BaseModel):
    accessToken: str  # Facebook access token
    userID: str  # Facebook user ID

class TwitterAuthIn(BaseModel):
    access_token: str  # X/Twitter OAuth token
    access_token_secret: str  # X/Twitter OAuth secret

class TelegramAuthIn(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    has_completed_screening: bool = False

class UpdateUserIn(BaseModel):
    name: Optional[str] = None

@router.post("/register", response_model=TokenOut, status_code=201)
async def register(payload: RegisterIn, db: Session = Depends(get_db)):
    # Verify Turnstile token if configured and provided
    if settings.TURNSTILE_SECRET_KEY and payload.turnstile_token:
        is_valid = await verify_turnstile(payload.turnstile_token)
        if not is_valid:
            raise HTTPException(status_code=400, detail="CAPTCHA verification failed")
    elif settings.TURNSTILE_SECRET_KEY and not payload.turnstile_token:
        raise HTTPException(status_code=400, detail="CAPTCHA token required")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=payload.email, name=payload.name, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

@router.get("/admin/users")
def list_users(secret: str, db: Session = Depends(get_db)):
    """
    List all users and their subscriptions for debugging.
    Requires the STRIPE_SECRET_KEY as the secret parameter for protection.
    """
    if secret != settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    from sqlalchemy import text
    from ..models.subscription import Subscription

    users = db.query(User).all()
    result = []

    for user in users:
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        result.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "stripe_customer_id": user.stripe_customer_id,
            "is_guest": getattr(user, 'is_guest', False),
            "created_at": str(user.created_at) if hasattr(user, 'created_at') else None,
            "subscription": {
                "id": subscription.id,
                "tier": subscription.tier,
                "status": subscription.status,
                "stripe_subscription_id": subscription.stripe_subscription_id,
                "created_at": str(subscription.created_at) if hasattr(subscription, 'created_at') else None
            } if subscription else None
        })

    return {"users": result, "total": len(result)}

@router.post("/admin/link-subscription")
def link_subscription(
    secret: str,
    user_email: str,
    stripe_subscription_id: str,
    stripe_customer_id: str,
    db: Session = Depends(get_db)
):
    """
    Manually link a Stripe subscription to a user account.
    Used to fix accounts where webhook failed to link subscription.
    """
    if secret != settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    from ..models.subscription import Subscription, SubscriptionTier, SubscriptionStatus

    # Find user
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {user_email}")

    # Update user's stripe customer ID
    user.stripe_customer_id = stripe_customer_id

    # Find or create subscription
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not subscription:
        subscription = Subscription(user_id=user.id)
        db.add(subscription)

    # Update subscription
    subscription.tier = SubscriptionTier.PLUS
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.stripe_subscription_id = stripe_subscription_id
    subscription.voice_conversations_limit = 999999  # Unlimited for paid tiers

    db.commit()

    return {
        "status": "success",
        "user_id": user.id,
        "email": user.email,
        "subscription_id": subscription.id,
        "tier": subscription.tier.value,
        "stripe_subscription_id": stripe_subscription_id
    }

@router.delete("/admin/reset-database")
def reset_database(secret: str, db: Session = Depends(get_db)):
    """
    DANGER: Delete all users, subscriptions, and rooms for testing.
    Requires the STRIPE_SECRET_KEY as the secret parameter for protection.
    """
    # Use Stripe secret key as admin password for protection
    if secret != settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    from sqlalchemy import text

    # Get counts before
    user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
    sub_count = db.execute(text("SELECT COUNT(*) FROM subscriptions")).scalar()
    room_count = db.execute(text("SELECT COUNT(*) FROM rooms")).scalar()

    # Delete in order to respect foreign keys
    db.execute(text("DELETE FROM turns"))
    db.execute(text("DELETE FROM room_participants"))
    db.execute(text("DELETE FROM rooms"))
    db.execute(text("DELETE FROM subscriptions"))
    db.execute(text("DELETE FROM users"))
    db.commit()

    return {
        "status": "success",
        "deleted": {
            "users": user_count,
            "subscriptions": sub_count,
            "rooms": room_count
        }
    }

@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, db: Session = Depends(get_db)):
    # Verify Turnstile token if configured and provided
    if settings.TURNSTILE_SECRET_KEY and payload.turnstile_token:
        is_valid = await verify_turnstile(payload.turnstile_token)
        if not is_valid:
            raise HTTPException(status_code=400, detail="CAPTCHA verification failed")
    elif settings.TURNSTILE_SECRET_KEY and not payload.turnstile_token:
        raise HTTPException(status_code=400, detail="CAPTCHA token required")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

@router.post("/google", response_model=TokenOut)
async def google_login(payload: GoogleAuthIn, db: Session = Depends(get_db)):
    """Login or register using Google OAuth token"""
    try:
        # Verify the Google token with Google's API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.token}"
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")

            google_data = response.json()
            email = google_data.get("email")
            name = google_data.get("name")
            picture = google_data.get("picture")

            if not email:
                raise HTTPException(status_code=400, detail="Email not provided by Google")

            # Find or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                # Create new user with Google profile data
                user = User(
                    email=email,
                    name=name,
                    profile_picture_url=picture,
                    hashed_password=None  # No password for OAuth users
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update existing user's profile picture if they don't have one or if Google provides a new one
                if picture and (not user.profile_picture_url or user.profile_picture_url != picture):
                    user.profile_picture_url = picture
                    if not user.name and name:
                        user.name = name
                    db.commit()

            # Create access token
            token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            return TokenOut(access_token=token)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify Google token: {str(e)}")

@router.post("/facebook", response_model=TokenOut)
async def facebook_login(payload: FacebookAuthIn, db: Session = Depends(get_db)):
    """Login or register using Facebook access token"""
    try:
        # Verify Facebook token and get user data
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token={payload.accessToken}"
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Facebook token")

            fb_data = response.json()
            email = fb_data.get("email")
            name = fb_data.get("name")
            picture_url = fb_data.get("picture", {}).get("data", {}).get("url")

            if not email:
                raise HTTPException(status_code=400, detail="Email not provided by Facebook")

            # Find or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    name=name,
                    profile_picture_url=picture_url,
                    hashed_password=None
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update profile picture if changed
                if picture_url and (not user.profile_picture_url or user.profile_picture_url != picture_url):
                    user.profile_picture_url = picture_url
                    if not user.name and name:
                        user.name = name
                    db.commit()

            token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            return TokenOut(access_token=token)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify Facebook token: {str(e)}")

@router.post("/twitter", response_model=TokenOut)
async def twitter_login(payload: TwitterAuthIn, db: Session = Depends(get_db)):
    """Login or register using X/Twitter OAuth credentials"""
    try:
        # Verify Twitter credentials and get user data
        async with httpx.AsyncClient() as client:
            # Note: This requires Twitter API v2 credentials
            response = await client.get(
                "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
                headers={"Authorization": f"Bearer {payload.access_token}"}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Twitter credentials")

            twitter_data = response.json().get("data", {})
            username = twitter_data.get("username")
            name = twitter_data.get("name")
            picture_url = twitter_data.get("profile_image_url", "").replace("_normal", "_400x400")  # Get larger image

            # Twitter doesn't always provide email, use username@twitter.com as fallback
            email = f"{username}@twitter.meedi8.com"  # Custom domain to avoid conflicts

            # Find or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    name=name or username,
                    profile_picture_url=picture_url,
                    hashed_password=None
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update profile picture if changed
                if picture_url and (not user.profile_picture_url or user.profile_picture_url != picture_url):
                    user.profile_picture_url = picture_url
                    if not user.name and name:
                        user.name = name
                    db.commit()

            token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            return TokenOut(access_token=token)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify Twitter credentials: {str(e)}")

@router.post("/telegram", response_model=TokenOut)
async def telegram_login(payload: TelegramAuthIn, db: Session = Depends(get_db)):
    """Login or register using Telegram Login Widget data"""
    import hashlib
    import hmac

    # Verify Telegram data authenticity
    bot_token = settings.TELEGRAM_BOT_TOKEN if hasattr(settings, 'TELEGRAM_BOT_TOKEN') else ""

    if not bot_token:
        raise HTTPException(status_code=500, detail="Telegram bot token not configured")

    # Create verification hash
    data_check_dict = {
        "id": str(payload.id),
        "first_name": payload.first_name,
        "auth_date": str(payload.auth_date)
    }
    if payload.last_name:
        data_check_dict["last_name"] = payload.last_name
    if payload.username:
        data_check_dict["username"] = payload.username
    if payload.photo_url:
        data_check_dict["photo_url"] = payload.photo_url

    data_check_string = "\n".join([f"{k}={v}" for k, v in sorted(data_check_dict.items())])
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if calculated_hash != payload.hash:
        raise HTTPException(status_code=401, detail="Invalid Telegram data")

    # Use Telegram ID as email (since Telegram doesn't provide email)
    email = f"telegram_{payload.id}@telegram.meedi8.com"
    name = f"{payload.first_name} {payload.last_name or ''}".strip()

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            profile_picture_url=payload.photo_url,
            hashed_password=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update profile picture if changed
        if payload.photo_url and (not user.profile_picture_url or user.profile_picture_url != payload.photo_url):
            user.profile_picture_url = payload.photo_url
            if not user.name and name:
                user.name = name
            db.commit()

    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=current_user.profile_picture_url,
        has_completed_screening=current_user.has_completed_screening
    )

@router.put("/me", response_model=UserOut)
def update_me(
    payload: UpdateUserIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile (name)"""
    if payload.name is not None:
        current_user.name = payload.name.strip() if payload.name else current_user.name

    db.commit()
    db.refresh(current_user)

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=current_user.profile_picture_url,
        has_completed_screening=current_user.has_completed_screening
    )

@router.get("/me/usage")
def get_my_usage(
    current_user: User = Depends(get_current_user)
):
    """Get current user's subscription usage"""
    from app.middleware.rate_limit import get_usage_info
    return get_usage_info(current_user)

@router.post("/create-guest", response_model=TokenOut, status_code=201)
def create_guest(db: Session = Depends(get_db)):
    """Create a temporary guest account for users to try the platform"""
    import uuid
    import secrets

    # Generate unique guest email
    guest_uuid = str(uuid.uuid4())[:8]
    guest_email = f"guest_{guest_uuid}@temp.meedi8.com"

    # Create guest user with random password (user won't see it)
    guest = User(
        email=guest_email,
        name=f"Guest {guest_uuid}",
        hashed_password=hash_password(secrets.token_urlsafe(32)),  # Random password
        is_guest=True  # Mark as guest account
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)

    # Create access token
    token = create_access_token({"sub": str(guest.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

class StripeSessionLoginIn(BaseModel):
    session_id: Optional[str] = None
    subscription_id: Optional[str] = None
    payment_intent_id: Optional[str] = None

@router.post("/stripe-session-login", response_model=TokenOut)
def stripe_session_login(payload: StripeSessionLoginIn, db: Session = Depends(get_db)):
    """
    Exchange a Stripe checkout session or subscription ID for a login token.
    Used after guest checkout to automatically log in the newly created user.
    """
    import stripe
    from app.config import settings

    stripe.api_key = settings.STRIPE_SECRET_KEY

    customer_email = None

    try:
        if payload.session_id:
            # Get customer email from checkout session
            session = stripe.checkout.Session.retrieve(payload.session_id)
            customer_id = session.get("customer")
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                customer_email = customer.get("email")
        elif payload.payment_intent_id:
            # Get customer email from payment intent -> invoice -> subscription
            payment_intent = stripe.PaymentIntent.retrieve(payload.payment_intent_id)

            # First try to get email from payment method attached to payment intent
            payment_method_id = payment_intent.get("payment_method")
            if payment_method_id:
                payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
                customer_email = payment_method.get("billing_details", {}).get("email")
                if not customer_email and payment_method.get("link"):
                    customer_email = payment_method.get("link", {}).get("email")

            # If no email yet, try invoice -> subscription -> customer path
            if not customer_email:
                invoice_id = payment_intent.get("invoice")
                if invoice_id:
                    invoice = stripe.Invoice.retrieve(invoice_id)
                    subscription_id = invoice.get("subscription")
                    if subscription_id:
                        subscription = stripe.Subscription.retrieve(subscription_id)
                        customer_id = subscription.get("customer")
                        if customer_id:
                            customer = stripe.Customer.retrieve(customer_id)
                            customer_email = customer.get("email")

                            # If customer email is not set, try to get from subscription's payment method
                            if not customer_email:
                                sub_payment_method_id = subscription.get("default_payment_method")
                                if sub_payment_method_id:
                                    sub_payment_method = stripe.PaymentMethod.retrieve(sub_payment_method_id)
                                    customer_email = sub_payment_method.get("billing_details", {}).get("email")
                                    if not customer_email and sub_payment_method.get("link"):
                                        customer_email = sub_payment_method.get("link", {}).get("email")
        elif payload.subscription_id:
            # Get customer email from subscription
            subscription = stripe.Subscription.retrieve(payload.subscription_id)
            customer_id = subscription.get("customer")
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                customer_email = customer.get("email")

                # If customer email is not set, try to get from payment method
                if not customer_email:
                    payment_method_id = subscription.get("default_payment_method")
                    if payment_method_id:
                        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
                        customer_email = payment_method.get("billing_details", {}).get("email")
                        if not customer_email and payment_method.get("link"):
                            customer_email = payment_method.get("link", {}).get("email")
        else:
            raise HTTPException(status_code=400, detail="Either session_id or subscription_id is required")

        if not customer_email:
            raise HTTPException(status_code=404, detail="No customer email found for this session")

        # Find user by email
        user = db.query(User).filter(User.email == customer_email).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"User account not found. Payment may still be processing.|{customer_email}"
            )

        # Create and return access token
        token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return TokenOut(access_token=token)

    except stripe.StripeError as e:
        print(f"❌ Stripe error in stripe-session-login: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected error in stripe-session-login: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

class ConvertGuestIn(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: str

@router.put("/convert-guest", response_model=TokenOut)
def convert_guest(
    payload: ConvertGuestIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convert a guest account to a real account with email and password"""
    # Verify user is actually a guest
    if not current_user.is_guest:
        raise HTTPException(status_code=400, detail="Only guest accounts can be converted")

    # Check if email is already taken
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Update guest account to real account
    current_user.email = payload.email
    current_user.name = payload.name or current_user.name
    current_user.hashed_password = hash_password(payload.password)
    current_user.is_guest = False

    db.commit()
    db.refresh(current_user)

    # Return new token with updated user data
    token = create_access_token({"sub": str(current_user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)
