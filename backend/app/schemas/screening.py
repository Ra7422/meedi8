from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date


# ===== USER HEALTH PROFILE SCHEMAS =====

class HealthProfileCreate(BaseModel):
    """Full clinical screening - completed by new users"""

    # Mental Health
    has_mental_health_condition: bool = False
    mental_health_conditions: List[str] = []  # ["anxiety", "depression", "ptsd", "bipolar", "other"]
    condition_details: Optional[str] = None

    currently_in_treatment: bool = False
    treatment_types: List[str] = []  # ["therapy", "medication", "support_group", "psychiatrist"]
    treatment_frequency: Optional[str] = None  # "weekly", "biweekly", "monthly", "as_needed"

    has_crisis_plan: bool = False
    emergency_contact_available: bool = False

    # Aggression History
    verbal_aggression_history: str = "never"  # "never", "past", "recent", "ongoing"
    physical_aggression_history: str = "never"  # "never", "past", "recent", "ongoing"
    last_aggression_incident: Optional[date] = None
    aggression_context: Optional[str] = None

    # Substance Use
    alcohol_use: str = "none"  # "none", "occasional", "regular", "daily", "concerned"
    drug_use: str = "none"  # "none", "occasional", "regular", "daily", "concerned"
    substance_details: List[str] = []  # ["alcohol", "cannabis", "prescription", "other"]
    substances_affect_behavior: bool = False

    # Safety
    feels_generally_safe: bool = True
    has_safety_plan: bool = False
    safety_concerns: Optional[str] = None

    # Preferences
    prefers_professional_mediator: bool = False
    comfortable_with_ai_mediation: bool = True


class HealthProfileUpdate(BaseModel):
    """Update existing health profile"""
    has_mental_health_condition: Optional[bool] = None
    mental_health_conditions: Optional[List[str]] = None
    condition_details: Optional[str] = None

    currently_in_treatment: Optional[bool] = None
    treatment_types: Optional[List[str]] = None
    treatment_frequency: Optional[str] = None

    has_crisis_plan: Optional[bool] = None
    emergency_contact_available: Optional[bool] = None

    verbal_aggression_history: Optional[str] = None
    physical_aggression_history: Optional[str] = None
    last_aggression_incident: Optional[date] = None
    aggression_context: Optional[str] = None

    alcohol_use: Optional[str] = None
    drug_use: Optional[str] = None
    substance_details: Optional[List[str]] = None
    substances_affect_behavior: Optional[bool] = None

    feels_generally_safe: Optional[bool] = None
    has_safety_plan: Optional[bool] = None
    safety_concerns: Optional[str] = None

    prefers_professional_mediator: Optional[bool] = None
    comfortable_with_ai_mediation: Optional[bool] = None


class HealthProfileResponse(BaseModel):
    id: int
    user_id: int
    last_full_screening: datetime
    needs_update: bool

    has_mental_health_condition: bool
    mental_health_conditions: List[str]
    currently_in_treatment: bool
    treatment_types: List[str]

    verbal_aggression_history: str
    physical_aggression_history: str

    alcohol_use: str
    drug_use: str
    substance_details: List[str]

    feels_generally_safe: bool
    has_safety_plan: bool

    baseline_risk_level: Optional[str] = None
    risk_factors: List[str]

    prefers_professional_mediator: bool
    comfortable_with_ai_mediation: bool

    created_at: datetime
    updated_at: Optional[datetime] = None


# ===== SESSION SCREENING SCHEMAS =====

class SessionScreeningCreate(BaseModel):
    """Quick check before each session"""
    room_id: int

    # For returning users
    is_returning_user: bool = False
    profile_still_accurate: Optional[bool] = None
    reported_changes: bool = False
    changes_description: Optional[str] = None

    # Current state (always asked)
    feeling_state: str  # "calm", "stressed", "angry", "anxious", "overwhelmed", "okay"
    feels_safe_today: bool = True
    under_substance_influence: bool = False
    substance_influence_details: Optional[str] = None

    recent_crisis: bool = False  # Last 48 hours
    crisis_details: Optional[str] = None

    recent_aggression: bool = False  # Last 7 days
    aggression_details: Optional[str] = None

    concerns_about_other_person: bool = False
    other_person_concerns: Optional[str] = None

    willing_to_proceed: bool = True


class SessionScreeningResponse(BaseModel):
    id: int
    room_id: int
    user_id: int

    is_returning_user: bool
    feeling_state: str
    feels_safe_today: bool
    under_substance_influence: bool

    session_risk_level: str  # "low", "medium", "high", "critical"
    risk_reasons: List[str]

    screening_passed: bool
    action_taken: str  # "approved", "warned_and_approved", "resources_provided", "blocked"
    resources_provided: List[str]

    screened_at: datetime


# ===== COMBINED SCREENING FLOW =====

class ScreeningCheckRequest(BaseModel):
    """Request to check if user needs full screening or quick check"""
    room_id: int


class ScreeningCheckResponse(BaseModel):
    """Tells frontend whether user needs full profile or quick check"""
    needs_full_profile: bool  # True = new user, False = returning user
    has_existing_profile: bool
    profile: Optional[HealthProfileResponse] = None
    last_screening_date: Optional[datetime] = None


class CompleteScreeningRequest(BaseModel):
    """Combined request for creating/updating profile + session screening"""
    room_id: int

    # Full profile (for new users) OR updates (for returning users)
    profile_data: Optional[HealthProfileCreate] = None
    profile_updates: Optional[HealthProfileUpdate] = None

    # Session-specific data (always required)
    session_data: SessionScreeningCreate


class CompleteScreeningResponse(BaseModel):
    """Result of complete screening process"""
    screening_passed: bool
    session_risk_level: str
    baseline_risk_level: Optional[str] = None

    risk_reasons: List[str]
    action_taken: str  # "approved", "warned_and_approved", "resources_provided", "blocked"

    warning_message: Optional[str] = None
    resources: List[dict]  # [{"type": "crisis_hotline", "name": "...", "phone": "...", "url": "..."}]

    can_proceed: bool
    session_screening_id: int
    profile_id: Optional[int] = None


# ===== CRISIS RESOURCES =====

class CrisisResource(BaseModel):
    type: str  # "hotline", "text_line", "website", "app", "therapist_finder"
    name: str
    description: str
    phone: Optional[str] = None
    text_number: Optional[str] = None
    url: Optional[str] = None
    available: str  # "24/7", "business_hours", "Mon-Fri 9am-5pm"
    languages: List[str] = ["English"]
