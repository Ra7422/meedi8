from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base


class UserHealthProfile(Base):
    """
    Baseline health profile created on first screening.
    Updated when user indicates changes or every 3 months.
    """
    __tablename__ = 'user_health_profiles'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)

    # Screening metadata
    last_full_screening = Column(DateTime(timezone=True), server_default=func.now())
    needs_update = Column(Boolean, default=False)  # Flag to prompt re-screening

    # Mental Health
    has_mental_health_condition = Column(Boolean, default=False)
    mental_health_conditions = Column(JSON, default=list)  # ["anxiety", "depression", "ptsd", "bipolar", "other"]
    condition_details = Column(Text, nullable=True)  # Optional: specific diagnoses

    currently_in_treatment = Column(Boolean, default=False)
    treatment_types = Column(JSON, default=list)  # ["therapy", "medication", "support_group", "psychiatrist"]
    treatment_frequency = Column(String(50), nullable=True)  # "weekly", "biweekly", "monthly", "as_needed"

    has_crisis_plan = Column(Boolean, default=False)
    emergency_contact_available = Column(Boolean, default=False)

    # History of Aggression
    verbal_aggression_history = Column(String(20))  # "never", "past", "recent", "ongoing"
    physical_aggression_history = Column(String(20))  # "never", "past", "recent", "ongoing"
    last_aggression_incident = Column(Date, nullable=True)
    aggression_context = Column(Text, nullable=True)  # Optional: circumstances

    # Substance Use
    alcohol_use = Column(String(20))  # "none", "occasional", "regular", "daily", "concerned"
    drug_use = Column(String(20))  # "none", "occasional", "regular", "daily", "concerned"
    substance_details = Column(JSON, default=list)  # ["alcohol", "cannabis", "prescription", "other"]
    substances_affect_behavior = Column(Boolean, default=False)

    # Safety Assessment
    feels_generally_safe = Column(Boolean, default=True)
    has_safety_plan = Column(Boolean, default=False)
    safety_concerns = Column(Text, nullable=True)

    # Risk Level (auto-calculated)
    baseline_risk_level = Column(String(20))  # "low", "medium", "high"
    risk_factors = Column(JSON, default=list)  # List of identified risk factors

    # Preferences
    prefers_professional_mediator = Column(Boolean, default=False)
    comfortable_with_ai_mediation = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship('User', back_populates='health_profile')
    session_screenings = relationship('SessionScreening', back_populates='health_profile', cascade='all, delete-orphan')


class SessionScreening(Base):
    """
    Session-specific screening check before each mediation.
    Quick update for returning users, full screening for new users.
    """
    __tablename__ = 'session_screenings'

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey('rooms.id', ondelete='CASCADE'), nullable=True, index=True)  # Nullable for first-time screening
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    health_profile_id = Column(Integer, ForeignKey('user_health_profiles.id', ondelete='SET NULL'), nullable=True)

    # Quick check for returning users
    is_returning_user = Column(Boolean, default=False)
    profile_still_accurate = Column(Boolean, nullable=True)
    reported_changes = Column(Boolean, default=False)
    changes_description = Column(Text, nullable=True)

    # Current state (asked every session)
    feeling_state = Column(String(20))  # "calm", "stressed", "angry", "anxious", "overwhelmed", "okay"
    feels_safe_today = Column(Boolean, default=True)
    under_substance_influence = Column(Boolean, default=False)
    substance_influence_details = Column(Text, nullable=True)

    recent_crisis = Column(Boolean, default=False)  # Last 48 hours
    crisis_details = Column(Text, nullable=True)

    recent_aggression = Column(Boolean, default=False)  # Last 7 days
    aggression_details = Column(Text, nullable=True)

    # Session-specific safety
    concerns_about_other_person = Column(Boolean, default=False)
    other_person_concerns = Column(Text, nullable=True)

    willing_to_proceed = Column(Boolean, default=True)

    # Risk Assessment (auto-calculated from profile + session data)
    session_risk_level = Column(String(20))  # "low", "medium", "high", "critical"
    risk_reasons = Column(JSON, default=list)  # Specific reasons for risk level

    # Outcome
    screening_passed = Column(Boolean, default=True)
    action_taken = Column(String(50))  # "approved", "warned_and_approved", "resources_provided", "blocked"
    resources_provided = Column(JSON, default=list)  # Crisis hotlines, therapist referrals, etc.

    # Timestamps
    screened_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    health_profile = relationship('UserHealthProfile', back_populates='session_screenings')
    room = relationship('Room')
    user = relationship('User')
