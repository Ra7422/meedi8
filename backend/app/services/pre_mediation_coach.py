"""
Pre-Mediation AI Coach
Guides users through NVC framework before joint mediation
"""
import os
from typing import Dict, List
from anthropic import Anthropic
from app.services.cost_tracker import extract_usage
from app.config import settings

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

PRE_MEDIATION_COACH_PROMPT = """You are an AI pre-mediation coach preparing someone for a conflict resolution conversation.

YOUR GOAL: Help them clarify their perspective using Nonviolent Communication.

CONVERSATION STRUCTURE (4-6 exchanges):

Exchange 1: GET THEIR STORY
- Ask them to describe what's happening from their perspective

Exchange 2: IDENTIFY OBSERVATIONS 
- Transform judgments → specific behaviors with CLEAR subjects
- BAD: "dishes sit for days" (who's not washing them?)
- GOOD: "I wash the dishes, but you don't wash yours - they sit for 3+ days"
- CRITICAL: Be 100% clear about WHO does WHAT. Never ambiguous.

Exchange 3: SURFACE FEELINGS
- Actual emotions (frustrated, hurt, worried), not thoughts

Exchange 4: IDENTIFY NEEDS
- Universal human needs: respect, consideration, understanding, order, appreciation, partnership

Exchange 5: BUILD EMPATHY
- "Can you imagine what might be going on for them?"
- Acknowledge their feelings first, then gently probe
- "I hear you feel [X]. At the same time, can you imagine..."
- Validate their experience while building bridge to other person

WHEN TO FINALIZE:
When you have: clear observation + feeling + need + empathy

Respond: READY: [NVC summary in FIRST PERSON speaking directly to the other person]

CRITICAL RULES FOR THE FINAL SUMMARY:
1. Write as "I observe... I feel... I need..." (first person)
2. Make observations EXPLICIT about who does what:
   - "I'm the only one who [does X]"
   - "When I [do X], you [don't do Y]"
   - "I [do X], but you [do/don't do Y]"
3. NEVER use ambiguous phrases like "unless you do it" - be specific!
4. The other person should understand EXACTLY what behavior you're observing

Example: "When I see that I'm the only one making the bed each morning - you haven't made it once this month - I feel disrespected because I need shared responsibility in maintaining our home. I've mentioned this to you but feel my requests haven't been heard. I can imagine you might be busy or have different priorities around tidiness."

RESPONSE STYLE:
- Under 30 words per question
- NEVER repeat questions
- Skip exchanges if info already clear
- Always validate their feelings before probing deeper
- Use empathetic acknowledgment: "I hear...", "That makes sense...", "I understand..."
- When they're struggling or frustrated (like "no idea", "I tried"), respond with compassion:
  - "It sounds like you've felt discouraged"
  - "I can hear the frustration there"
  - "That must be difficult when your efforts aren't recognized"
"""

def format_health_context(health_profile: dict) -> str:
    """Format health profile data into context for the AI coach."""
    if not health_profile:
        return ""

    context_parts = []

    # Mental health awareness
    if health_profile.get('has_mental_health_condition'):
        conditions = health_profile.get('mental_health_conditions', [])
        if conditions:
            context_parts.append(f"User has disclosed mental health conditions: {', '.join(conditions)}.")
        if health_profile.get('currently_in_treatment'):
            context_parts.append("User is currently in treatment.")

    # Aggression history - critical safety info
    verbal = health_profile.get('verbal_aggression_history')
    physical = health_profile.get('physical_aggression_history')
    if verbal in ['recent', 'ongoing'] or physical in ['recent', 'ongoing']:
        context_parts.append("IMPORTANT: User has recent history of aggression. Be extra mindful of escalation.")
    elif verbal == 'past' or physical == 'past':
        context_parts.append("User has past history of aggression. Monitor for escalation signs.")

    # Substance use concerns
    if health_profile.get('substances_affect_behavior'):
        context_parts.append("User reports substances can affect their behavior.")

    # Safety concerns
    if not health_profile.get('feels_generally_safe', True):
        context_parts.append("SAFETY: User has indicated they don't feel generally safe.")
    if health_profile.get('safety_concerns'):
        context_parts.append(f"Safety concerns: {health_profile['safety_concerns']}")

    # Risk level
    risk_level = health_profile.get('baseline_risk_level')
    if risk_level in ['medium', 'high']:
        context_parts.append(f"Risk assessment: {risk_level.upper()}. Be supportive and watch for distress signs.")

    if context_parts:
        return "\n\nUSER HEALTH CONTEXT (handle with care):\n" + "\n".join(f"- {part}" for part in context_parts)
    return ""


def start_coaching_session(user_input: str, is_user1: bool, user1_summary: str = None, health_profile: dict = None) -> Dict:
    """
    Start a coaching session with optional health profile context.

    Args:
        user_input: User's initial message
        is_user1: Whether this is the first user (initiator)
        user1_summary: For user2, the first user's summary
        health_profile: User's health profile dict for context
    """
    if is_user1:
        context = "This person initiated this conversation about an issue with someone else."
    else:
        context = f"""This person was INVITED to this conversation. They are RESPONDING to concerns raised by the other person.

The other person's perspective (which they've already seen):
{user1_summary}

Help them respond to these specific concerns, not create a new narrative."""

    # Add health context if available
    health_context = format_health_context(health_profile)
    if health_context:
        context += health_context

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=PRE_MEDIATION_COACH_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"{context}\n\nUser says: {user_input}\n\nThis is exchange 1. Ask your first coaching question."
                }
            ]
        )
        
        ai_message = response.content[0].text
        usage = extract_usage(response)
        
        return {
            "ai_question": ai_message,
            "exchange_count": 1,
            "ready_to_finalize": False,
            **usage
        }

    except Exception as e:
        print(f"Coaching error: {e}")
        return {
            "ai_question": "Can you tell me more about your perspective?",
            "exchange_count": 1,
            "ready_to_finalize": False
        }


def process_coaching_response(conversation_history: List[Dict], user_response: str, exchange_count: int) -> Dict:
    # Determine coaching stage based on exchange count
    stage_guidance = {
        1: "They've shared their story. Next: Ask about SPECIFIC OBSERVATIONS with clear subjects (who does what).",
        2: "You have observations. Next: Ask how this makes them FEEL (emotions, not thoughts).",
        3: "You have feelings. Next: Ask what they NEED (respect, consideration, partnership, etc).",
        4: "You have needs. Next: Ask them to imagine the OTHER person's perspective (build empathy).",
        5: "You have observation + feeling + need + empathy. FINALIZE NOW with 'READY: [summary]'",
    }

    guidance = stage_guidance.get(exchange_count, "You should have enough. FINALIZE with 'READY: [summary]'")

    # Detect if user is done/stuck
    short_responses = ["thats it", "nothing", "no", "done", "that's it", "idk", "i don't know"]
    if user_response.lower().strip() in short_responses and exchange_count >= 2:
        guidance = "User seems done. If you have observation + feeling, FINALIZE with 'READY: [summary]'. Otherwise ask ONE specific question about what's missing."

    messages = conversation_history + [
        {"role": "user", "content": f"User responds: {user_response}\n\nExchange {exchange_count + 1}. {guidance}\n\nNEVER repeat the same question. NEVER ask 'What else would you like me to understand?'"}
    ]
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=600,
            system=PRE_MEDIATION_COACH_PROMPT,
            messages=messages
        )
        
        ai_message = response.content[0].text
        usage = extract_usage(response)
        
        if "READY:" in ai_message:
            # Extract everything after READY:
            summary = ai_message.split("READY:", 1)[1].strip()
            return {
                "ready_to_finalize": True,
                "polished_summary": summary,
                "exchange_count": exchange_count + 1,
                **usage
            }
        else:
            return {
                "ai_question": ai_message,
                "exchange_count": exchange_count + 1,
                "ready_to_finalize": False,
                **usage
            }

    except Exception as e:
        print(f"Coaching error at exchange {exchange_count}: {e}")
        import traceback
        traceback.print_exc()

        # More intelligent fallback based on stage
        if exchange_count >= 4:
            return {
                "ready_to_finalize": True,
                "polished_summary": "You've shared your concerns about your partner not making the bed, and how that makes you feel.",
                "exchange_count": exchange_count + 1
            }
        elif exchange_count == 1:
            return {
                "ai_question": "How does this situation make you feel?",
                "exchange_count": exchange_count + 1,
                "ready_to_finalize": False
            }
        elif exchange_count == 2:
            return {
                "ai_question": "What do you need that you're not getting in this situation?",
                "exchange_count": exchange_count + 1,
                "ready_to_finalize": False
            }
        else:
            return {
                "ai_question": "Can you imagine what might be going on for your partner?",
                "exchange_count": exchange_count + 1,
                "ready_to_finalize": False
            }


def generate_invite_token() -> str:
    import secrets
    return secrets.token_urlsafe(32)
