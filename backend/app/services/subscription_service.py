"""
Subscription Service - Manages user subscriptions and feature access
"""
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from app.models.user import User


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
