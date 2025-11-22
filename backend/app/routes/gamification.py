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

    return new_entry


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

    # Award score
    score_change = SCORE_VALUES["breathing_exercise"]
    update_score(
        db, progress, "breathing_exercise", score_change,
        description=f"Completed {session.mode} breathing ({session.cycles_completed} cycles)",
        metadata={"mode": session.mode, "cycles": session.cycles_completed}
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

    # Add score earned to response
    response = BreathingSessionResponse(
        id=breathing_session.id,
        mode=breathing_session.mode,
        cycles_completed=breathing_session.cycles_completed,
        duration_seconds=breathing_session.duration_seconds,
        created_at=breathing_session.created_at,
        score_earned=score_change + bonus
    )

    return response


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

    return new_checkin


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

    return {
        "message": "Check-in complete!",
        "already_checked_in": False,
        "score_earned": score_change + bonus,
        "health_score": progress.health_score,
        "current_streak": progress.current_streak
    }
