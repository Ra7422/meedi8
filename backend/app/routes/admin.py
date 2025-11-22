"""
Admin Dashboard API Routes
Provides administrative control over users, subscriptions, and settings.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text, func, or_
from datetime import datetime, timedelta
import io
import csv
import secrets
import string
import httpx
import json

from ..models.user import User
from ..models.room import Room, Turn
from ..models.subscription import Subscription, SubscriptionTier, SubscriptionStatus, ApiCost
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


def log_audit(
    admin_email: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None
):
    """Log an admin action to the audit trail"""
    from ..main import audit_log_store

    ip_address = None
    if request:
        # Get IP from X-Forwarded-For header (for proxied requests) or client host
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            ip_address = forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else None

    audit_log_store.add_log(
        admin_email=admin_email,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        details=details,
        ip_address=ip_address
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
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a user's details"""
    check_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = {}
    if payload.name is not None:
        changes["name"] = {"from": user.name, "to": payload.name}
        user.name = payload.name
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        changes["email"] = {"from": user.email, "to": payload.email}
        user.email = payload.email
    if payload.is_admin is not None:
        changes["is_admin"] = {"from": bool(user.is_admin), "to": payload.is_admin}
        user.is_admin = 1 if payload.is_admin else 0

    db.commit()

    log_audit(
        admin_email=current_user.email,
        action="user_updated",
        target_type="user",
        target_id=user_id,
        details={"user_email": user.email, "changes": changes},
        request=request
    )

    return {"status": "success", "user_id": user_id}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
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

    user_email = user.email

    from sqlalchemy import text
    db.execute(text(f"DELETE FROM turns WHERE user_id = {user_id}"))
    db.execute(text(f"DELETE FROM room_participants WHERE user_id = {user_id}"))
    db.execute(text(f"DELETE FROM subscriptions WHERE user_id = {user_id}"))
    db.delete(user)
    db.commit()

    log_audit(
        admin_email=current_user.email,
        action="user_deleted",
        target_type="user",
        target_id=user_id,
        details={"user_email": user_email},
        request=request
    )

    return {"status": "success", "deleted_user_id": user_id}


# ========================================
# SUBSCRIPTION MANAGEMENT
# ========================================

@router.put("/users/{user_id}/subscription")
def update_subscription(
    user_id: int,
    payload: SubscriptionUpdateIn,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a user's subscription tier and status"""
    check_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()

    old_tier = subscription.tier.value if subscription and subscription.tier else "none"
    old_status = subscription.status.value if subscription and subscription.status else "none"

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

    log_audit(
        admin_email=current_user.email,
        action="subscription_changed",
        target_type="user",
        target_id=user_id,
        details={
            "user_email": user.email,
            "tier": {"from": old_tier, "to": subscription.tier.value},
            "status": {"from": old_status, "to": subscription.status.value}
        },
        request=request
    )

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
    request: Request,
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

    log_audit(
        admin_email=current_user.email,
        action="password_reset",
        target_type="user",
        target_id=user_id,
        details={"user_email": user.email},
        request=request
    )

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
    days: int = 30,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get analytics data for charts

    Args:
        days: Number of days to look back (default 30, ignored if start_date/end_date provided)
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    """
    check_admin(current_user)

    # Parse dates or use default
    if start_date and end_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=days)

    cutoff = start_dt

    # User signups over time
    signups = db.execute(text("""
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= :start_dt AND created_at <= :end_dt
        GROUP BY DATE(created_at)
        ORDER BY date
    """), {"start_dt": start_dt, "end_dt": end_dt}).fetchall()

    # Room completions over time
    completions = db.execute(text("""
        SELECT DATE(resolved_at) as date, COUNT(*) as count
        FROM rooms
        WHERE resolved_at >= :start_dt AND resolved_at <= :end_dt AND phase = 'resolved'
        GROUP BY DATE(resolved_at)
        ORDER BY date
    """), {"start_dt": start_dt, "end_dt": end_dt}).fetchall()

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
        "date_range": {
            "start_date": start_dt.strftime("%Y-%m-%d"),
            "end_date": end_dt.strftime("%Y-%m-%d")
        }
    }


# ========================================
# AI COST TRACKING
# ========================================

@router.get("/ai-costs")
def get_ai_costs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get AI API cost analytics"""
    check_admin(current_user)

    cutoff = datetime.utcnow() - timedelta(days=days)

    # Total costs by service type
    costs_by_service = db.execute(text("""
        SELECT service_type,
               SUM(cost_usd) as total_cost,
               SUM(input_tokens) as total_input_tokens,
               SUM(output_tokens) as total_output_tokens,
               COUNT(*) as call_count
        FROM api_costs
        WHERE created_at >= :cutoff
        GROUP BY service_type
        ORDER BY total_cost DESC
    """), {"cutoff": cutoff}).fetchall()

    # Daily costs over time
    daily_costs = db.execute(text("""
        SELECT DATE(created_at) as date,
               service_type,
               SUM(cost_usd) as total_cost
        FROM api_costs
        WHERE created_at >= :cutoff
        GROUP BY DATE(created_at), service_type
        ORDER BY date
    """), {"cutoff": cutoff}).fetchall()

    # Top users by cost
    top_users = db.execute(text("""
        SELECT ac.user_id, u.email, u.name,
               SUM(ac.cost_usd) as total_cost,
               COUNT(*) as call_count
        FROM api_costs ac
        JOIN users u ON ac.user_id = u.id
        WHERE ac.created_at >= :cutoff
        GROUP BY ac.user_id, u.email, u.name
        ORDER BY total_cost DESC
        LIMIT 10
    """), {"cutoff": cutoff}).fetchall()

    # Costs by model
    costs_by_model = db.execute(text("""
        SELECT model,
               SUM(cost_usd) as total_cost,
               COUNT(*) as call_count
        FROM api_costs
        WHERE created_at >= :cutoff AND model IS NOT NULL
        GROUP BY model
        ORDER BY total_cost DESC
    """), {"cutoff": cutoff}).fetchall()

    # Total cost
    total_cost = db.execute(text("""
        SELECT SUM(cost_usd) as total
        FROM api_costs
        WHERE created_at >= :cutoff
    """), {"cutoff": cutoff}).scalar() or 0

    # Today's cost
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_cost = db.execute(text("""
        SELECT SUM(cost_usd) as total
        FROM api_costs
        WHERE created_at >= :today
    """), {"today": today_start}).scalar() or 0

    # This month's cost
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_cost = db.execute(text("""
        SELECT SUM(cost_usd) as total
        FROM api_costs
        WHERE created_at >= :month_start
    """), {"month_start": month_start}).scalar() or 0

    # Format daily costs for charts
    daily_costs_formatted = {}
    for row in daily_costs:
        date_str = str(row[0])
        if date_str not in daily_costs_formatted:
            daily_costs_formatted[date_str] = {}
        daily_costs_formatted[date_str][row[1]] = float(row[2])

    return {
        "total_cost": round(float(total_cost), 4),
        "today_cost": round(float(today_cost), 4),
        "month_cost": round(float(month_cost), 4),
        "costs_by_service": [
            {
                "service": row[0],
                "cost": round(float(row[1]), 4),
                "input_tokens": int(row[2] or 0),
                "output_tokens": int(row[3] or 0),
                "calls": int(row[4])
            }
            for row in costs_by_service
        ],
        "daily_costs": [
            {"date": date, "costs": costs}
            for date, costs in sorted(daily_costs_formatted.items())
        ],
        "top_users": [
            {
                "user_id": row[0],
                "email": row[1],
                "name": row[2],
                "cost": round(float(row[3]), 4),
                "calls": int(row[4])
            }
            for row in top_users
        ],
        "costs_by_model": [
            {
                "model": row[0],
                "cost": round(float(row[1]), 4),
                "calls": int(row[2])
            }
            for row in costs_by_model
        ]
    }


@router.get("/ai-costs/details")
def get_ai_cost_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    service_type: Optional[str] = None,
    user_id: Optional[int] = None
):
    """Get detailed AI cost records"""
    check_admin(current_user)

    query = db.query(ApiCost)

    if service_type:
        query = query.filter(ApiCost.service_type == service_type)
    if user_id:
        query = query.filter(ApiCost.user_id == user_id)

    total = query.count()
    costs = query.order_by(ApiCost.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for cost in costs:
        user = db.query(User).filter(User.id == cost.user_id).first()
        result.append({
            "id": cost.id,
            "user_id": cost.user_id,
            "user_email": user.email if user else "Unknown",
            "room_id": cost.room_id,
            "service_type": cost.service_type,
            "model": cost.model,
            "input_tokens": cost.input_tokens,
            "output_tokens": cost.output_tokens,
            "audio_seconds": float(cost.audio_seconds) if cost.audio_seconds else 0,
            "cost_usd": round(float(cost.cost_usd), 6),
            "created_at": str(cost.created_at) if cost.created_at else None,
        })

    return {"costs": result, "total": total, "skip": skip, "limit": limit}


@router.get("/ai-costs/export")
def export_ai_costs_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Export AI costs to CSV"""
    check_admin(current_user)

    cutoff = datetime.utcnow() - timedelta(days=days)
    costs = db.query(ApiCost).filter(ApiCost.created_at >= cutoff).order_by(ApiCost.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "ID", "User ID", "User Email", "Room ID", "Service Type", "Model",
        "Input Tokens", "Output Tokens", "Audio Seconds", "Cost USD", "Created At"
    ])

    for cost in costs:
        user = db.query(User).filter(User.id == cost.user_id).first()
        writer.writerow([
            cost.id,
            cost.user_id,
            user.email if user else "",
            cost.room_id or "",
            cost.service_type,
            cost.model or "",
            cost.input_tokens,
            cost.output_tokens,
            float(cost.audio_seconds) if cost.audio_seconds else 0,
            round(float(cost.cost_usd), 6),
            str(cost.created_at) if cost.created_at else "",
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ai_costs_export_{days}d.csv"}
    )


# ========================================
# BULK ACTIONS
# ========================================

@router.post("/users/bulk/subscription")
def bulk_update_subscriptions(
    user_ids: List[int],
    tier: str,
    status: str,
    request: Request,
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

    log_audit(
        admin_email=current_user.email,
        action="bulk_subscription_change",
        target_type="users",
        target_id=None,
        details={"user_ids": user_ids, "tier": tier, "status": status, "updated_count": updated},
        request=request
    )

    return {"status": "success", "updated_count": updated}


@router.post("/users/bulk/delete")
def bulk_delete_users(
    user_ids: List[int],
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete multiple users at once"""
    check_admin(current_user)

    # Don't allow deleting yourself
    if current_user.id in user_ids:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    deleted = 0
    deleted_emails = []
    for user_id in user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            deleted_emails.append(user.email)
            db.execute(text(f"DELETE FROM turns WHERE user_id = {user_id}"))
            db.execute(text(f"DELETE FROM room_participants WHERE user_id = {user_id}"))
            db.execute(text(f"DELETE FROM subscriptions WHERE user_id = {user_id}"))
            db.delete(user)
            deleted += 1

    db.commit()

    log_audit(
        admin_email=current_user.email,
        action="bulk_delete",
        target_type="users",
        target_id=None,
        details={"user_ids": user_ids, "deleted_emails": deleted_emails, "deleted_count": deleted},
        request=request
    )

    return {"status": "success", "deleted_count": deleted}


# ========================================
# ACTIVITY LOGS (derived from turns)
# ========================================

@router.get("/activity-logs")
def get_activity_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100
):
    """Get recent user activity from turns"""
    check_admin(current_user)

    # Get recent turns as activity proxy
    turns = db.query(Turn).order_by(Turn.created_at.desc()).limit(limit).all()

    result = []
    for turn in turns:
        user = db.query(User).filter(User.id == turn.user_id).first()
        result.append({
            "id": turn.id,
            "user_id": turn.user_id,
            "user_email": user.email if user else "Unknown",
            "action": turn.kind,
            "context": turn.context,
            "room_id": turn.room_id,
            "created_at": str(turn.created_at) if turn.created_at else None,
        })

    return {"logs": result}


# ========================================
# REVENUE REPORTING (Stripe)
# ========================================

@router.get("/revenue")
def get_revenue_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get revenue statistics from Stripe"""
    check_admin(current_user)

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        # Get recent charges
        charges = stripe.Charge.list(limit=100)
        total_revenue = sum(c.amount for c in charges.data if c.paid) / 100

        # Get active subscriptions
        subscriptions = stripe.Subscription.list(status="active", limit=100)
        mrr = sum(
            sub.items.data[0].price.unit_amount * sub.items.data[0].quantity
            for sub in subscriptions.data
            if sub.items.data
        ) / 100

        # Recent payments
        recent_payments = []
        for charge in charges.data[:20]:
            recent_payments.append({
                "id": charge.id,
                "amount": charge.amount / 100,
                "currency": charge.currency.upper(),
                "status": charge.status,
                "customer_email": charge.billing_details.email if charge.billing_details else None,
                "created_at": datetime.fromtimestamp(charge.created).isoformat(),
            })

        return {
            "total_revenue": round(total_revenue, 2),
            "mrr": round(mrr, 2),
            "active_subscriptions": len(subscriptions.data),
            "recent_payments": recent_payments,
        }
    except Exception as e:
        return {
            "total_revenue": 0,
            "mrr": 0,
            "active_subscriptions": 0,
            "recent_payments": [],
            "error": str(e)
        }


# ========================================
# ENVIRONMENT VARIABLES MANAGEMENT
# ========================================

class EnvVarUpdateIn(BaseModel):
    key: str
    value: str
    platform: str  # "vercel" or "railway"

@router.get("/env-vars")
async def get_env_vars(
    current_user: User = Depends(get_current_user)
):
    """Get environment variables from Vercel and Railway"""
    check_admin(current_user)

    result = {
        "vercel": {
            "configured": bool(settings.VERCEL_TOKEN and settings.VERCEL_PROJECT_ID),
            "variables": [],
            "error": None
        },
        "railway": {
            "configured": bool(settings.RAILWAY_TOKEN and settings.RAILWAY_PROJECT_ID),
            "variables": [],
            "error": None
        }
    }

    # Fetch Vercel env vars
    if settings.VERCEL_TOKEN and settings.VERCEL_PROJECT_ID:
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {settings.VERCEL_TOKEN}"}
                url = f"https://api.vercel.com/v9/projects/{settings.VERCEL_PROJECT_ID}/env"
                if settings.VERCEL_TEAM_ID:
                    url += f"?teamId={settings.VERCEL_TEAM_ID}"

                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    # Mask sensitive values
                    for env in data.get("envs", []):
                        result["vercel"]["variables"].append({
                            "id": env.get("id"),
                            "key": env.get("key"),
                            "value": mask_value(env.get("value", "")),
                            "target": env.get("target", []),
                            "type": env.get("type")
                        })
                else:
                    result["vercel"]["error"] = f"API error: {response.status_code}"
        except Exception as e:
            result["vercel"]["error"] = str(e)

    # Fetch Railway env vars
    if settings.RAILWAY_TOKEN and settings.RAILWAY_PROJECT_ID:
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {settings.RAILWAY_TOKEN}",
                    "Content-Type": "application/json"
                }

                query = """
                query($projectId: String!, $environmentId: String!, $serviceId: String!) {
                    variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
                }
                """

                response = await client.post(
                    "https://backboard.railway.app/graphql/v2",
                    headers=headers,
                    json={
                        "query": query,
                        "variables": {
                            "projectId": settings.RAILWAY_PROJECT_ID,
                            "environmentId": settings.RAILWAY_ENVIRONMENT_ID,
                            "serviceId": settings.RAILWAY_SERVICE_ID
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and data["data"].get("variables"):
                        # Railway returns variables as a dict {key: value}
                        for key, value in data["data"]["variables"].items():
                            result["railway"]["variables"].append({
                                "key": key,
                                "value": mask_value(value or ""),
                                "id": key  # Railway uses key as ID
                            })
                    elif "errors" in data:
                        result["railway"]["error"] = data["errors"][0].get("message", "Unknown error")
                else:
                    result["railway"]["error"] = f"API error: {response.status_code}"
        except Exception as e:
            result["railway"]["error"] = str(e)

    return result


def mask_value(value: str) -> str:
    """Mask sensitive values, showing only first/last chars"""
    if not value or len(value) < 8:
        return "••••••••"
    return value[:4] + "••••" + value[-4:]


@router.put("/env-vars")
async def update_env_var(
    payload: EnvVarUpdateIn,
    current_user: User = Depends(get_current_user)
):
    """Update an environment variable on Vercel or Railway"""
    check_admin(current_user)

    if payload.platform == "vercel":
        if not settings.VERCEL_TOKEN or not settings.VERCEL_PROJECT_ID:
            raise HTTPException(status_code=400, detail="Vercel not configured")

        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {settings.VERCEL_TOKEN}",
                    "Content-Type": "application/json"
                }

                # First, check if variable exists
                url = f"https://api.vercel.com/v9/projects/{settings.VERCEL_PROJECT_ID}/env"
                if settings.VERCEL_TEAM_ID:
                    url += f"?teamId={settings.VERCEL_TEAM_ID}"

                response = await client.get(url, headers=headers)
                existing = None
                if response.status_code == 200:
                    for env in response.json().get("envs", []):
                        if env.get("key") == payload.key:
                            existing = env
                            break

                if existing:
                    # Update existing variable
                    update_url = f"https://api.vercel.com/v9/projects/{settings.VERCEL_PROJECT_ID}/env/{existing['id']}"
                    if settings.VERCEL_TEAM_ID:
                        update_url += f"?teamId={settings.VERCEL_TEAM_ID}"

                    response = await client.patch(
                        update_url,
                        headers=headers,
                        json={"value": payload.value}
                    )
                else:
                    # Create new variable
                    create_url = f"https://api.vercel.com/v10/projects/{settings.VERCEL_PROJECT_ID}/env"
                    if settings.VERCEL_TEAM_ID:
                        create_url += f"?teamId={settings.VERCEL_TEAM_ID}"

                    response = await client.post(
                        create_url,
                        headers=headers,
                        json={
                            "key": payload.key,
                            "value": payload.value,
                            "type": "encrypted",
                            "target": ["production", "preview", "development"]
                        }
                    )

                if response.status_code in [200, 201]:
                    return {"status": "success", "message": f"Updated {payload.key} on Vercel"}
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Vercel API error: {response.text}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    elif payload.platform == "railway":
        if not settings.RAILWAY_TOKEN or not settings.RAILWAY_PROJECT_ID:
            raise HTTPException(status_code=400, detail="Railway not configured")

        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {settings.RAILWAY_TOKEN}",
                    "Content-Type": "application/json"
                }

                mutation = """
                mutation($projectId: String!, $environmentId: String!, $serviceId: String!, $name: String!, $value: String!) {
                    variableUpsert(input: {
                        projectId: $projectId,
                        environmentId: $environmentId,
                        serviceId: $serviceId,
                        name: $name,
                        value: $value
                    })
                }
                """

                response = await client.post(
                    "https://backboard.railway.app/graphql/v2",
                    headers=headers,
                    json={
                        "query": mutation,
                        "variables": {
                            "projectId": settings.RAILWAY_PROJECT_ID,
                            "environmentId": settings.RAILWAY_ENVIRONMENT_ID,
                            "serviceId": settings.RAILWAY_SERVICE_ID,
                            "name": payload.key,
                            "value": payload.value
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    if "errors" in data:
                        raise HTTPException(
                            status_code=400,
                            detail=data["errors"][0].get("message", "Unknown error")
                        )
                    return {"status": "success", "message": f"Updated {payload.key} on Railway"}
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Railway API error: {response.text}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    else:
        raise HTTPException(status_code=400, detail="Invalid platform")


@router.delete("/env-vars/{platform}/{key}")
async def delete_env_var(
    platform: str,
    key: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an environment variable from Vercel or Railway"""
    check_admin(current_user)

    if platform == "vercel":
        if not settings.VERCEL_TOKEN or not settings.VERCEL_PROJECT_ID:
            raise HTTPException(status_code=400, detail="Vercel not configured")

        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {settings.VERCEL_TOKEN}"}

                # Find the variable ID
                url = f"https://api.vercel.com/v9/projects/{settings.VERCEL_PROJECT_ID}/env"
                if settings.VERCEL_TEAM_ID:
                    url += f"?teamId={settings.VERCEL_TEAM_ID}"

                response = await client.get(url, headers=headers)
                env_id = None
                if response.status_code == 200:
                    for env in response.json().get("envs", []):
                        if env.get("key") == key:
                            env_id = env.get("id")
                            break

                if not env_id:
                    raise HTTPException(status_code=404, detail="Variable not found")

                # Delete the variable
                delete_url = f"https://api.vercel.com/v9/projects/{settings.VERCEL_PROJECT_ID}/env/{env_id}"
                if settings.VERCEL_TEAM_ID:
                    delete_url += f"?teamId={settings.VERCEL_TEAM_ID}"

                response = await client.delete(delete_url, headers=headers)

                if response.status_code in [200, 204]:
                    return {"status": "success", "message": f"Deleted {key} from Vercel"}
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Vercel API error: {response.text}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    elif platform == "railway":
        if not settings.RAILWAY_TOKEN or not settings.RAILWAY_PROJECT_ID:
            raise HTTPException(status_code=400, detail="Railway not configured")

        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {settings.RAILWAY_TOKEN}",
                    "Content-Type": "application/json"
                }

                mutation = """
                mutation($projectId: String!, $environmentId: String!, $serviceId: String!, $name: String!) {
                    variableDelete(input: {
                        projectId: $projectId,
                        environmentId: $environmentId,
                        serviceId: $serviceId,
                        name: $name
                    })
                }
                """

                response = await client.post(
                    "https://backboard.railway.app/graphql/v2",
                    headers=headers,
                    json={
                        "query": mutation,
                        "variables": {
                            "projectId": settings.RAILWAY_PROJECT_ID,
                            "environmentId": settings.RAILWAY_ENVIRONMENT_ID,
                            "serviceId": settings.RAILWAY_SERVICE_ID,
                            "name": key
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    if "errors" in data:
                        raise HTTPException(
                            status_code=400,
                            detail=data["errors"][0].get("message", "Unknown error")
                        )
                    return {"status": "success", "message": f"Deleted {key} from Railway"}
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Railway API error: {response.text}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    else:
        raise HTTPException(status_code=400, detail="Invalid platform")


@router.post("/env-vars/redeploy/{platform}")
async def trigger_redeploy(
    platform: str,
    current_user: User = Depends(get_current_user)
):
    """Trigger a redeployment on Vercel or Railway"""
    check_admin(current_user)

    if platform == "vercel":
        if not settings.VERCEL_TOKEN or not settings.VERCEL_PROJECT_ID:
            raise HTTPException(status_code=400, detail="Vercel not configured")

        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {settings.VERCEL_TOKEN}",
                    "Content-Type": "application/json"
                }

                # Get the latest deployment to redeploy
                url = f"https://api.vercel.com/v6/deployments?projectId={settings.VERCEL_PROJECT_ID}&limit=1"
                if settings.VERCEL_TEAM_ID:
                    url += f"&teamId={settings.VERCEL_TEAM_ID}"

                response = await client.get(url, headers=headers)

                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="Failed to get deployments")

                deployments = response.json().get("deployments", [])
                if not deployments:
                    raise HTTPException(status_code=404, detail="No deployments found")

                # Redeploy the latest
                redeploy_url = "https://api.vercel.com/v13/deployments"
                if settings.VERCEL_TEAM_ID:
                    redeploy_url += f"?teamId={settings.VERCEL_TEAM_ID}"

                response = await client.post(
                    redeploy_url,
                    headers=headers,
                    json={
                        "name": deployments[0].get("name"),
                        "deploymentId": deployments[0].get("uid"),
                        "target": "production"
                    }
                )

                if response.status_code in [200, 201]:
                    return {"status": "success", "message": "Vercel redeployment triggered"}
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Vercel API error: {response.text}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    elif platform == "railway":
        if not settings.RAILWAY_TOKEN or not settings.RAILWAY_SERVICE_ID:
            raise HTTPException(status_code=400, detail="Railway not configured")

        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {settings.RAILWAY_TOKEN}",
                    "Content-Type": "application/json"
                }

                mutation = """
                mutation($serviceId: String!) {
                    serviceInstanceRedeploy(serviceId: $serviceId)
                }
                """

                response = await client.post(
                    "https://backboard.railway.app/graphql/v2",
                    headers=headers,
                    json={
                        "query": mutation,
                        "variables": {
                            "serviceId": settings.RAILWAY_SERVICE_ID
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    if "errors" in data:
                        raise HTTPException(
                            status_code=400,
                            detail=data["errors"][0].get("message", "Unknown error")
                        )
                    return {"status": "success", "message": "Railway redeployment triggered"}
                else:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Railway API error: {response.text}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    else:
        raise HTTPException(status_code=400, detail="Invalid platform")


# ========================================
# FEATURE FLAGS
# ========================================

# Simple in-memory feature flags (could be moved to DB)
FEATURE_FLAGS = {
    "telegram_import": True,
    "voice_messages": True,
    "file_attachments": True,
    "solo_mode": True,
    "professional_reports": True,
}

@router.get("/feature-flags")
def get_feature_flags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current feature flags"""
    check_admin(current_user)
    return {"flags": FEATURE_FLAGS}


@router.put("/feature-flags/{flag_name}")
def update_feature_flag(
    flag_name: str,
    enabled: bool,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle a feature flag"""
    check_admin(current_user)

    if flag_name not in FEATURE_FLAGS:
        raise HTTPException(status_code=404, detail="Feature flag not found")

    old_value = FEATURE_FLAGS[flag_name]
    FEATURE_FLAGS[flag_name] = enabled

    log_audit(
        admin_email=current_user.email,
        action="feature_flag_toggled",
        target_type="feature_flag",
        target_id=flag_name,
        details={"from": old_value, "to": enabled},
        request=request
    )

    return {"status": "success", "flag": flag_name, "enabled": enabled}


# ========================================
# WEBHOOK LOGS (from Stripe)
# ========================================

@router.get("/webhook-logs")
def get_webhook_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent webhook events from Stripe"""
    check_admin(current_user)

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        events = stripe.Event.list(limit=50)

        result = []
        for event in events.data:
            result.append({
                "id": event.id,
                "type": event.type,
                "created_at": datetime.fromtimestamp(event.created).isoformat(),
                "livemode": event.livemode,
            })

        return {"events": result}
    except Exception as e:
        return {"events": [], "error": str(e)}


# ========================================
# USER IMPERSONATION
# ========================================

@router.post("/impersonate/{user_id}")
def impersonate_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a token to impersonate a user"""
    check_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate token for the target user
    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    log_audit(
        admin_email=current_user.email,
        action="user_impersonated",
        target_type="user",
        target_id=user_id,
        details={"user_email": user.email},
        request=request
    )

    return {
        "status": "success",
        "user_id": user_id,
        "user_email": user.email,
        "token": token,
        "warning": "This token allows full access as this user. Use carefully."
    }


# ========================================
# EMAIL TEMPLATES
# ========================================

# In-memory email templates (could be moved to DB)
EMAIL_TEMPLATES = {
    "turn_notification": {
        "name": "Turn Notification",
        "subject": "{other_person_name} has responded - Your turn in Meedi8",
        "description": "Sent when it's a user's turn to respond in mediation",
        "variables": ["to_name", "other_person_name", "room_url", "frontend_url"],
    },
    "break_notification": {
        "name": "Break Requested",
        "subject": "{requester_name} requested a break - Meedi8",
        "description": "Sent when someone requests a breathing break",
        "variables": ["to_name", "requester_name", "room_url"],
    },
    "welcome": {
        "name": "Welcome Email",
        "subject": "Welcome to Meedi8!",
        "description": "Sent when a new user signs up",
        "variables": ["to_name", "frontend_url"],
    },
    "resolution_complete": {
        "name": "Resolution Complete",
        "subject": "Your mediation session is complete - Meedi8",
        "description": "Sent when a mediation reaches resolution",
        "variables": ["to_name", "room_url", "resolution_summary"],
    },
}

@router.get("/email-templates")
def get_email_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all email templates"""
    check_admin(current_user)
    return {"templates": EMAIL_TEMPLATES}


@router.put("/email-templates/{template_id}")
def update_email_template(
    template_id: str,
    subject: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update email template subject"""
    check_admin(current_user)

    if template_id not in EMAIL_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")

    EMAIL_TEMPLATES[template_id]["subject"] = subject
    return {"status": "success", "template_id": template_id, "subject": subject}


@router.post("/email-templates/{template_id}/test")
def test_email_template(
    template_id: str,
    to_email: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send test email using template"""
    check_admin(current_user)

    if template_id not in EMAIL_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")

    # Import email service
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To, Content

    if not settings.SENDGRID_API_KEY:
        return {"status": "error", "message": "SendGrid API key not configured"}

    try:
        template = EMAIL_TEMPLATES[template_id]
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://meedi8.com')

        # Generate test content
        subject = template["subject"].format(
            other_person_name="Test User",
            requester_name="Test User",
            to_name=current_user.name or "Admin"
        )

        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Test Email: {template['name']}</h2>
            <p><strong>Template ID:</strong> {template_id}</p>
            <p><strong>Subject:</strong> {subject}</p>
            <p><strong>Description:</strong> {template['description']}</p>
            <p><strong>Variables:</strong> {', '.join(template['variables'])}</p>
            <hr>
            <p style="color: #666;">This is a test email sent from the Meedi8 admin dashboard.</p>
        </div>
        """

        message = Mail(
            from_email=Email(getattr(settings, 'FROM_EMAIL', 'notifications@meedi8.com'), "Meedi8"),
            to_emails=To(to_email),
            subject=f"[TEST] {subject}",
            html_content=Content("text/html", html_content)
        )

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)

        return {
            "status": "success",
            "message": f"Test email sent to {to_email}",
            "status_code": response.status_code
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ========================================
# SYSTEM HEALTH
# ========================================

@router.get("/system-health")
def get_system_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system health metrics"""
    check_admin(current_user)

    # Import error log store for unresolved count in system health
    from ..main import error_log_store
    unresolved_errors = error_log_store.get_unresolved_count()

    import sys

    # Try to import psutil, but gracefully handle if not available
    try:
        import psutil
        psutil_available = True
    except ImportError:
        psutil_available = False

    health = {
        "status": "healthy",
        "checks": {}
    }

    # Database check
    try:
        db.execute(text("SELECT 1"))
        health["checks"]["database"] = {"status": "ok", "message": "Connected"}
    except Exception as e:
        health["checks"]["database"] = {"status": "error", "message": str(e)}
        health["status"] = "degraded"

    # Memory usage
    if psutil_available:
        try:
            memory = psutil.virtual_memory()
            health["checks"]["memory"] = {
                "status": "ok" if memory.percent < 90 else "warning",
                "used_percent": round(memory.percent, 1),
                "used_gb": round(memory.used / (1024**3), 2),
                "total_gb": round(memory.total / (1024**3), 2)
            }
        except:
            health["checks"]["memory"] = {"status": "unknown"}

        # CPU usage
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            health["checks"]["cpu"] = {
                "status": "ok" if cpu_percent < 90 else "warning",
                "used_percent": round(cpu_percent, 1)
            }
        except:
            health["checks"]["cpu"] = {"status": "unknown"}
    else:
        health["checks"]["memory"] = {"status": "unavailable", "message": "psutil not installed"}
        health["checks"]["cpu"] = {"status": "unavailable", "message": "psutil not installed"}

    # Python version
    health["checks"]["python"] = {
        "status": "ok",
        "version": sys.version.split()[0]
    }

    # External services
    health["checks"]["stripe"] = {
        "status": "ok" if settings.STRIPE_SECRET_KEY else "not_configured"
    }
    health["checks"]["sendgrid"] = {
        "status": "ok" if settings.SENDGRID_API_KEY else "not_configured"
    }
    health["checks"]["anthropic"] = {
        "status": "ok" if settings.ANTHROPIC_API_KEY else "not_configured"
    }

    # Add unresolved errors count
    health["unresolved_errors"] = unresolved_errors

    return health


# ========================================
# ERROR LOGS
# ========================================

@router.get("/error-logs")
def get_error_logs(
    current_user: User = Depends(get_current_user),
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get error logs with optional filtering"""
    check_admin(current_user)

    from ..main import error_log_store

    logs = error_log_store.get_logs(
        severity=severity,
        resolved=resolved,
        start_date=start_date,
        end_date=end_date
    )

    return {
        "logs": logs,
        "total": len(logs),
        "unresolved_count": error_log_store.get_unresolved_count()
    }


@router.post("/error-logs/{error_id}/resolve")
def resolve_error_log(
    error_id: int,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Mark an error as resolved"""
    check_admin(current_user)

    from ..main import error_log_store

    if error_log_store.resolve_error(error_id):
        log_audit(
            admin_email=current_user.email,
            action="error_resolved",
            target_type="error_log",
            target_id=error_id,
            details={},
            request=request
        )

        return {
            "status": "success",
            "error_id": error_id,
            "unresolved_count": error_log_store.get_unresolved_count()
        }
    else:
        raise HTTPException(status_code=404, detail="Error log not found")


@router.get("/error-logs/count")
def get_error_logs_count(
    current_user: User = Depends(get_current_user)
):
    """Get count of unresolved errors (for badge display)"""
    check_admin(current_user)

    from ..main import error_log_store

    return {
        "unresolved_count": error_log_store.get_unresolved_count()
    }


# ========================================
# AUDIT LOGS
# ========================================

@router.get("/audit-logs")
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    action: Optional[str] = None,
    admin_email: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get audit logs with optional filtering"""
    check_admin(current_user)

    from ..main import audit_log_store

    logs = audit_log_store.get_logs(
        action=action,
        admin_email=admin_email,
        start_date=start_date,
        end_date=end_date
    )

    action_types = audit_log_store.get_action_types()

    return {
        "logs": logs,
        "total": len(logs),
        "action_types": action_types
    }


# ========================================
# ANNOUNCEMENTS
# ========================================

class AnnouncementIn(BaseModel):
    title: str
    message: str
    type: str = "info"  # info, warning, success, error
    is_active: bool = True
    is_dismissible: bool = True
    target_audience: str = "all"  # all, free, plus, pro
    show_on_pages: str = "all"  # all, home, dashboard, coaching, etc.
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None
    is_dismissible: Optional[bool] = None
    target_audience: Optional[str] = None
    show_on_pages: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/announcements")
def get_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active_only: bool = False
):
    """Get all announcements"""
    check_admin(current_user)

    from ..models import Announcement

    query = db.query(Announcement).order_by(Announcement.created_at.desc())

    if active_only:
        query = query.filter(Announcement.is_active == True)

    announcements = query.all()

    return {
        "announcements": [
            {
                "id": a.id,
                "title": a.title,
                "message": a.message,
                "type": a.type,
                "is_active": a.is_active,
                "is_dismissible": a.is_dismissible,
                "target_audience": a.target_audience,
                "show_on_pages": a.show_on_pages,
                "start_date": a.start_date.isoformat() if a.start_date else None,
                "end_date": a.end_date.isoformat() if a.end_date else None,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "updated_at": a.updated_at.isoformat() if a.updated_at else None,
                "created_by": a.created_by,
                "view_count": a.view_count,
                "dismiss_count": a.dismiss_count,
            }
            for a in announcements
        ],
        "total": len(announcements)
    }


@router.post("/announcements")
def create_announcement(
    payload: AnnouncementIn,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new announcement"""
    check_admin(current_user)

    from ..models import Announcement

    announcement = Announcement(
        title=payload.title,
        message=payload.message,
        type=payload.type,
        is_active=payload.is_active,
        is_dismissible=payload.is_dismissible,
        target_audience=payload.target_audience,
        show_on_pages=payload.show_on_pages,
        start_date=datetime.fromisoformat(payload.start_date) if payload.start_date else None,
        end_date=datetime.fromisoformat(payload.end_date) if payload.end_date else None,
        created_by=current_user.id
    )

    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    log_audit(
        admin_email=current_user.email,
        action="announcement_created",
        target_type="announcement",
        target_id=announcement.id,
        details={"title": payload.title, "type": payload.type},
        request=request
    )

    return {
        "status": "success",
        "announcement": {
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "type": announcement.type,
            "is_active": announcement.is_active,
            "created_at": announcement.created_at.isoformat() if announcement.created_at else None,
        }
    }


@router.put("/announcements/{announcement_id}")
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an announcement"""
    check_admin(current_user)

    from ..models import Announcement

    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    changes = {}
    if payload.title is not None:
        changes["title"] = {"from": announcement.title, "to": payload.title}
        announcement.title = payload.title
    if payload.message is not None:
        changes["message"] = {"from": announcement.message[:50] + "...", "to": payload.message[:50] + "..."}
        announcement.message = payload.message
    if payload.type is not None:
        changes["type"] = {"from": announcement.type, "to": payload.type}
        announcement.type = payload.type
    if payload.is_active is not None:
        changes["is_active"] = {"from": announcement.is_active, "to": payload.is_active}
        announcement.is_active = payload.is_active
    if payload.is_dismissible is not None:
        announcement.is_dismissible = payload.is_dismissible
    if payload.target_audience is not None:
        announcement.target_audience = payload.target_audience
    if payload.show_on_pages is not None:
        announcement.show_on_pages = payload.show_on_pages
    if payload.start_date is not None:
        announcement.start_date = datetime.fromisoformat(payload.start_date) if payload.start_date else None
    if payload.end_date is not None:
        announcement.end_date = datetime.fromisoformat(payload.end_date) if payload.end_date else None

    announcement.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        admin_email=current_user.email,
        action="announcement_updated",
        target_type="announcement",
        target_id=announcement_id,
        details=changes,
        request=request
    )

    return {
        "status": "success",
        "announcement": {
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "type": announcement.type,
            "is_active": announcement.is_active,
            "updated_at": announcement.updated_at.isoformat() if announcement.updated_at else None,
        }
    }


@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an announcement"""
    check_admin(current_user)

    from ..models import Announcement

    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    title = announcement.title
    db.delete(announcement)
    db.commit()

    log_audit(
        admin_email=current_user.email,
        action="announcement_deleted",
        target_type="announcement",
        target_id=announcement_id,
        details={"title": title},
        request=request
    )

    return {"status": "success", "message": f"Announcement '{title}' deleted"}


@router.post("/announcements/{announcement_id}/toggle")
def toggle_announcement(
    announcement_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle an announcement's active status"""
    check_admin(current_user)

    from ..models import Announcement

    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    old_status = announcement.is_active
    announcement.is_active = not announcement.is_active
    announcement.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        admin_email=current_user.email,
        action="announcement_toggled",
        target_type="announcement",
        target_id=announcement_id,
        details={"from": old_status, "to": announcement.is_active},
        request=request
    )

    return {
        "status": "success",
        "announcement_id": announcement_id,
        "is_active": announcement.is_active
    }


# ========================================
# ACHIEVEMENTS
# ========================================

@router.get("/achievements/recent")
def get_recent_achievements(
    request: Request,
    days: int = 7,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recently earned achievements across all users"""
    check_admin(current_user)

    from ..models.gamification import UserAchievement, Achievement

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    recent = db.query(
        UserAchievement,
        Achievement,
        User
    ).join(
        Achievement, UserAchievement.achievement_id == Achievement.id
    ).join(
        User, UserAchievement.user_id == User.id
    ).filter(
        UserAchievement.unlocked_at >= cutoff_date
    ).order_by(
        UserAchievement.unlocked_at.desc()
    ).limit(limit).all()

    results = []
    for ua, achievement, user in recent:
        results.append({
            "id": ua.id,
            "user_id": user.id,
            "user_email": user.email,
            "user_name": user.name,
            "achievement_code": achievement.code,
            "achievement_name": achievement.name,
            "achievement_icon": achievement.icon,
            "xp_reward": achievement.xp_reward,
            "rarity": achievement.rarity,
            "unlocked_at": ua.unlocked_at.isoformat() if ua.unlocked_at else None
        })

    return {
        "achievements": results,
        "total": len(results),
        "days": days
    }


@router.get("/achievements/stats")
def get_achievement_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get achievement statistics"""
    check_admin(current_user)

    from ..models.gamification import UserAchievement, Achievement

    # Total achievements (all defined achievements)
    total_achievements = db.query(func.count(Achievement.id)).scalar() or 0

    # Total earned (all time)
    total_earned = db.query(func.count(UserAchievement.id)).scalar() or 0

    # Earned today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    earned_today = db.query(func.count(UserAchievement.id)).filter(
        UserAchievement.unlocked_at >= today_start
    ).scalar() or 0

    # Earned this week
    week_start = datetime.utcnow() - timedelta(days=7)
    earned_week = db.query(func.count(UserAchievement.id)).filter(
        UserAchievement.unlocked_at >= week_start
    ).scalar() or 0

    # Most earned achievements
    most_earned = db.query(
        Achievement.code,
        Achievement.name,
        Achievement.icon,
        func.count(UserAchievement.id).label('count')
    ).join(
        UserAchievement, Achievement.id == UserAchievement.achievement_id
    ).group_by(
        Achievement.id
    ).order_by(
        func.count(UserAchievement.id).desc()
    ).limit(5).all()

    # Users with most achievements
    top_users = db.query(
        User.id,
        User.email,
        User.name,
        func.count(UserAchievement.id).label('count')
    ).join(
        UserAchievement, User.id == UserAchievement.user_id
    ).group_by(
        User.id
    ).order_by(
        func.count(UserAchievement.id).desc()
    ).limit(5).all()

    return {
        "total_achievements": total_achievements,
        "total_earned": total_earned,
        "earned_today": earned_today,
        "earned_week": earned_week,
        "most_earned": [
            {"code": a.code, "name": a.name, "icon": a.icon, "count": a.count}
            for a in most_earned
        ],
        "top_users": [
            {"id": u.id, "email": u.email, "name": u.name, "count": u.count}
            for u in top_users
        ]
    }
