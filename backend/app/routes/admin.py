"""
Admin Dashboard API Routes
Provides administrative control over users, subscriptions, and settings.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime

from ..models.user import User
from ..models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from ..security import hash_password, verify_password, create_access_token
from ..db import get_db
from ..config import settings
from ..deps import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


# ========================================
# SCHEMAS
# ========================================

class AdminLoginIn(BaseModel):
    email: EmailStr
    password: str

class AdminTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_admin: bool = True

class UserUpdateIn(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None

class SubscriptionUpdateIn(BaseModel):
    tier: str  # free, plus, pro
    status: str  # trial, active, cancelled, past_due

class SettingsOut(BaseModel):
    stripe_publishable_key: Optional[str]
    stripe_webhook_configured: bool
    anthropic_key_configured: bool
    gemini_key_configured: bool
    openai_key_configured: bool
    sendgrid_key_configured: bool
    aws_configured: bool
    telegram_configured: bool
    total_users: int
    active_subscriptions: int
    total_rooms: int

class CreateAdminIn(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


# ========================================
# HELPER FUNCTIONS
# ========================================

def check_admin(user: User):
    """Verify user has admin privileges"""
    if not getattr(user, 'is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


# ========================================
# AUTHENTICATION
# ========================================

@router.post("/login", response_model=AdminTokenOut)
def admin_login(payload: AdminLoginIn, db: Session = Depends(get_db)):
    """Admin login - only allows users with is_admin=True"""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not getattr(user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin access required")

    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return AdminTokenOut(access_token=token, is_admin=True)


# ========================================
# USER MANAGEMENT
# ========================================

@router.get("/users")
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """List all users with their subscriptions"""
    check_admin(current_user)

    users = db.query(User).offset(skip).limit(limit).all()
    total = db.query(User).count()

    result = []
    for user in users:
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        result.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "stripe_customer_id": user.stripe_customer_id,
            "is_guest": getattr(user, 'is_guest', False),
            "is_admin": getattr(user, 'is_admin', False),
            "created_at": str(user.created_at) if hasattr(user, 'created_at') else None,
            "subscription": {
                "id": subscription.id,
                "tier": subscription.tier.value if subscription.tier else "free",
                "status": subscription.status.value if subscription.status else "trial",
                "stripe_subscription_id": subscription.stripe_subscription_id,
            } if subscription else None
        })

    return {"users": result, "total": total, "skip": skip, "limit": limit}


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a user's details"""
    check_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = payload.email
    if payload.is_admin is not None:
        user.is_admin = 1 if payload.is_admin else 0

    db.commit()
    return {"status": "success", "user_id": user_id}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user and their related data"""
    check_admin(current_user)

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from sqlalchemy import text
    db.execute(text(f"DELETE FROM turns WHERE user_id = {user_id}"))
    db.execute(text(f"DELETE FROM room_participants WHERE user_id = {user_id}"))
    db.execute(text(f"DELETE FROM subscriptions WHERE user_id = {user_id}"))
    db.delete(user)
    db.commit()

    return {"status": "success", "deleted_user_id": user_id}


# ========================================
# SUBSCRIPTION MANAGEMENT
# ========================================

@router.put("/users/{user_id}/subscription")
def update_subscription(
    user_id: int,
    payload: SubscriptionUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a user's subscription tier and status"""
    check_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not subscription:
        subscription = Subscription(user_id=user_id)
        db.add(subscription)

    tier_map = {"free": SubscriptionTier.FREE, "plus": SubscriptionTier.PLUS, "pro": SubscriptionTier.PRO}
    if payload.tier.lower() in tier_map:
        subscription.tier = tier_map[payload.tier.lower()]
    else:
        raise HTTPException(status_code=400, detail="Invalid tier")

    status_map = {"trial": SubscriptionStatus.TRIAL, "active": SubscriptionStatus.ACTIVE,
                  "cancelled": SubscriptionStatus.CANCELLED, "past_due": SubscriptionStatus.PAST_DUE}
    if payload.status.lower() in status_map:
        subscription.status = status_map[payload.status.lower()]
    else:
        raise HTTPException(status_code=400, detail="Invalid status")

    if subscription.tier in [SubscriptionTier.PLUS, SubscriptionTier.PRO]:
        subscription.voice_conversations_limit = 999999
    else:
        subscription.voice_conversations_limit = 1

    subscription.updated_at = datetime.utcnow()
    db.commit()

    return {"status": "success", "user_id": user_id, "subscription": {"tier": subscription.tier.value, "status": subscription.status.value}}


# ========================================
# SETTINGS & CONFIGURATION
# ========================================

@router.get("/settings", response_model=SettingsOut)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get platform settings and configuration status"""
    check_admin(current_user)

    from sqlalchemy import text
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
    active_subscriptions = db.execute(text("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'")).scalar()
    total_rooms = db.execute(text("SELECT COUNT(*) FROM rooms")).scalar()

    return SettingsOut(
        stripe_publishable_key=settings.STRIPE_PUBLISHABLE_KEY[:20] + "..." if hasattr(settings, 'STRIPE_PUBLISHABLE_KEY') and settings.STRIPE_PUBLISHABLE_KEY else None,
        stripe_webhook_configured=bool(getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)),
        anthropic_key_configured=bool(getattr(settings, 'ANTHROPIC_API_KEY', None)),
        gemini_key_configured=bool(getattr(settings, 'GEMINI_API_KEY', None)),
        openai_key_configured=bool(getattr(settings, 'OPENAI_API_KEY', None)),
        sendgrid_key_configured=bool(getattr(settings, 'SENDGRID_API_KEY', None)),
        aws_configured=bool(getattr(settings, 'AWS_ACCESS_KEY_ID', None)),
        telegram_configured=bool(getattr(settings, 'TELEGRAM_BOT_TOKEN', None)),
        total_users=total_users,
        active_subscriptions=active_subscriptions,
        total_rooms=total_rooms
    )


# ========================================
# ADMIN USER CREATION (Bootstrap)
# ========================================

@router.post("/create-admin")
def create_admin_user(
    payload: CreateAdminIn,
    secret: str,
    db: Session = Depends(get_db)
):
    """Create an admin user. Requires STRIPE_SECRET_KEY for protection."""
    if secret != settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        existing.hashed_password = hash_password(payload.password)
        existing.is_admin = 1
        if payload.name:
            existing.name = payload.name
        db.commit()
        return {"status": "updated", "user_id": existing.id, "email": existing.email}

    user = User(
        email=payload.email,
        name=payload.name or payload.email.split("@")[0],
        hashed_password=hash_password(payload.password),
        is_admin=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    subscription = Subscription(
        user_id=user.id,
        tier=SubscriptionTier.PRO,
        status=SubscriptionStatus.ACTIVE,
        voice_conversations_limit=999999
    )
    db.add(subscription)
    db.commit()

    return {"status": "created", "user_id": user.id, "email": user.email}
