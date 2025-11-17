"""
Subscription Service - Manages user subscriptions and feature access

Handles subscription limits and paywall enforcement for:
- Room creation (FREE: 1/month, PLUS/PRO: unlimited)
- File uploads (FREE: disabled, PLUS: 10MB, PRO: 50MB)
- Professional reports (PRO only: 3/month)
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from app.models.user import User
from app.models.room import Room


def get_or_create_subscription(db: Session, user_id: int) -> Subscription:
    """Get existing subscription or create a free trial subscription for the user"""
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()

    if not subscription:
        # Create free trial subscription for new users
        subscription = Subscription(
            user_id=user_id,
            tier=SubscriptionTier.FREE,
            status=SubscriptionStatus.TRIAL,
            voice_conversations_used=0,
            voice_conversations_limit=10  # 10 free voice recordings
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
    else:
        # Update existing free tier users to have 10 voice recordings
        if subscription.tier == SubscriptionTier.FREE and subscription.voice_conversations_limit < 10:
            subscription.voice_conversations_limit = 10
            subscription.voice_conversations_used = 0  # Reset usage count for existing users
            db.commit()
            db.refresh(subscription)

    return subscription


def check_feature_access(subscription: Subscription, feature: str) -> dict:
    """
    Check if user has access to a specific feature based on their subscription.

    Returns:
        dict with 'has_access' (bool) and 'reason' (str) if denied
    """
    tier = subscription.tier
    status = subscription.status

    # Check if subscription is active
    if status in [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED]:
        return {
            "has_access": False,
            "reason": "Your subscription has expired. Please upgrade to continue using this feature.",
            "upgrade_required": True
        }

    # Feature access by tier
    if feature == "text_mediation":
        # All tiers have access to text mediation
        return {"has_access": True}

    elif feature == "voice_recording":
        # Plus and Pro have unlimited voice recording
        if tier in [SubscriptionTier.PLUS, SubscriptionTier.PRO]:
            return {"has_access": True}

        # Free tier gets 10 voice recordings
        if tier == SubscriptionTier.FREE:
            if subscription.voice_conversations_used < subscription.voice_conversations_limit:
                return {
                    "has_access": True,
                    "is_trial": True,
                    "remaining": subscription.voice_conversations_limit - subscription.voice_conversations_used
                }
            else:
                return {
                    "has_access": False,
                    "reason": "You've used all 10 free voice recordings. Upgrade to Plus for unlimited voice recording.",
                    "upgrade_required": True,
                    "required_tier": "plus"
                }

    elif feature == "full_audio_mode":
        # Only Pro has access to full audio mode
        if tier == SubscriptionTier.PRO:
            return {"has_access": True}
        else:
            return {
                "has_access": False,
                "reason": "Full audio mode is only available with Pro subscription.",
                "upgrade_required": True,
                "required_tier": "pro"
            }

    # Unknown feature - deny by default
    return {
        "has_access": False,
        "reason": "Feature not available"
    }


def increment_voice_usage(db: Session, user_id: int):
    """Increment the voice conversation usage counter for free tier users"""
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if subscription and subscription.tier == SubscriptionTier.FREE:
        subscription.voice_conversations_used += 1
        subscription.updated_at = datetime.utcnow()
        db.commit()


def require_feature_access(subscription: Subscription, feature: str):
    """
    Raise HTTPException if user doesn't have access to feature.
    Use this as a dependency in route handlers.
    """
    access = check_feature_access(subscription, feature)

    if not access["has_access"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "Upgrade Required",
                "message": access.get("reason", "This feature requires a subscription upgrade."),
                "upgrade_required": access.get("upgrade_required", True),
                "required_tier": access.get("required_tier"),
                "current_tier": subscription.tier.value
            }
        )

    return access


def is_admin(db: Session, user_id: int) -> bool:
    """Check if user is an admin"""
    user = db.query(User).filter(User.id == user_id).first()
    return user and user.is_admin == 1


def upgrade_subscription(db: Session, user_id: int, new_tier: SubscriptionTier):
    """Upgrade a user's subscription tier"""
    subscription = get_or_create_subscription(db, user_id)

    subscription.tier = new_tier
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.updated_at = datetime.utcnow()

    # Update limits based on tier
    if new_tier == SubscriptionTier.PLUS or new_tier == SubscriptionTier.PRO:
        subscription.voice_conversations_limit = 999999  # Effectively unlimited

    db.commit()
    db.refresh(subscription)

    return subscription


# ==================== PAYWALL ENFORCEMENT FUNCTIONS ====================

# Tier limits configuration for paywall features
TIER_LIMITS = {
    SubscriptionTier.FREE: {
        "rooms_per_month": 1,
        "file_upload_enabled": False,
        "max_file_size_mb": 0,
        "reports_per_month": 0,
    },
    SubscriptionTier.PLUS: {
        "rooms_per_month": -1,  # -1 = unlimited
        "file_upload_enabled": True,
        "max_file_size_mb": 10,
        "reports_per_month": 0,
    },
    SubscriptionTier.PRO: {
        "rooms_per_month": -1,  # -1 = unlimited
        "file_upload_enabled": True,
        "max_file_size_mb": 50,
        "reports_per_month": 3,
    },
}


def get_tier_limits(tier: SubscriptionTier) -> dict:
    """Get limit configuration for a subscription tier"""
    return TIER_LIMITS.get(tier, TIER_LIMITS[SubscriptionTier.FREE])


def check_and_reset_monthly_counters(subscription: Subscription, db: Session) -> None:
    """
    Check if monthly counters need to be reset and reset them if necessary.
    Called at the start of each limit check to ensure counters are current.
    """
    now = datetime.now(timezone.utc)

    # If no reset date is set, initialize it to start of current month
    if subscription.month_reset_date is None:
        subscription.month_reset_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        subscription.rooms_created_this_month = 0
        subscription.reports_generated_this_month = 0
        db.commit()
        return

    # Check if we've crossed into a new month since last reset
    reset_date = subscription.month_reset_date
    if now.month != reset_date.month or now.year != reset_date.year:
        # Reset counters for new month
        subscription.month_reset_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        subscription.rooms_created_this_month = 0
        subscription.reports_generated_this_month = 0
        db.commit()


def check_room_creation_limit(user_id: int, db: Session) -> dict:
    """
    Check if user can create a new room based on their subscription tier.

    Raises:
        HTTPException: 402 Payment Required if limit exceeded
    """
    # Auto-create FREE subscription if user doesn't have one (defensive programming)
    subscription = get_or_create_subscription(db, user_id)

    # Reset counters if needed
    check_and_reset_monthly_counters(subscription, db)

    limits = get_tier_limits(subscription.tier)
    room_limit = limits["rooms_per_month"]

    # Unlimited rooms for PLUS and PRO tiers
    if room_limit == -1:
        return {
            "allowed": True,
            "tier": subscription.tier.value,
            "limit": room_limit,
            "current_count": subscription.rooms_created_this_month,
        }

    # For FREE tier, check ACTIVE rooms instead of created count to allow testing
    # Count active rooms for this user
    from app.models.room import Room
    from app.models.user import User
    from sqlalchemy.orm import Session

    user = db.query(User).filter(User.id == user_id).first()
    active_room_count = db.query(Room).filter(Room.participants.contains(user)).count()

    # Check if FREE tier user has reached limit based on ACTIVE rooms
    if active_room_count >= room_limit:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "room_limit_reached",
                "message": f"You've reached your limit of {room_limit} active room(s). Upgrade to PLUS for unlimited rooms.",
                "tier": subscription.tier.value,
                "limit": room_limit,
                "current_count": active_room_count,
                "upgrade_url": "/subscription"
            }
        )

    return {
        "allowed": True,
        "tier": subscription.tier.value,
        "limit": room_limit,
        "current_count": active_room_count,
    }


def increment_room_counter(user_id: int, db: Session) -> None:
    """Increment the room creation counter after successful room creation"""
    subscription = get_or_create_subscription(db, user_id)
    subscription.rooms_created_this_month += 1
    db.commit()


def check_file_upload_allowed(user_id: int, file_size_bytes: int, db: Session) -> dict:
    """
    Check if user can upload a file based on their subscription tier.

    Raises:
        HTTPException: 402 if file uploads not allowed or 413 if file too large
    """
    # Auto-create FREE subscription if user doesn't have one (defensive programming)
    subscription = get_or_create_subscription(db, user_id)

    limits = get_tier_limits(subscription.tier)
    file_upload_enabled = limits["file_upload_enabled"]
    max_size_mb = limits["max_file_size_mb"]

    file_size_mb = file_size_bytes / (1024 * 1024)

    # Check if file uploads are enabled for this tier
    if not file_upload_enabled:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "file_uploads_not_allowed",
                "message": "File uploads are not available on the FREE tier. Upgrade to PLUS for 10MB file uploads.",
                "tier": subscription.tier.value,
                "upgrade_url": "/subscription"
            }
        )

    # Check if file size exceeds tier limit
    if file_size_mb > max_size_mb:
        upgrade_tier = "PRO" if subscription.tier == SubscriptionTier.PLUS else "PLUS"
        upgrade_size = 50 if subscription.tier == SubscriptionTier.PLUS else 10

        raise HTTPException(
            status_code=413,
            detail={
                "error": "file_too_large",
                "message": f"File size ({file_size_mb:.1f}MB) exceeds your {max_size_mb}MB limit. Upgrade to {upgrade_tier} for {upgrade_size}MB uploads.",
                "tier": subscription.tier.value,
                "max_size_mb": max_size_mb,
                "file_size_mb": round(file_size_mb, 2),
                "upgrade_url": "/subscription"
            }
        )

    return {
        "allowed": True,
        "tier": subscription.tier.value,
        "max_size_mb": max_size_mb,
        "file_size_mb": round(file_size_mb, 2),
    }


def check_report_generation_limit(user_id: int, db: Session) -> dict:
    """
    Check if user can generate a professional report based on their subscription tier.

    Raises:
        HTTPException: 402 Payment Required if limit exceeded or feature not available
    """
    # Auto-create FREE subscription if user doesn't have one (defensive programming)
    subscription = get_or_create_subscription(db, user_id)

    # Reset counters if needed
    check_and_reset_monthly_counters(subscription, db)

    limits = get_tier_limits(subscription.tier)
    report_limit = limits["reports_per_month"]

    # Professional reports only available on PRO tier
    if subscription.tier != SubscriptionTier.PRO:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "reports_not_available",
                "message": "Professional reports are only available on the PRO tier. Upgrade to PRO for 3 reports per month.",
                "tier": subscription.tier.value,
                "upgrade_url": "/subscription"
            }
        )

    # Check if PRO user has reached monthly report limit
    if subscription.reports_generated_this_month >= report_limit:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "report_limit_reached",
                "message": f"You've reached your limit of {report_limit} professional reports per month. Your limit will reset next month.",
                "tier": subscription.tier.value,
                "limit": report_limit,
                "current_count": subscription.reports_generated_this_month,
                "reset_date": subscription.month_reset_date.isoformat() if subscription.month_reset_date else None
            }
        )

    return {
        "allowed": True,
        "tier": subscription.tier.value,
        "limit": report_limit,
        "current_count": subscription.reports_generated_this_month,
    }


def increment_report_counter(user_id: int, db: Session) -> None:
    """Increment the report generation counter after successful report creation"""
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if subscription:
        subscription.reports_generated_this_month += 1
        db.commit()
