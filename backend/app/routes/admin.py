"""
Admin Dashboard API Routes
Provides administrative control over users, subscriptions, and settings.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text, func, or_
from datetime import datetime, timedelta
import io
import csv
import secrets
import string

from ..models.user import User
from ..models.room import Room, Turn
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

class PasswordResetIn(BaseModel):
    new_password: str


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


# ========================================
# ROOM/SESSION MANAGEMENT
# ========================================

@router.get("/rooms")
def list_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    phase: Optional[str] = None,
    room_type: Optional[str] = None
):
    """List all rooms with their participants and status"""
    check_admin(current_user)

    query = db.query(Room)

    if phase:
        query = query.filter(Room.phase == phase)
    if room_type:
        query = query.filter(Room.room_type == room_type)

    rooms = query.order_by(Room.created_at.desc()).offset(skip).limit(limit).all()
    total = query.count()

    result = []
    for room in rooms:
        participants = []
        for p in room.participants:
            participants.append({
                "id": p.id,
                "email": p.email,
                "name": p.name
            })

        turn_count = db.query(Turn).filter(Turn.room_id == room.id).count()

        result.append({
            "id": room.id,
            "title": room.title,
            "category": room.category,
            "room_type": room.room_type,
            "phase": room.phase,
            "created_at": str(room.created_at) if room.created_at else None,
            "resolved_at": str(room.resolved_at) if room.resolved_at else None,
            "participants": participants,
            "turn_count": turn_count,
            "invite_token": room.invite_token,
        })

    return {"rooms": result, "total": total, "skip": skip, "limit": limit}


@router.get("/rooms/{room_id}")
def get_room_details(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed room information including turns"""
    check_admin(current_user)

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    participants = []
    for p in room.participants:
        participants.append({
            "id": p.id,
            "email": p.email,
            "name": p.name
        })

    turns = db.query(Turn).filter(Turn.room_id == room_id).order_by(Turn.created_at.asc()).all()
    turn_data = []
    for turn in turns:
        turn_data.append({
            "id": turn.id,
            "user_id": turn.user_id,
            "kind": turn.kind,
            "summary": turn.summary[:200] + "..." if turn.summary and len(turn.summary) > 200 else turn.summary,
            "context": turn.context,
            "created_at": str(turn.created_at) if turn.created_at else None,
        })

    return {
        "id": room.id,
        "title": room.title,
        "category": room.category,
        "room_type": room.room_type,
        "phase": room.phase,
        "created_at": str(room.created_at) if room.created_at else None,
        "resolved_at": str(room.resolved_at) if room.resolved_at else None,
        "participants": participants,
        "turns": turn_data,
        "user1_summary": room.user1_summary,
        "user2_summary": room.user2_summary,
        "resolution_text": room.resolution_text,
    }


@router.delete("/rooms/{room_id}")
def delete_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a room and all its turns"""
    check_admin(current_user)

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Delete turns first
    db.query(Turn).filter(Turn.room_id == room_id).delete()
    # Clear participants
    db.execute(text(f"DELETE FROM room_participants WHERE room_id = {room_id}"))
    # Delete room
    db.delete(room)
    db.commit()

    return {"status": "success", "deleted_room_id": room_id}


# ========================================
# SEARCH & FILTER
# ========================================

@router.get("/users/search")
def search_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    tier: Optional[str] = None,
    status: Optional[str] = None,
    is_admin: Optional[bool] = None,
    is_guest: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
):
    """Search and filter users"""
    check_admin(current_user)

    query = db.query(User)

    if q:
        search = f"%{q}%"
        query = query.filter(or_(
            User.email.ilike(search),
            User.name.ilike(search)
        ))

    if is_admin is not None:
        query = query.filter(User.is_admin == (1 if is_admin else 0))

    if is_guest is not None:
        query = query.filter(User.is_guest == (1 if is_guest else 0))

    users = query.offset(skip).limit(limit).all()
    total = query.count()

    result = []
    for user in users:
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()

        # Apply tier and status filters
        if tier and subscription:
            if subscription.tier.value.lower() != tier.lower():
                continue
        elif tier and not subscription:
            continue

        if status and subscription:
            if subscription.status.value.lower() != status.lower():
                continue
        elif status and not subscription:
            continue

        result.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_guest": getattr(user, 'is_guest', False),
            "is_admin": getattr(user, 'is_admin', False),
            "created_at": str(user.created_at) if hasattr(user, 'created_at') else None,
            "subscription": {
                "tier": subscription.tier.value if subscription and subscription.tier else "free",
                "status": subscription.status.value if subscription and subscription.status else "trial",
            } if subscription else None
        })

    return {"users": result, "total": len(result), "skip": skip, "limit": limit}


# ========================================
# PASSWORD RESET
# ========================================

@router.put("/users/{user_id}/password")
def reset_user_password(
    user_id: int,
    payload: PasswordResetIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset a user's password"""
    check_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"status": "success", "user_id": user_id}


@router.post("/users/{user_id}/generate-password")
def generate_temp_password(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a temporary password for a user"""
    check_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate random password
    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

    user.hashed_password = hash_password(temp_password)
    db.commit()

    return {"status": "success", "user_id": user_id, "temp_password": temp_password}


# ========================================
# EXPORT
# ========================================

@router.get("/users/export")
def export_users_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all users to CSV"""
    check_admin(current_user)

    users = db.query(User).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "ID", "Email", "Name", "Is Admin", "Is Guest",
        "Created At", "Subscription Tier", "Subscription Status"
    ])

    for user in users:
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        writer.writerow([
            user.id,
            user.email,
            user.name or "",
            "Yes" if getattr(user, 'is_admin', False) else "No",
            "Yes" if getattr(user, 'is_guest', False) else "No",
            str(user.created_at) if hasattr(user, 'created_at') and user.created_at else "",
            subscription.tier.value if subscription and subscription.tier else "free",
            subscription.status.value if subscription and subscription.status else "trial",
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_export.csv"}
    )


# ========================================
# ANALYTICS
# ========================================

@router.get("/analytics")
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get analytics data for charts"""
    check_admin(current_user)

    cutoff = datetime.utcnow() - timedelta(days=days)

    # User signups over time
    signups = db.execute(text("""
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= :cutoff
        GROUP BY DATE(created_at)
        ORDER BY date
    """), {"cutoff": cutoff}).fetchall()

    # Room completions over time
    completions = db.execute(text("""
        SELECT DATE(resolved_at) as date, COUNT(*) as count
        FROM rooms
        WHERE resolved_at >= :cutoff AND phase = 'resolved'
        GROUP BY DATE(resolved_at)
        ORDER BY date
    """), {"cutoff": cutoff}).fetchall()

    # Subscription breakdown
    tier_breakdown = db.execute(text("""
        SELECT tier, COUNT(*) as count
        FROM subscriptions
        GROUP BY tier
    """)).fetchall()

    # Active users (users with activity in last 7 days)
    active_users = db.execute(text("""
        SELECT COUNT(DISTINCT user_id)
        FROM turns
        WHERE created_at >= :cutoff
    """), {"cutoff": datetime.utcnow() - timedelta(days=7)}).scalar()

    # Rooms by phase
    rooms_by_phase = db.execute(text("""
        SELECT phase, COUNT(*) as count
        FROM rooms
        GROUP BY phase
    """)).fetchall()

    # Average turns per room
    avg_turns = db.execute(text("""
        SELECT AVG(turn_count) FROM (
            SELECT room_id, COUNT(*) as turn_count
            FROM turns
            GROUP BY room_id
        ) t
    """)).scalar() or 0

    return {
        "signups_over_time": [{"date": str(r[0]), "count": r[1]} for r in signups],
        "completions_over_time": [{"date": str(r[0]), "count": r[1]} for r in completions],
        "tier_breakdown": [{"tier": r[0], "count": r[1]} for r in tier_breakdown],
        "active_users_7d": active_users,
        "rooms_by_phase": [{"phase": r[0], "count": r[1]} for r in rooms_by_phase],
        "avg_turns_per_room": round(float(avg_turns), 1),
    }


# ========================================
# BULK ACTIONS
# ========================================

@router.post("/users/bulk/subscription")
def bulk_update_subscriptions(
    user_ids: List[int],
    tier: str,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update subscription for multiple users at once"""
    check_admin(current_user)

    tier_map = {"free": SubscriptionTier.FREE, "plus": SubscriptionTier.PLUS, "pro": SubscriptionTier.PRO}
    status_map = {"trial": SubscriptionStatus.TRIAL, "active": SubscriptionStatus.ACTIVE,
                  "cancelled": SubscriptionStatus.CANCELLED, "past_due": SubscriptionStatus.PAST_DUE}

    if tier.lower() not in tier_map:
        raise HTTPException(status_code=400, detail="Invalid tier")
    if status.lower() not in status_map:
        raise HTTPException(status_code=400, detail="Invalid status")

    updated = 0
    for user_id in user_ids:
        subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not subscription:
            subscription = Subscription(user_id=user_id)
            db.add(subscription)

        subscription.tier = tier_map[tier.lower()]
        subscription.status = status_map[status.lower()]
        subscription.updated_at = datetime.utcnow()

        if subscription.tier in [SubscriptionTier.PLUS, SubscriptionTier.PRO]:
            subscription.voice_conversations_limit = 999999
        else:
            subscription.voice_conversations_limit = 1

        updated += 1

    db.commit()

    return {"status": "success", "updated_count": updated}


@router.post("/users/bulk/delete")
def bulk_delete_users(
    user_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete multiple users at once"""
    check_admin(current_user)

    # Don't allow deleting yourself
    if current_user.id in user_ids:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    deleted = 0
    for user_id in user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.execute(text(f"DELETE FROM turns WHERE user_id = {user_id}"))
            db.execute(text(f"DELETE FROM room_participants WHERE user_id = {user_id}"))
            db.execute(text(f"DELETE FROM subscriptions WHERE user_id = {user_id}"))
            db.delete(user)
            deleted += 1

    db.commit()

    return {"status": "success", "deleted_count": deleted}
