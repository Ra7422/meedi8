from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, func, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from ..db import Base


class UserProgress(Base):
    """Core gamification progress tracking for each user."""
    __tablename__ = 'user_progress'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     unique=True, nullable=False, index=True)

    # Health Score (0-100)
    health_score = Column(Integer, default=50, nullable=False)
    health_tier = Column(String(20), default='bronze', nullable=False)  # bronze/silver/gold/platinum
    highest_score = Column(Integer, default=50, nullable=False)

    # Streaks
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    streak_last_activity = Column(DateTime(timezone=True), nullable=True)
    streak_protected_until = Column(DateTime(timezone=True), nullable=True)  # PRO feature

    # Breathing stats
    total_breathing_sessions = Column(Integer, default=0, nullable=False)
    total_breathing_minutes = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship('User', backref='gamification_progress')


class ScoreEvent(Base):
    """History of score changes for transparency and debugging."""
    __tablename__ = 'score_events'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, index=True)

    event_type = Column(String(50), nullable=False)  # 'mediation_complete', 'daily_checkin', 'streak_bonus', 'inactivity_penalty'
    score_change = Column(Integer, nullable=False)  # Can be positive or negative
    score_before = Column(Integer, nullable=False)
    score_after = Column(Integer, nullable=False)

    description = Column(String(255), nullable=True)  # Human-readable description
    event_metadata = Column(JSON, nullable=True)  # Additional context (room_id, streak_length, etc.)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship('User', backref='score_events')


class GratitudeEntry(Base):
    """Gratitude journal entries."""
    __tablename__ = 'gratitude_entries'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, index=True)

    content = Column(Text, nullable=False)
    prompt = Column(String(255), nullable=True)  # Optional prompt that inspired entry

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship('User', backref='gratitude_entries')


class BreathingSession(Base):
    """Logged breathing exercise sessions."""
    __tablename__ = 'breathing_sessions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, index=True)

    mode = Column(String(20), nullable=False)  # 'box', '478', 'coherence'
    cycles_completed = Column(Integer, nullable=False)
    duration_seconds = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship('User', backref='breathing_sessions')


class EmotionalCheckin(Base):
    """Emotional weather reports / mood tracking."""
    __tablename__ = 'emotional_checkins'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, index=True)

    mood = Column(String(30), nullable=False)  # 'sunny', 'cloudy', 'rainy', 'stormy', 'foggy'
    energy_level = Column(Integer, nullable=True)  # 1-5
    note = Column(String(500), nullable=True)
    context = Column(String(50), nullable=True)  # 'morning', 'evening', 'pre_mediation', 'post_mediation'

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship('User', backref='emotional_checkins')


# Phase 2 tables (to be implemented later)

class Achievement(Base):
    """Achievement/badge definitions."""
    __tablename__ = 'achievements'

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # 'first_resolution', 'streak_7'
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    icon = Column(String(50), nullable=False)  # Emoji or icon name
    category = Column(String(50), nullable=False)  # 'communication', 'empathy', 'growth', 'commitment', 'mindfulness'

    # Unlock criteria
    criteria = Column(JSON, nullable=False)  # {"type": "count", "target": "resolutions", "value": 1}

    # Rewards
    xp_reward = Column(Integer, default=0, nullable=False)

    # Display
    rarity = Column(String(20), default='common', nullable=False)  # common, rare, epic, legendary
    sort_order = Column(Integer, default=0, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)  # Secret achievements

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserAchievement(Base):
    """User's earned achievements."""
    __tablename__ = 'user_achievements'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey('achievements.id', ondelete='CASCADE'),
                           nullable=False, index=True)

    unlocked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    claimed_at = Column(DateTime(timezone=True), nullable=True)  # When rewards claimed

    # Progress tracking for partial achievements
    progress = Column(Integer, default=0, nullable=False)  # e.g., 3/10 resolutions

    __table_args__ = (
        UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievement'),
    )

    # Relationships
    user = relationship('User', backref='achievements')
    achievement = relationship('Achievement', backref='user_achievements')


class DailyChallenge(Base):
    """Challenge definitions."""
    __tablename__ = 'daily_challenges'

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)

    # Requirements
    challenge_type = Column(String(20), nullable=False)  # 'daily', 'weekly'
    requirements = Column(JSON, nullable=False)  # {"action": "breathing", "count": 3}

    # Rewards
    score_reward = Column(Integer, default=0, nullable=False)

    # Availability
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserDailyChallenge(Base):
    """User's assigned challenges and progress."""
    __tablename__ = 'user_daily_challenges'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey('daily_challenges.id', ondelete='CASCADE'),
                         nullable=False, index=True)

    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship('User', backref='daily_challenges')
    challenge = relationship('DailyChallenge', backref='user_challenges')


# Phase 3 tables

class ConversionEvent(Base):
    """Track conversion opportunities and outcomes."""
    __tablename__ = 'conversion_events'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, index=True)

    trigger_type = Column(String(50), nullable=False)  # 'score_milestone', 'streak_risk', 'session_complete'
    trigger_value = Column(Integer, nullable=True)  # Score value or streak days
    offer_type = Column(String(50), nullable=True)  # 'trial_3day', 'trial_7day', 'discount_50'

    shown_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    converted = Column(Boolean, default=False, nullable=False)
    converted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship('User', backref='conversion_events')
