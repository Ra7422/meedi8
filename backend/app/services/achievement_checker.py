"""
Achievement checker service.
Checks if users have earned achievements and awards them.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List, Optional

from app.models.gamification import (
    UserProgress,
    Achievement,
    UserAchievement,
    GratitudeEntry,
    BreathingSession,
    EmotionalCheckin,
)
from app.models.room import Room


def check_and_award_achievements(db: Session, user_id: int) -> List[dict]:
    """
    Check all achievements and award any that the user has earned.
    Returns list of newly awarded achievements.
    """
    newly_awarded = []

    # Get user progress
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).first()

    if not progress:
        return newly_awarded

    # Get all achievements
    achievements = db.query(Achievement).all()

    # Get already earned achievement IDs
    earned_ids = set(
        ua.achievement_id for ua in db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id
        ).all()
    )

    # Check each achievement
    for achievement in achievements:
        if achievement.id in earned_ids:
            continue

        if check_achievement_criteria(db, user_id, progress, achievement):
            # Award the achievement
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id,
                unlocked_at=datetime.now(timezone.utc)
            )
            db.add(user_achievement)

            newly_awarded.append({
                "id": achievement.id,
                "code": achievement.code,
                "name": achievement.name,
                "description": achievement.description,
                "icon": achievement.icon,
                "xp_reward": achievement.xp_reward,
                "rarity": achievement.rarity
            })

    if newly_awarded:
        db.commit()

    return newly_awarded


def check_achievement_criteria(
    db: Session,
    user_id: int,
    progress: UserProgress,
    achievement: Achievement
) -> bool:
    """
    Check if user meets the criteria for a specific achievement.
    """
    criteria = achievement.criteria
    criteria_type = criteria.get("type")
    target = criteria.get("target")
    value = criteria.get("value")

    if criteria_type == "count":
        return check_count_criteria(db, user_id, progress, target, value)

    elif criteria_type == "streak":
        return check_streak_criteria(progress, target, value)

    elif criteria_type == "tier":
        return check_tier_criteria(progress, target, value)

    elif criteria_type == "special":
        return check_special_criteria(db, user_id, progress, target, value)

    return False


def check_count_criteria(
    db: Session,
    user_id: int,
    progress: UserProgress,
    target: str,
    value: int
) -> bool:
    """Check count-based achievements."""

    if target == "messages":
        # Count total messages sent by user
        from app.models.room import Turn
        count = db.query(func.count(Turn.id)).filter(
            Turn.user_id == user_id,
            Turn.role == "user"
        ).scalar() or 0
        return count >= value

    elif target == "voice_messages":
        # Count voice messages
        from app.models.room import Turn
        count = db.query(func.count(Turn.id)).filter(
            Turn.user_id == user_id,
            Turn.is_voice == True
        ).scalar() or 0
        return count >= value

    elif target == "coaching_complete":
        # Count completed coaching sessions
        from app.models.room import Room, RoomParticipant
        count = db.query(func.count(Room.id)).join(
            RoomParticipant
        ).filter(
            RoomParticipant.user_id == user_id,
            Room.phase.in_(["user2_lobby", "user2_coaching", "main_room", "resolved"])
        ).scalar() or 0
        return count >= value

    elif target == "summaries_read":
        # This would need tracking - skip for now
        return False

    elif target == "resolutions":
        # Count resolved mediations
        from app.models.room import Room, RoomParticipant
        count = db.query(func.count(Room.id)).join(
            RoomParticipant
        ).filter(
            RoomParticipant.user_id == user_id,
            Room.phase == "resolved"
        ).scalar() or 0
        return count >= value

    elif target == "breathing_sessions":
        return progress.total_breathing_sessions >= value

    elif target == "breathing_minutes":
        return progress.total_breathing_minutes >= value

    elif target == "gratitude_entries":
        count = db.query(func.count(GratitudeEntry.id)).filter(
            GratitudeEntry.user_id == user_id
        ).scalar() or 0
        return count >= value

    elif target == "mood_checkins":
        count = db.query(func.count(EmotionalCheckin.id)).filter(
            EmotionalCheckin.user_id == user_id
        ).scalar() or 0
        return count >= value

    return False


def check_streak_criteria(
    progress: UserProgress,
    target: str,
    value: int
) -> bool:
    """Check streak-based achievements."""

    if target == "current_streak":
        return progress.current_streak >= value

    elif target == "longest_streak":
        return progress.longest_streak >= value

    return False


def check_tier_criteria(
    progress: UserProgress,
    target: str,
    value: str
) -> bool:
    """Check tier-based achievements."""

    if target == "health_tier":
        tier_order = ["bronze", "silver", "gold", "platinum"]
        current_tier = progress.health_tier

        if current_tier not in tier_order or value not in tier_order:
            return False

        return tier_order.index(current_tier) >= tier_order.index(value)

    return False


def check_special_criteria(
    db: Session,
    user_id: int,
    progress: UserProgress,
    target: str,
    value
) -> bool:
    """Check special achievement criteria."""

    if target == "double_breath_streak":
        # Check if user has breathed at least twice per day for X consecutive days
        from datetime import timedelta

        sessions = db.query(BreathingSession).filter(
            BreathingSession.user_id == user_id
        ).order_by(BreathingSession.created_at.desc()).all()

        if not sessions:
            return False

        # Group sessions by date
        sessions_by_date = {}
        for session in sessions:
            date_key = session.created_at.date()
            if date_key not in sessions_by_date:
                sessions_by_date[date_key] = 0
            sessions_by_date[date_key] += 1

        # Check for consecutive days with 2+ sessions
        today = datetime.now(timezone.utc).date()
        consecutive_days = 0

        for i in range(value + 30):  # Check up to 30 days back from required
            check_date = today - timedelta(days=i)
            if sessions_by_date.get(check_date, 0) >= 2:
                consecutive_days += 1
                if consecutive_days >= value:
                    return True
            else:
                consecutive_days = 0

        return False

    elif target == "fast_resolution":
        # Check if any mediation was resolved in under X minutes
        from app.models.room import Room, RoomParticipant
        rooms = db.query(Room).join(
            RoomParticipant
        ).filter(
            RoomParticipant.user_id == user_id,
            Room.phase == "resolved"
        ).all()

        for room in rooms:
            if room.resolved_at and room.created_at:
                duration_minutes = (room.resolved_at - room.created_at).total_seconds() / 60
                if duration_minutes <= value:
                    return True
        return False

    elif target == "late_night":
        # Check if user completed any session after midnight
        from app.models.room import Turn
        late_turns = db.query(Turn).filter(
            Turn.user_id == user_id,
            func.extract('hour', Turn.created_at) >= 0,
            func.extract('hour', Turn.created_at) < 5
        ).first()
        return late_turns is not None

    elif target == "early_morning":
        # Check if user completed any session before X am
        from app.models.room import Turn
        early_turns = db.query(Turn).filter(
            Turn.user_id == user_id,
            func.extract('hour', Turn.created_at) < value
        ).first()
        return early_turns is not None

    return False
