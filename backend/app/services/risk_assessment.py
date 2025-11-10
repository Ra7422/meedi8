"""
Clinical Risk Assessment Service
Evaluates user safety and suitability for AI-mediated conflict resolution
"""
from typing import List, Tuple
from datetime import datetime, timedelta
from app.models.health_screening import UserHealthProfile, SessionScreening


def calculate_baseline_risk(profile: UserHealthProfile) -> Tuple[str, List[str]]:
    """
    Calculate baseline risk level from user health profile.

    Returns:
        Tuple of (risk_level, risk_factors)
        risk_level: "low", "medium", "high"
        risk_factors: List of identified concerns
    """
    risk_factors = []
    risk_score = 0  # 0-2 = low, 3-5 = medium, 6+ = high

    # Mental Health Assessment
    if profile.has_mental_health_condition:
        if not profile.currently_in_treatment:
            risk_factors.append("untreated_mental_health")
            risk_score += 2
        else:
            risk_factors.append("mental_health_in_treatment")
            risk_score += 1

        # Check for high-risk conditions
        high_risk_conditions = ["bipolar", "ptsd", "psychosis", "schizophrenia"]
        if any(cond in profile.mental_health_conditions for cond in high_risk_conditions):
            risk_factors.append("high_risk_mental_health_condition")
            risk_score += 1

        if not profile.has_crisis_plan and not profile.emergency_contact_available:
            risk_factors.append("no_crisis_support")
            risk_score += 2

    # Aggression History
    if profile.physical_aggression_history in ["recent", "ongoing"]:
        risk_factors.append("recent_physical_aggression")
        risk_score += 3

    if profile.verbal_aggression_history == "ongoing":
        risk_factors.append("ongoing_verbal_aggression")
        risk_score += 1

    if profile.last_aggression_incident:
        days_since = (datetime.now().date() - profile.last_aggression_incident).days
        if days_since < 30:
            risk_factors.append("very_recent_aggression")
            risk_score += 2

    # Substance Use
    if profile.alcohol_use in ["daily", "concerned"]:
        risk_factors.append("problematic_alcohol_use")
        risk_score += 2
    elif profile.alcohol_use == "regular":
        risk_factors.append("regular_alcohol_use")
        risk_score += 1

    if profile.drug_use in ["regular", "daily", "concerned"]:
        risk_factors.append("problematic_drug_use")
        risk_score += 2

    if profile.substances_affect_behavior:
        risk_factors.append("substance_affects_behavior")
        risk_score += 1

    # Safety Concerns
    if not profile.feels_generally_safe:
        risk_factors.append("safety_concerns")
        risk_score += 2

    if not profile.has_safety_plan and not profile.feels_generally_safe:
        risk_factors.append("unsafe_without_plan")
        risk_score += 1

    # Determine risk level
    if risk_score >= 6:
        risk_level = "high"
    elif risk_score >= 3:
        risk_level = "medium"
    else:
        risk_level = "low"

    return risk_level, risk_factors


def calculate_session_risk(
    session: SessionScreening,
    baseline_risk_level: str,
    baseline_risk_factors: List[str]
) -> Tuple[str, List[str], str]:
    """
    Calculate session-specific risk combining baseline + current state.

    Returns:
        Tuple of (risk_level, risk_reasons, action)
        risk_level: "low", "medium", "high", "critical"
        risk_reasons: Combined list of baseline + session concerns
        action: "approved", "warned_and_approved", "resources_provided", "blocked"
    """
    risk_reasons = baseline_risk_factors.copy()
    session_score = 0

    # Map baseline risk to score
    baseline_scores = {"low": 0, "medium": 3, "high": 6}
    session_score = baseline_scores.get(baseline_risk_level, 0)

    # Current State Assessment
    if session.under_substance_influence:
        risk_reasons.append("currently_under_influence")
        session_score += 5  # Major concern

    if session.recent_crisis:  # Last 48 hours
        risk_reasons.append("recent_crisis_48h")
        session_score += 4

    if session.recent_aggression:  # Last 7 days
        risk_reasons.append("recent_aggression_7d")
        session_score += 3

    if not session.feels_safe_today:
        risk_reasons.append("doesnt_feel_safe_today")
        session_score += 3

    if session.concerns_about_other_person:
        risk_reasons.append("concerns_about_other_person")
        session_score += 2

    # Emotional state
    high_risk_emotions = ["overwhelmed", "angry"]
    if session.feeling_state in high_risk_emotions:
        risk_reasons.append(f"feeling_{session.feeling_state}")
        session_score += 1

    if not session.willing_to_proceed:
        risk_reasons.append("not_willing_to_proceed")
        session_score += 2

    # Determine risk level and action
    if session_score >= 10:
        risk_level = "critical"
        action = "blocked"
    elif session_score >= 6:
        risk_level = "high"
        action = "resources_provided"  # Can proceed but must review resources
    elif session_score >= 3:
        risk_level = "medium"
        action = "warned_and_approved"
    else:
        risk_level = "low"
        action = "approved"

    return risk_level, risk_reasons, action


def get_crisis_resources(risk_reasons: List[str]) -> List[dict]:
    """
    Return appropriate crisis resources based on identified risks.

    Returns:
        List of resource dictionaries
    """
    resources = []

    # Always include general crisis line
    resources.append({
        "type": "hotline",
        "name": "National Crisis Hotline",
        "description": "24/7 confidential support for anyone in crisis",
        "phone": "988",
        "text_number": "Text HOME to 741741",
        "url": "https://988lifeline.org",
        "available": "24/7",
        "languages": ["English", "Spanish"]
    })

    # Mental health specific
    if any("mental_health" in reason for reason in risk_reasons):
        resources.append({
            "type": "hotline",
            "name": "SAMHSA National Helpline",
            "description": "Mental health and substance abuse support",
            "phone": "1-800-662-4357",
            "url": "https://www.samhsa.gov/find-help/national-helpline",
            "available": "24/7",
            "languages": ["English", "Spanish"]
        })

    # Crisis-specific
    if "recent_crisis" in risk_reasons or "crisis" in str(risk_reasons):
        resources.append({
            "type": "text_line",
            "name": "Crisis Text Line",
            "description": "Text-based crisis support",
            "text_number": "Text HOME to 741741",
            "url": "https://www.crisistextline.org",
            "available": "24/7",
            "languages": ["English", "Spanish"]
        })

    # Domestic violence / safety concerns
    if any("safe" in reason or "aggression" in reason for reason in risk_reasons):
        resources.append({
            "type": "hotline",
            "name": "National Domestic Violence Hotline",
            "description": "Support for domestic violence situations",
            "phone": "1-800-799-7233",
            "text_number": "Text START to 88788",
            "url": "https://www.thehotline.org",
            "available": "24/7",
            "languages": ["English", "Spanish", "200+ via interpretation"]
        })

    # Substance abuse
    if any("substance" in reason or "alcohol" in reason or "drug" in reason for reason in risk_reasons):
        resources.append({
            "type": "hotline",
            "name": "SAMHSA Substance Abuse Helpline",
            "description": "Confidential substance abuse support and referrals",
            "phone": "1-800-662-4357",
            "url": "https://www.samhsa.gov/find-treatment",
            "available": "24/7",
            "languages": ["English", "Spanish"]
        })

    # Therapist finder (for all medium/high risk)
    resources.append({
        "type": "website",
        "name": "Psychology Today - Find a Therapist",
        "description": "Search for licensed therapists in your area",
        "url": "https://www.psychologytoday.com/us/therapists",
        "available": "Online directory",
        "languages": ["English"]
    })

    return resources


def get_warning_message(risk_level: str, risk_reasons: List[str]) -> str:
    """
    Generate appropriate warning message based on risk level.

    Returns:
        Human-readable warning message
    """
    if risk_level == "critical":
        return (
            "Based on your responses, we're concerned about your safety and wellbeing. "
            "We recommend speaking with a mental health professional before proceeding with mediation. "
            "Please review the crisis resources below and reach out for support. "
            "Mediation can resume once you're in a safer, more stable place."
        )

    elif risk_level == "high":
        return (
            "We've identified some concerns that may affect your safety during mediation. "
            "Please review the resources below and ensure you have support available. "
            "You can proceed, but we strongly recommend having a crisis plan in place. "
            "Consider reaching out to a mental health professional for additional support."
        )

    elif risk_level == "medium":
        return (
            "We want to make sure you're in the best place for a productive conversation. "
            "Based on your responses, we recommend having support available during this mediation. "
            "If at any point you feel unsafe or overwhelmed, please use the break button or end the session."
        )

    else:  # low
        return None


def should_require_profile_update(profile: UserHealthProfile) -> bool:
    """
    Determine if user should update their health profile.

    Re-screening required if:
    - More than 3 months since last full screening
    - Profile is flagged as needing update

    Returns:
        Boolean indicating if update is required
    """
    if profile.needs_update:
        return True

    if profile.last_full_screening:
        days_since = (datetime.now() - profile.last_full_screening.replace(tzinfo=None)).days
        if days_since > 90:  # 3 months
            return True

    return False
