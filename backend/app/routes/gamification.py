"""
Gamification API Endpoints
Handles health scores, streaks, achievements, challenges, and wellness features
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field

from app.db import get_db
from app.models.user import User
from app.models.gamification import (
    UserProgress,
    ScoreEvent,
    GratitudeEntry,
    BreathingSession,
    EmotionalCheckin,
    Achievement,
    UserAchievement,
    DailyChallenge,
    UserDailyChallenge,
)
from app.routes.auth import get_current_user
from app.services.achievement_checker import check_and_award_achievements

router = APIRouter(prefix="/gamification", tags=["gamification"])


# ========================================
# PYDANTIC SCHEMAS
# ========================================

class HealthScoreResponse(BaseModel):
    health_score: int
    health_tier: str
    highest_score: int
    current_streak: int
    longest_streak: int
    streak_last_activity: Optional[datetime]
    streak_protected_until: Optional[datetime]
    total_breathing_sessions: int
    total_breathing_minutes: int

    class Config:
        from_attributes = True


class ScoreEventResponse(BaseModel):
    id: int
    event_type: str
    score_change: int
    score_before: int
    score_after: int
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreHistoryResponse(BaseModel):
    events: List[ScoreEventResponse]
    total_count: int


class GratitudeEntryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    prompt: Optional[str] = None


class GratitudeEntryResponse(BaseModel):
    id: int
    content: str
    prompt: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class GratitudeListResponse(BaseModel):
    entries: List[GratitudeEntryResponse]
    total_count: int


class BreathingSessionCreate(BaseModel):
    mode: str = Field(..., pattern="^(box|478|coherence)$")
    cycles_completed: int = Field(..., ge=1)
    duration_seconds: int = Field(..., ge=1)


class BreathingSessionResponse(BaseModel):
    id: int
    mode: str
    cycles_completed: int
    duration_seconds: int
    created_at: datetime
    score_earned: int = 0

    class Config:
        from_attributes = True


class MoodCheckinCreate(BaseModel):
    mood: str = Field(..., pattern="^(sunny|cloudy|rainy|stormy|foggy)$")
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    note: Optional[str] = Field(None, max_length=500)
    context: Optional[str] = Field(None, pattern="^(morning|evening|pre_meditation|post_meditation)$")


class MoodCheckinResponse(BaseModel):
    id: int
    mood: str
    energy_level: Optional[int]
    note: Optional[str]
    context: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    streak_last_activity: Optional[datetime]
    streak_protected_until: Optional[datetime]
    is_at_risk: bool
    can_protect: bool


class AchievementResponse(BaseModel):
    id: int
    code: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    rarity: str
    is_hidden: bool
    visibility_tier: str = "visible"  # visible, silhouette, secret
    hint: Optional[str] = None
    earned: bool = False
    unlocked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AchievementsListResponse(BaseModel):
    achievements: List[AchievementResponse]
    total_earned: int
    total_available: int


class NewlyEarnedAchievement(BaseModel):
    id: int
    code: str
    name: str
    description: str
    icon: str
    xp_reward: int
    rarity: str


# ========================================
# SCORING CONSTANTS
# ========================================

SCORE_VALUES = {
    "meditation_complete": 15,
    "breathing_exercise": 5,
    "gratitude_entry": 3,
    "mood_checkin": 2,
    "daily_checkin": 2,
    "streak_bonus_7": 10,
    "streak_bonus_14": 15,
    "streak_bonus_30": 25,
    "streak_bonus_60": 40,
    "streak_bonus_90": 60,
    "inactivity_penalty": -5,
}

TIER_THRESHOLDS = {
    "bronze": 0,
    "silver": 40,
    "gold": 70,
    "platinum": 90,
}


def calculate_tier(score: int) -> str:
    """Calculate tier based on score."""
    if score >= TIER_THRESHOLDS["platinum"]:
        return "platinum"
    elif score >= TIER_THRESHOLDS["gold"]:
        return "gold"
    elif score >= TIER_THRESHOLDS["silver"]:
        return "silver"
    return "bronze"


def get_or_create_progress(db: Session, user_id: int) -> UserProgress:
    """Get existing progress or create new one for user."""
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).first()

    if not progress:
        progress = UserProgress(
            user_id=user_id,
            health_score=50,
            health_tier="bronze",
            highest_score=50,
            current_streak=0,
            longest_streak=0,
            total_breathing_sessions=0,
            total_breathing_minutes=0,
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    return progress


def update_score(
    db: Session,
    progress: UserProgress,
    event_type: str,
    score_change: int,
    description: Optional[str] = None,
    metadata: Optional[dict] = None
) -> ScoreEvent:
    """Update user's score and create event record."""
    score_before = progress.health_score
    new_score = max(0, min(100, score_before + score_change))

    progress.health_score = new_score
    progress.health_tier = calculate_tier(new_score)

    if new_score > progress.highest_score:
        progress.highest_score = new_score

    event = ScoreEvent(
        user_id=progress.user_id,
        event_type=event_type,
        score_change=score_change,
        score_before=score_before,
        score_after=new_score,
        description=description,
        event_metadata=metadata,
    )
    db.add(event)

    return event


def update_challenge_progress_internal(db: Session, user_id: int, action: str) -> list:
    """Internal function to update challenge progress. Returns list of updated challenges."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    # Get today's incomplete challenges
    user_challenges = db.query(UserDailyChallenge).filter(
        UserDailyChallenge.user_id == user_id,
        UserDailyChallenge.assigned_at >= today_start,
        UserDailyChallenge.expires_at <= tomorrow_start + timedelta(hours=6),
        UserDailyChallenge.completed_at == None
    ).all()

    updated = []

    for uc in user_challenges:
        challenge = db.query(DailyChallenge).filter(
            DailyChallenge.id == uc.challenge_id
        ).first()

        if not challenge:
            continue

        if challenge.requirements.get("action") == action:
            target = challenge.requirements.get("count", 1)
            uc.progress += 1

            if uc.progress >= target:
                uc.completed_at = now

            updated.append({
                "challenge_id": challenge.id,
                "code": challenge.code,
                "title": challenge.title,
                "progress": uc.progress,
                "target": target,
                "completed": uc.completed_at is not None,
                "score_reward": challenge.score_reward
            })

    return updated


def extend_streak(db: Session, progress: UserProgress) -> int:
    """Extend user's streak if eligible. Returns bonus score earned."""
    now = datetime.now(timezone.utc)
    bonus = 0

    if progress.streak_last_activity:
        time_since_last = now - progress.streak_last_activity

        # If more than 48 hours, streak is broken (unless protected)
        if time_since_last > timedelta(hours=48):
            if progress.streak_protected_until and now < progress.streak_protected_until:
                # Streak protected, just update activity time
                pass
            else:
                # Streak broken
                progress.current_streak = 0

        # If between 24-48 hours, continue streak
        elif time_since_last > timedelta(hours=24):
            progress.current_streak += 1

            # Check for milestone bonuses
            if progress.current_streak == 7:
                bonus = SCORE_VALUES["streak_bonus_7"]
            elif progress.current_streak == 14:
                bonus = SCORE_VALUES["streak_bonus_14"]
            elif progress.current_streak == 30:
                bonus = SCORE_VALUES["streak_bonus_30"]
            elif progress.current_streak == 60:
                bonus = SCORE_VALUES["streak_bonus_60"]
            elif progress.current_streak == 90:
                bonus = SCORE_VALUES["streak_bonus_90"]

        # If less than 24 hours, same day activity (no streak increment)
    else:
        # First activity ever
        progress.current_streak = 1

    progress.streak_last_activity = now

    if progress.current_streak > progress.longest_streak:
        progress.longest_streak = progress.current_streak

    return bonus


# ========================================
# HEALTH SCORE ENDPOINTS
# ========================================

@router.get("/health-score", response_model=HealthScoreResponse)
def get_health_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's current health score and progress."""
    progress = get_or_create_progress(db, current_user.id)
    return progress


@router.get("/health-score/history", response_model=ScoreHistoryResponse)
def get_score_history(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get history of score changes."""
    total = db.query(func.count(ScoreEvent.id)).filter(
        ScoreEvent.user_id == current_user.id
    ).scalar()

    events = db.query(ScoreEvent).filter(
        ScoreEvent.user_id == current_user.id
    ).order_by(
        ScoreEvent.created_at.desc()
    ).offset(offset).limit(limit).all()

    return ScoreHistoryResponse(events=events, total_count=total)


# ========================================
# STREAK ENDPOINTS
# ========================================

@router.get("/streaks", response_model=StreakResponse)
def get_streaks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's streak information."""
    progress = get_or_create_progress(db, current_user.id)
    now = datetime.now(timezone.utc)

    # Check if streak is at risk (between 24-48 hours since last activity)
    is_at_risk = False
    if progress.streak_last_activity and progress.current_streak > 0:
        time_since_last = now - progress.streak_last_activity
        is_at_risk = time_since_last > timedelta(hours=24)

    # Check if user can protect streak (PRO feature, once per week)
    can_protect = False
    if current_user.subscription and current_user.subscription.tier.value in ["plus", "pro"]:
        if not progress.streak_protected_until or progress.streak_protected_until < now:
            can_protect = True

    return StreakResponse(
        current_streak=progress.current_streak,
        longest_streak=progress.longest_streak,
        streak_last_activity=progress.streak_last_activity,
        streak_protected_until=progress.streak_protected_until,
        is_at_risk=is_at_risk,
        can_protect=can_protect,
    )


@router.post("/streaks/protect", response_model=StreakResponse)
def protect_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Protect streak for 48 hours (PRO feature)."""
    # Check PRO subscription
    if not current_user.subscription or current_user.subscription.tier.value not in ["plus", "pro"]:
        raise HTTPException(
            status_code=403,
            detail="Streak protection requires PLUS or PRO subscription"
        )

    progress = get_or_create_progress(db, current_user.id)
    now = datetime.now(timezone.utc)

    # Check if already protected this week
    if progress.streak_protected_until and progress.streak_protected_until > now:
        raise HTTPException(
            status_code=400,
            detail="Streak is already protected"
        )

    # Protect for 48 hours
    progress.streak_protected_until = now + timedelta(hours=48)
    db.commit()
    db.refresh(progress)

    return StreakResponse(
        current_streak=progress.current_streak,
        longest_streak=progress.longest_streak,
        streak_last_activity=progress.streak_last_activity,
        streak_protected_until=progress.streak_protected_until,
        is_at_risk=False,
        can_protect=False,
    )


# ========================================
# GRATITUDE JOURNAL ENDPOINTS
# ========================================

@router.get("/journal", response_model=GratitudeListResponse)
def get_journal_entries(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's gratitude journal entries."""
    total = db.query(func.count(GratitudeEntry.id)).filter(
        GratitudeEntry.user_id == current_user.id
    ).scalar()

    entries = db.query(GratitudeEntry).filter(
        GratitudeEntry.user_id == current_user.id
    ).order_by(
        GratitudeEntry.created_at.desc()
    ).offset(offset).limit(limit).all()

    return GratitudeListResponse(entries=entries, total_count=total)


@router.post("/journal", response_model=GratitudeEntryResponse)
def create_journal_entry(
    entry: GratitudeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new gratitude journal entry."""
    progress = get_or_create_progress(db, current_user.id)

    # Create entry
    new_entry = GratitudeEntry(
        user_id=current_user.id,
        content=entry.content,
        prompt=entry.prompt,
    )
    db.add(new_entry)

    # Award score
    score_change = SCORE_VALUES["gratitude_entry"]
    update_score(
        db, progress, "gratitude_entry", score_change,
        description="Gratitude journal entry"
    )

    # Extend streak
    bonus = extend_streak(db, progress)
    if bonus > 0:
        update_score(
            db, progress, f"streak_bonus_{progress.current_streak}", bonus,
            description=f"{progress.current_streak}-day streak bonus!"
        )

    db.commit()
    db.refresh(new_entry)

    # Check for newly earned achievements
    new_achievements = check_and_award_achievements(db, current_user.id)

    # Update challenge progress
    updated_challenges = update_challenge_progress_internal(db, current_user.id, "gratitude")

    return {
        "id": new_entry.id,
        "content": new_entry.content,
        "prompt": new_entry.prompt,
        "created_at": new_entry.created_at,
        "new_achievements": new_achievements,
        "updated_challenges": updated_challenges
    }


@router.delete("/journal/{entry_id}")
def delete_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a gratitude journal entry."""
    entry = db.query(GratitudeEntry).filter(
        GratitudeEntry.id == entry_id,
        GratitudeEntry.user_id == current_user.id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    db.delete(entry)
    db.commit()

    return {"message": "Entry deleted"}


# ========================================
# BREATHING SESSION ENDPOINTS
# ========================================

@router.post("/breathing/complete", response_model=BreathingSessionResponse)
def complete_breathing_session(
    session: BreathingSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a completed breathing exercise session."""
    # Minimum 55 seconds (60 with grace period) required to earn points
    MIN_DURATION = 55

    if session.duration_seconds < MIN_DURATION:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum duration is 60 seconds. You completed {session.duration_seconds} seconds."
        )

    progress = get_or_create_progress(db, current_user.id)

    # Create session record
    breathing_session = BreathingSession(
        user_id=current_user.id,
        mode=session.mode,
        cycles_completed=session.cycles_completed,
        duration_seconds=session.duration_seconds,
    )
    db.add(breathing_session)

    # Update stats
    progress.total_breathing_sessions += 1
    progress.total_breathing_minutes += session.duration_seconds // 60

    # Tiered reward: 5 pts at 60s, 8 pts at 120s, 10 pts at 180s
    if session.duration_seconds >= 180:
        score_change = 10
    elif session.duration_seconds >= 120:
        score_change = 8
    else:
        score_change = SCORE_VALUES["breathing_exercise"]  # 5

    update_score(
        db, progress, "breathing_exercise", score_change,
        description=f"Completed {session.mode} breathing ({session.cycles_completed} cycles, {session.duration_seconds}s)",
        metadata={"mode": session.mode, "cycles": session.cycles_completed, "duration": session.duration_seconds}
    )

    # Extend streak
    bonus = extend_streak(db, progress)
    if bonus > 0:
        update_score(
            db, progress, f"streak_bonus_{progress.current_streak}", bonus,
            description=f"{progress.current_streak}-day streak bonus!"
        )

    db.commit()
    db.refresh(breathing_session)

    # Check for newly earned achievements
    new_achievements = check_and_award_achievements(db, current_user.id)

    # Update challenge progress
    updated_challenges = update_challenge_progress_internal(db, current_user.id, "breathing")

    return {
        "id": breathing_session.id,
        "mode": breathing_session.mode,
        "cycles_completed": breathing_session.cycles_completed,
        "duration_seconds": breathing_session.duration_seconds,
        "created_at": breathing_session.created_at,
        "score_earned": score_change + bonus,
        "new_achievements": new_achievements,
        "updated_challenges": updated_challenges
    }


@router.get("/breathing/history")
def get_breathing_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's breathing session history."""
    total = db.query(func.count(BreathingSession.id)).filter(
        BreathingSession.user_id == current_user.id
    ).scalar()

    sessions = db.query(BreathingSession).filter(
        BreathingSession.user_id == current_user.id
    ).order_by(
        BreathingSession.created_at.desc()
    ).offset(offset).limit(limit).all()

    return {
        "sessions": [
            {
                "id": s.id,
                "mode": s.mode,
                "cycles_completed": s.cycles_completed,
                "duration_seconds": s.duration_seconds,
                "created_at": s.created_at
            }
            for s in sessions
        ],
        "total_count": total
    }


# ========================================
# MOOD CHECK-IN ENDPOINTS
# ========================================

@router.post("/mood", response_model=MoodCheckinResponse)
def create_mood_checkin(
    checkin: MoodCheckinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log an emotional weather check-in."""
    progress = get_or_create_progress(db, current_user.id)

    # Create check-in
    new_checkin = EmotionalCheckin(
        user_id=current_user.id,
        mood=checkin.mood,
        energy_level=checkin.energy_level,
        note=checkin.note,
        context=checkin.context,
    )
    db.add(new_checkin)

    # Award score
    score_change = SCORE_VALUES["mood_checkin"]
    update_score(
        db, progress, "mood_checkin", score_change,
        description=f"Mood check-in: {checkin.mood}"
    )

    # Extend streak
    bonus = extend_streak(db, progress)
    if bonus > 0:
        update_score(
            db, progress, f"streak_bonus_{progress.current_streak}", bonus,
            description=f"{progress.current_streak}-day streak bonus!"
        )

    db.commit()
    db.refresh(new_checkin)

    # Check for newly earned achievements
    new_achievements = check_and_award_achievements(db, current_user.id)

    # Update challenge progress
    updated_challenges = update_challenge_progress_internal(db, current_user.id, "mood")

    return {
        "id": new_checkin.id,
        "mood": new_checkin.mood,
        "energy_level": new_checkin.energy_level,
        "note": new_checkin.note,
        "context": new_checkin.context,
        "created_at": new_checkin.created_at,
        "new_achievements": new_achievements,
        "updated_challenges": updated_challenges
    }


@router.get("/mood/history")
def get_mood_history(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's mood check-in history."""
    total = db.query(func.count(EmotionalCheckin.id)).filter(
        EmotionalCheckin.user_id == current_user.id
    ).scalar()

    checkins = db.query(EmotionalCheckin).filter(
        EmotionalCheckin.user_id == current_user.id
    ).order_by(
        EmotionalCheckin.created_at.desc()
    ).offset(offset).limit(limit).all()

    return {
        "checkins": [
            {
                "id": c.id,
                "mood": c.mood,
                "energy_level": c.energy_level,
                "note": c.note,
                "context": c.context,
                "created_at": c.created_at
            }
            for c in checkins
        ],
        "total_count": total
    }


# ========================================
# DAILY CHECK-IN ENDPOINT
# ========================================

@router.post("/daily-checkin")
def perform_daily_checkin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a daily check-in and award points."""
    progress = get_or_create_progress(db, current_user.id)

    # Check if already checked in today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_checkin = db.query(ScoreEvent).filter(
        ScoreEvent.user_id == current_user.id,
        ScoreEvent.event_type == "daily_checkin",
        ScoreEvent.created_at >= today_start
    ).first()

    if today_checkin:
        return {
            "message": "Already checked in today",
            "already_checked_in": True,
            "health_score": progress.health_score
        }

    # Award score
    score_change = SCORE_VALUES["daily_checkin"]
    update_score(
        db, progress, "daily_checkin", score_change,
        description="Daily check-in"
    )

    # Extend streak
    bonus = extend_streak(db, progress)
    if bonus > 0:
        update_score(
            db, progress, f"streak_bonus_{progress.current_streak}", bonus,
            description=f"{progress.current_streak}-day streak bonus!"
        )

    db.commit()
    db.refresh(progress)

    # Check for newly earned achievements
    new_achievements = check_and_award_achievements(db, current_user.id)

    return {
        "message": "Check-in complete!",
        "already_checked_in": False,
        "score_earned": score_change + bonus,
        "health_score": progress.health_score,
        "current_streak": progress.current_streak,
        "new_achievements": new_achievements
    }


# ========================================
# ACHIEVEMENTS ENDPOINTS
# ========================================

@router.get("/achievements", response_model=AchievementsListResponse)
def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all achievements with user's progress using hybrid visibility."""
    # Get all achievements
    all_achievements = db.query(Achievement).order_by(
        Achievement.category,
        Achievement.sort_order
    ).all()

    # Get user's earned achievements
    user_achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == current_user.id
    ).all()

    # Create lookup dict for earned achievements
    earned_lookup = {ua.achievement_id: ua for ua in user_achievements}

    # Build response with hybrid visibility
    achievements = []
    total_earned = 0

    for achievement in all_achievements:
        user_ach = earned_lookup.get(achievement.id)
        is_earned = user_ach is not None

        if is_earned:
            total_earned += 1

        # Get visibility tier (default to visible if not set)
        visibility = getattr(achievement, 'visibility_tier', 'visible') or 'visible'

        # Handle visibility tiers:
        # - visible: Show full details
        # - silhouette: Show hint instead of description, obscured name
        # - secret: Don't show at all unless earned
        if visibility == "secret" and not is_earned:
            continue

        # For silhouette badges, obscure details if not earned
        if visibility == "silhouette" and not is_earned:
            achievements.append(AchievementResponse(
                id=achievement.id,
                code=achievement.code,
                name="???",
                description=achievement.hint or "Keep exploring to unlock this badge...",
                icon="❓",
                category=achievement.category,
                xp_reward=achievement.xp_reward,
                rarity=achievement.rarity,
                is_hidden=achievement.is_hidden,
                visibility_tier=visibility,
                hint=achievement.hint,
                earned=False,
                unlocked_at=None
            ))
        else:
            # Visible badges or earned badges show full details
            achievements.append(AchievementResponse(
                id=achievement.id,
                code=achievement.code,
                name=achievement.name,
                description=achievement.description,
                icon=achievement.icon,
                category=achievement.category,
                xp_reward=achievement.xp_reward,
                rarity=achievement.rarity,
                is_hidden=achievement.is_hidden,
                visibility_tier=visibility,
                hint=achievement.hint,
                earned=is_earned,
                unlocked_at=user_ach.unlocked_at if user_ach else None
            ))

    return AchievementsListResponse(
        achievements=achievements,
        total_earned=total_earned,
        total_available=len(all_achievements)
    )


@router.post("/achievements/seed")
def seed_achievements_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Seed achievements into database. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.seed_achievements import ACHIEVEMENTS

    # Define visibility tiers
    secret_badges = {"night_owl", "early_bird"}
    silhouette_badges = {
        "eloquent": "Keep the conversation flowing...",
        "conflict_master": "True mastery takes dedication...",
        "diamond_soul": "Reach for the highest tier...",
        "streak_90": "Commitment beyond measure...",
        "zen_master": "Breathe deeply and often...",
        "double_breath_30": "Make breathing a daily ritual...",
        "emotional_intelligence": "Know yourself to know others...",
    }

    created = 0
    updated = 0

    for achievement_data in ACHIEVEMENTS:
        # Make a copy to avoid modifying original
        data = achievement_data.copy()

        # Set visibility tier if not already set
        code = data["code"]
        if "visibility_tier" not in data:
            if code in secret_badges:
                data["visibility_tier"] = "secret"
            elif code in silhouette_badges:
                data["visibility_tier"] = "silhouette"
                data["hint"] = silhouette_badges[code]
            else:
                data["visibility_tier"] = "visible"

        existing = db.query(Achievement).filter(
            Achievement.code == data["code"]
        ).first()

        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            achievement = Achievement(**data)
            db.add(achievement)
            created += 1

    db.commit()

    return {
        "message": f"Seeded achievements: {created} created, {updated} updated",
        "total": len(ACHIEVEMENTS)
    }


# ========================================
# DAILY CHALLENGES ENDPOINTS
# ========================================

class ChallengeResponse(BaseModel):
    id: int
    challenge_id: int
    code: str
    title: str
    description: str
    requirements: dict
    score_reward: int
    progress: int
    target: int
    completed: bool
    claimed: bool
    expires_at: datetime

    class Config:
        from_attributes = True


class ChallengesListResponse(BaseModel):
    challenges: List[ChallengeResponse]
    completed_today: int
    total_today: int


@router.get("/challenges", response_model=ChallengesListResponse)
def get_daily_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's daily challenges. Assigns new ones if needed."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    # Get today's assigned challenges
    user_challenges = db.query(UserDailyChallenge).filter(
        UserDailyChallenge.user_id == current_user.id,
        UserDailyChallenge.assigned_at >= today_start,
        UserDailyChallenge.expires_at <= tomorrow_start + timedelta(hours=6)  # Buffer for timezone
    ).all()

    # If no challenges today, assign new ones
    if not user_challenges:
        user_challenges = assign_daily_challenges(db, current_user.id)

    # Build response
    challenges = []
    completed_count = 0

    for uc in user_challenges:
        challenge = db.query(DailyChallenge).filter(
            DailyChallenge.id == uc.challenge_id
        ).first()

        if not challenge:
            continue

        # Get target value from requirements
        target = challenge.requirements.get("count", 1)
        is_completed = uc.completed_at is not None

        if is_completed:
            completed_count += 1

        challenges.append(ChallengeResponse(
            id=uc.id,
            challenge_id=challenge.id,
            code=challenge.code,
            title=challenge.title,
            description=challenge.description,
            requirements=challenge.requirements,
            score_reward=challenge.score_reward,
            progress=uc.progress,
            target=target,
            completed=is_completed,
            claimed=uc.claimed_at is not None,
            expires_at=uc.expires_at
        ))

    return ChallengesListResponse(
        challenges=challenges,
        completed_today=completed_count,
        total_today=len(challenges)
    )


def assign_daily_challenges(db: Session, user_id: int) -> List[UserDailyChallenge]:
    """Assign 3 random challenges to user for today."""
    import random

    now = datetime.now(timezone.utc)
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

    # Get all active challenges
    all_challenges = db.query(DailyChallenge).filter(
        DailyChallenge.is_active == True
    ).all()

    if not all_challenges:
        return []

    # Select 3 random challenges (or fewer if not enough available)
    num_to_assign = min(3, len(all_challenges))
    selected = random.sample(all_challenges, num_to_assign)

    # Create user challenge assignments
    user_challenges = []
    for challenge in selected:
        uc = UserDailyChallenge(
            user_id=user_id,
            challenge_id=challenge.id,
            assigned_at=now,
            expires_at=tomorrow,
            progress=0
        )
        db.add(uc)
        user_challenges.append(uc)

    db.commit()

    # Refresh to get IDs
    for uc in user_challenges:
        db.refresh(uc)

    return user_challenges


@router.post("/challenges/{user_challenge_id}/claim")
def claim_challenge_reward(
    user_challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Claim reward for a completed challenge."""
    # Get user's challenge
    user_challenge = db.query(UserDailyChallenge).filter(
        UserDailyChallenge.id == user_challenge_id,
        UserDailyChallenge.user_id == current_user.id
    ).first()

    if not user_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if not user_challenge.completed_at:
        raise HTTPException(status_code=400, detail="Challenge not completed")

    if user_challenge.claimed_at:
        raise HTTPException(status_code=400, detail="Reward already claimed")

    # Get challenge details
    challenge = db.query(DailyChallenge).filter(
        DailyChallenge.id == user_challenge.challenge_id
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge definition not found")

    # Award score
    progress = get_or_create_progress(db, current_user.id)
    score_change = challenge.score_reward

    update_score(
        db, progress, "challenge_complete", score_change,
        description=f"Completed challenge: {challenge.title}",
        metadata={"challenge_code": challenge.code}
    )

    # Mark as claimed
    user_challenge.claimed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(progress)

    # Check for achievements
    new_achievements = check_and_award_achievements(db, current_user.id)

    return {
        "message": "Reward claimed!",
        "score_earned": score_change,
        "health_score": progress.health_score,
        "new_achievements": new_achievements
    }


@router.post("/challenges/update-progress")
def update_challenge_progress(
    action: str = Query(..., description="The action type that was performed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update progress on challenges based on action type.

    Called automatically when user performs actions like:
    - breathing: Completed a breathing exercise
    - gratitude: Wrote a gratitude entry
    - mood: Logged mood
    - voice_message: Sent a voice message
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    # Get today's challenges
    user_challenges = db.query(UserDailyChallenge).filter(
        UserDailyChallenge.user_id == current_user.id,
        UserDailyChallenge.assigned_at >= today_start,
        UserDailyChallenge.expires_at <= tomorrow_start + timedelta(hours=6),
        UserDailyChallenge.completed_at == None  # Only incomplete challenges
    ).all()

    updated = []

    for uc in user_challenges:
        challenge = db.query(DailyChallenge).filter(
            DailyChallenge.id == uc.challenge_id
        ).first()

        if not challenge:
            continue

        # Check if this action matches the challenge requirement
        if challenge.requirements.get("action") == action:
            target = challenge.requirements.get("count", 1)
            uc.progress += 1

            # Check if completed
            if uc.progress >= target:
                uc.completed_at = now

            updated.append({
                "challenge_id": challenge.id,
                "code": challenge.code,
                "progress": uc.progress,
                "target": target,
                "completed": uc.completed_at is not None
            })

    db.commit()

    return {
        "updated_challenges": updated
    }


@router.post("/challenges/seed")
def seed_challenges_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Seed daily challenges into database. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.seed_challenges import CHALLENGES

    created = 0
    updated = 0

    for challenge_data in CHALLENGES:
        existing = db.query(DailyChallenge).filter(
            DailyChallenge.code == challenge_data["code"]
        ).first()

        if existing:
            for key, value in challenge_data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            challenge = DailyChallenge(**challenge_data)
            db.add(challenge)
            created += 1

    db.commit()

    return {
        "message": f"Seeded challenges: {created} created, {updated} updated",
        "total": len(CHALLENGES)
    }


# ========================================
# INACTIVITY PENALTY (Admin/Scheduled Job)
# ========================================

@router.post("/admin/apply-inactivity-penalties")
def apply_inactivity_penalties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Apply score penalties for inactive users.
    Should be run daily by a scheduled job.
    Admin only endpoint.

    Penalty schedule:
    - 7 days inactive: -5 points
    - 14 days inactive: -10 points
    - 30 days inactive: -15 points
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    now = datetime.now(timezone.utc)
    penalties_applied = 0
    users_penalized = []

    # Get all users with progress records
    all_progress = db.query(UserProgress).filter(
        UserProgress.streak_last_activity.isnot(None),
        UserProgress.health_score > 0  # Only penalize users with scores
    ).all()

    for progress in all_progress:
        if not progress.streak_last_activity:
            continue

        days_inactive = (now - progress.streak_last_activity).days

        # Determine penalty based on inactivity duration
        penalty = 0
        penalty_type = None

        if days_inactive >= 30:
            penalty = 15
            penalty_type = "30_day_inactivity"
        elif days_inactive >= 14:
            penalty = 10
            penalty_type = "14_day_inactivity"
        elif days_inactive >= 7:
            penalty = 5
            penalty_type = "7_day_inactivity"

        if penalty > 0:
            # Check if we already penalized today for this level
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            existing_penalty = db.query(ScoreEvent).filter(
                ScoreEvent.user_id == progress.user_id,
                ScoreEvent.event_type == penalty_type,
                ScoreEvent.created_at >= today_start
            ).first()

            if existing_penalty:
                continue  # Already penalized today

            # Apply the penalty
            old_score = progress.health_score
            new_score = max(0, old_score - penalty)
            progress.health_score = new_score

            # Update tier
            if new_score >= 90:
                progress.health_tier = "platinum"
            elif new_score >= 70:
                progress.health_tier = "gold"
            elif new_score >= 40:
                progress.health_tier = "silver"
            else:
                progress.health_tier = "bronze"

            # Log the event
            event = ScoreEvent(
                user_id=progress.user_id,
                event_type=penalty_type,
                score_change=-penalty,
                score_before=old_score,
                score_after=new_score,
                description=f"Inactivity penalty: {days_inactive} days without activity"
            )
            db.add(event)

            penalties_applied += 1
            users_penalized.append({
                "user_id": progress.user_id,
                "days_inactive": days_inactive,
                "penalty": penalty,
                "new_score": new_score
            })

    db.commit()

    return {
        "message": f"Applied {penalties_applied} inactivity penalties",
        "penalties": users_penalized
    }


@router.post("/admin/break-expired-streaks")
def break_expired_streaks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Break streaks for users who haven't been active in 24+ hours.
    Should be run daily by a scheduled job.
    Admin only endpoint.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    now = datetime.now(timezone.utc)
    streaks_broken = 0
    users_affected = []

    # Get all users with active streaks
    active_streaks = db.query(UserProgress).filter(
        UserProgress.current_streak > 0,
        UserProgress.streak_last_activity.isnot(None)
    ).all()

    for progress in active_streaks:
        time_since_last = now - progress.streak_last_activity

        # Check if protected
        is_protected = (
            progress.streak_protected_until and
            progress.streak_protected_until > now
        )

        # Break streak if 24+ hours inactive and not protected
        if time_since_last.total_seconds() > 86400 and not is_protected:  # 24 hours
            old_streak = progress.current_streak
            progress.current_streak = 0

            streaks_broken += 1
            users_affected.append({
                "user_id": progress.user_id,
                "old_streak": old_streak,
                "hours_inactive": round(time_since_last.total_seconds() / 3600, 1)
            })

    db.commit()

    return {
        "message": f"Broke {streaks_broken} expired streaks",
        "affected_users": users_affected
    }
