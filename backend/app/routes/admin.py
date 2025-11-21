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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle a feature flag"""
    check_admin(current_user)

    if flag_name not in FEATURE_FLAGS:
        raise HTTPException(status_code=404, detail="Feature flag not found")

    FEATURE_FLAGS[flag_name] = enabled
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

    return health
