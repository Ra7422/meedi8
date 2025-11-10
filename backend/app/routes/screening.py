"""
Clinical Screening API Endpoints
Handles health profile creation, session screening, and risk assessment
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db import get_db
from app.models.user import User
from app.models.health_screening import UserHealthProfile, SessionScreening
from app.models.room import Room
from app.routes.auth import get_current_user
from app.schemas.screening import (
    HealthProfileCreate,
    HealthProfileUpdate,
    HealthProfileResponse,
    SessionScreeningCreate,
    SessionScreeningResponse,
    ScreeningCheckRequest,
    ScreeningCheckResponse,
    CompleteScreeningRequest,
    CompleteScreeningResponse,
)
from app.services.risk_assessment import (
    calculate_baseline_risk,
    calculate_session_risk,
    get_crisis_resources,
    get_warning_message,
    should_require_profile_update,
)

router = APIRouter(prefix="/screening", tags=["screening"])


@router.get("/check", response_model=ScreeningCheckResponse)
def check_screening_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if user has existing health profile or needs full screening.
    Called by frontend before showing screening form.
    """
    profile = db.query(UserHealthProfile).filter(
        UserHealthProfile.user_id == current_user.id
    ).first()

    if not profile:
        return ScreeningCheckResponse(
            needs_full_profile=True,
            has_existing_profile=False,
            profile=None,
            last_screening_date=None
        )

    # Check if profile needs update
    needs_update = should_require_profile_update(profile)

    return ScreeningCheckResponse(
        needs_full_profile=needs_update,
        has_existing_profile=True,
        profile=HealthProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            last_full_screening=profile.last_full_screening,
            needs_update=profile.needs_update,
            has_mental_health_condition=profile.has_mental_health_condition,
            mental_health_conditions=profile.mental_health_conditions or [],
            currently_in_treatment=profile.currently_in_treatment or False,
            treatment_types=profile.treatment_types or [],
            verbal_aggression_history=profile.verbal_aggression_history or "never",
            physical_aggression_history=profile.physical_aggression_history or "never",
            alcohol_use=profile.alcohol_use or "none",
            drug_use=profile.drug_use or "none",
            substance_details=profile.substance_details or [],
            feels_generally_safe=profile.feels_generally_safe if profile.feels_generally_safe is not None else True,
            has_safety_plan=profile.has_safety_plan or False,
            baseline_risk_level=profile.baseline_risk_level,
            risk_factors=profile.risk_factors or [],
            prefers_professional_mediator=profile.prefers_professional_mediator or False,
            comfortable_with_ai_mediation=profile.comfortable_with_ai_mediation if profile.comfortable_with_ai_mediation is not None else True,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        ),
        last_screening_date=profile.last_full_screening
    )


@router.post("/complete", response_model=CompleteScreeningResponse)
def complete_screening(
    request: CompleteScreeningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete full screening process:
    1. Create/update health profile
    2. Create session screening
    3. Calculate risk
    4. Return resources if needed

    This is the main endpoint called by the screening form.
    """
    # Verify room exists and user is participant
    room = db.query(Room).filter(Room.id == request.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant in this room")

    # Get or create health profile
    profile = db.query(UserHealthProfile).filter(
        UserHealthProfile.user_id == current_user.id
    ).first()

    if not profile and request.profile_data:
        # New user - create full profile
        profile = UserHealthProfile(
            user_id=current_user.id,
            has_mental_health_condition=request.profile_data.has_mental_health_condition,
            mental_health_conditions=request.profile_data.mental_health_conditions,
            condition_details=request.profile_data.condition_details,
            currently_in_treatment=request.profile_data.currently_in_treatment,
            treatment_types=request.profile_data.treatment_types,
            treatment_frequency=request.profile_data.treatment_frequency,
            has_crisis_plan=request.profile_data.has_crisis_plan,
            emergency_contact_available=request.profile_data.emergency_contact_available,
            verbal_aggression_history=request.profile_data.verbal_aggression_history,
            physical_aggression_history=request.profile_data.physical_aggression_history,
            last_aggression_incident=request.profile_data.last_aggression_incident,
            aggression_context=request.profile_data.aggression_context,
            alcohol_use=request.profile_data.alcohol_use,
            drug_use=request.profile_data.drug_use,
            substance_details=request.profile_data.substance_details,
            substances_affect_behavior=request.profile_data.substances_affect_behavior,
            feels_generally_safe=request.profile_data.feels_generally_safe,
            has_safety_plan=request.profile_data.has_safety_plan,
            safety_concerns=request.profile_data.safety_concerns,
            prefers_professional_mediator=request.profile_data.prefers_professional_mediator,
            comfortable_with_ai_mediation=request.profile_data.comfortable_with_ai_mediation,
        )

        # Calculate baseline risk
        baseline_risk, risk_factors = calculate_baseline_risk(profile)
        profile.baseline_risk_level = baseline_risk
        profile.risk_factors = risk_factors

        db.add(profile)
        db.flush()  # Get profile.id for session screening

    elif profile and request.profile_updates:
        # Returning user with changes - update profile
        for key, value in request.profile_updates.dict(exclude_unset=True).items():
            if hasattr(profile, key) and value is not None:
                setattr(profile, key, value)

        # Recalculate baseline risk
        baseline_risk, risk_factors = calculate_baseline_risk(profile)
        profile.baseline_risk_level = baseline_risk
        profile.risk_factors = risk_factors
        profile.needs_update = False

    elif not profile:
        raise HTTPException(
            status_code=400,
            detail="No profile data provided for new user"
        )

    # Create session screening
    session_screening = SessionScreening(
        room_id=request.room_id,
        user_id=current_user.id,
        health_profile_id=profile.id if profile else None,
        is_returning_user=(profile is not None and request.profile_updates is None),
        profile_still_accurate=request.session_data.profile_still_accurate,
        reported_changes=request.session_data.reported_changes,
        changes_description=request.session_data.changes_description,
        feeling_state=request.session_data.feeling_state,
        feels_safe_today=request.session_data.feels_safe_today,
        under_substance_influence=request.session_data.under_substance_influence,
        substance_influence_details=request.session_data.substance_influence_details,
        recent_crisis=request.session_data.recent_crisis,
        crisis_details=request.session_data.crisis_details,
        recent_aggression=request.session_data.recent_aggression,
        aggression_details=request.session_data.aggression_details,
        concerns_about_other_person=request.session_data.concerns_about_other_person,
        other_person_concerns=request.session_data.other_person_concerns,
        willing_to_proceed=request.session_data.willing_to_proceed,
    )

    # Calculate session risk
    baseline_risk = profile.baseline_risk_level if profile else "low"
    baseline_factors = profile.risk_factors if profile else []

    session_risk, risk_reasons, action = calculate_session_risk(
        session_screening,
        baseline_risk,
        baseline_factors
    )

    session_screening.session_risk_level = session_risk
    session_screening.risk_reasons = risk_reasons
    session_screening.screening_passed = (action != "blocked")
    session_screening.action_taken = action

    # Get appropriate resources
    resources = get_crisis_resources(risk_reasons)
    session_screening.resources_provided = [r["name"] for r in resources]

    db.add(session_screening)

    # Mark user as having completed screening (first-time user gate)
    if not current_user.has_completed_screening:
        current_user.has_completed_screening = True

    db.commit()
    db.refresh(session_screening)

    # Generate warning message
    warning_message = get_warning_message(session_risk, risk_reasons)

    # Determine if user can proceed
    can_proceed = (action != "blocked")

    return CompleteScreeningResponse(
        screening_passed=session_screening.screening_passed,
        session_risk_level=session_risk,
        baseline_risk_level=baseline_risk,
        risk_reasons=risk_reasons,
        action_taken=action,
        warning_message=warning_message,
        resources=resources,
        can_proceed=can_proceed,
        session_screening_id=session_screening.id,
        profile_id=profile.id if profile else None
    )


@router.get("/profile", response_model=Optional[HealthProfileResponse])
def get_health_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's current health profile"""
    profile = db.query(UserHealthProfile).filter(
        UserHealthProfile.user_id == current_user.id
    ).first()

    if not profile:
        return None

    return HealthProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        last_full_screening=profile.last_full_screening,
        needs_update=profile.needs_update,
        has_mental_health_condition=profile.has_mental_health_condition,
        mental_health_conditions=profile.mental_health_conditions or [],
        currently_in_treatment=profile.currently_in_treatment or False,
        treatment_types=profile.treatment_types or [],
        verbal_aggression_history=profile.verbal_aggression_history or "never",
        physical_aggression_history=profile.physical_aggression_history or "never",
        alcohol_use=profile.alcohol_use or "none",
        drug_use=profile.drug_use or "none",
        substance_details=profile.substance_details or [],
        feels_generally_safe=profile.feels_generally_safe if profile.feels_generally_safe is not None else True,
        has_safety_plan=profile.has_safety_plan or False,
        baseline_risk_level=profile.baseline_risk_level,
        risk_factors=profile.risk_factors or [],
        prefers_professional_mediator=profile.prefers_professional_mediator or False,
        comfortable_with_ai_mediation=profile.comfortable_with_ai_mediation if profile.comfortable_with_ai_mediation is not None else True,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put("/profile", response_model=HealthProfileResponse)
def update_health_profile(
    updates: HealthProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's health profile"""
    profile = db.query(UserHealthProfile).filter(
        UserHealthProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="No health profile found")

    # Update fields
    for key, value in updates.dict(exclude_unset=True).items():
        if hasattr(profile, key) and value is not None:
            setattr(profile, key, value)

    # Recalculate risk
    baseline_risk, risk_factors = calculate_baseline_risk(profile)
    profile.baseline_risk_level = baseline_risk
    profile.risk_factors = risk_factors
    profile.needs_update = False

    db.commit()
    db.refresh(profile)

    return HealthProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        last_full_screening=profile.last_full_screening,
        needs_update=profile.needs_update,
        has_mental_health_condition=profile.has_mental_health_condition,
        mental_health_conditions=profile.mental_health_conditions or [],
        currently_in_treatment=profile.currently_in_treatment or False,
        treatment_types=profile.treatment_types or [],
        verbal_aggression_history=profile.verbal_aggression_history or "never",
        physical_aggression_history=profile.physical_aggression_history or "never",
        alcohol_use=profile.alcohol_use or "none",
        drug_use=profile.drug_use or "none",
        substance_details=profile.substance_details or [],
        feels_generally_safe=profile.feels_generally_safe if profile.feels_generally_safe is not None else True,
        has_safety_plan=profile.has_safety_plan or False,
        baseline_risk_level=profile.baseline_risk_level,
        risk_factors=profile.risk_factors or [],
        prefers_professional_mediator=profile.prefers_professional_mediator or False,
        comfortable_with_ai_mediation=profile.comfortable_with_ai_mediation if profile.comfortable_with_ai_mediation is not None else True,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )
