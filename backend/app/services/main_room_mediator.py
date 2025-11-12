"""
Main Room AI Mediator
Guides turn-based conversation between both users after pre-mediation coaching
"""
import os
from typing import Dict, List, Optional
from anthropic import Anthropic
from app.config import settings

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

MAIN_ROOM_MEDIATOR_PROMPT = """You are a warm, skilled mediator helping two people resolve a conflict.

CONTEXT:
Both people have already identified their feelings and needs using Nonviolent Communication. They've done individual coaching and are ready to talk directly.

YOUR ROLE:
- Guide them toward concrete solutions that work for BOTH
- Match their energy - if they're casual, be casual; if formal, be professional
- Keep it conversational and human (not therapy-speak)
- One focused question at a time
- Celebrate small wins ("I'm hearing progress here...")

TURN-TAKING:
After each person speaks, ask the OTHER person to respond. Keep the conversation flowing back and forth. When you want to dig deeper with someone, wait until it's their turn again.

MEDIATION APPROACH:

1. **Find Common Ground** - Point out what they both need ("You both want respect/fairness/peace")
2. **Reframe Attacks** - Turn "You're lazy" into "You need more follow-through"
3. **Ask Specific Questions** - "What ONE thing would make this better?" not "How do you feel?"
4. **Validate Feelings** - "I hear your frustration" before redirecting
5. **Build Solutions Together** - "What would work for BOTH of you?"
6. **Make It Concrete** - Who does what, by when? How will you know it's working?

STYLE:
- Short responses (under 40 words)
- Use their names naturally ("Dave, what would help here?")
- Mirror their tone (if casual, be casual)
- Sound like a helpful friend, not a therapist
- Acknowledge progress ("I'm seeing movement here")
- Make suggestions when stuck ("What if you tried...")

WHEN THINGS GET HEATED:
Only trigger breathing breaks for REAL escalation patterns:
- Profanity or cursing (f***, sh**, damn, etc.)
- Contempt (mockery, sarcasm, eye-rolling language)
- Yelling indicators (ALL CAPS, multiple exclamation marks!!!)
- Severe personal attacks ("you're manipulative/abusive/horrible")
- Bringing up unrelated past hurts to attack character

For mild conflict (frustrated tone, words like "lazy", single complaints) → continue mediating normally

When you detect real escalation:
→ BREATHING_BREAK: [Brief acknowledgment of intensity]. Let's pause and breathe before continuing.

If 5+ breaks happen, suggest stopping for today:
→ HALT: We've taken several breaks. It might help to return tomorrow when you're both calmer.

WHEN TO END THE SESSION:
→ RESOLUTION: [Who does what, by when] - Only when they've agreed to specific, concrete actions

REMEMBER: You're here to help them find THEIR solution. Make suggestions when they're stuck. Keep it fun, friendly, and solution-focused.
"""

def start_main_room(user1_summary: str, user2_summary: str, user1_name: str, user2_name: str, category: str = None) -> Dict:
    """
    Start main room with opening message that acknowledges both perspectives.

    Args:
        user1_summary: NVC summary from user 1
        user2_summary: NVC summary from user 2
        user1_name: Name of user 1
        user2_name: Name of user 2
        category: Conflict category (work, family, romance, money, other) for contextual guidance

    Returns:
        Dict with opening_message and who speaks first
    """

    # Category-specific context
    category_guidance = {
        "work": "Work conflicts often involve expectations, recognition, and professional boundaries. Look for: differing work styles, communication gaps, or unspoken expectations about collaboration.",
        "family": "Family conflicts carry deep history and attachment. Look for: generational patterns, unmet childhood needs, or different expressions of love/care.",
        "romance": "Romantic conflicts often stem from intimacy needs and attachment styles. Look for: bids for connection, emotional safety, or differences in showing love.",
        "money": "Money conflicts are rarely about money - they're about security, values, control, or respect. Look for: different upbringings with money, fear of scarcity, or autonomy needs.",
        "other": "This conflict may involve multiple life areas. Look for: underlying patterns, power dynamics, or competing values."
    }

    context_note = category_guidance.get(category, "") if category else ""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=600,
            system=MAIN_ROOM_MEDIATOR_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"""Two people are entering mediation about a {category or 'personal'} conflict. Here are their prepared perspectives:

**{user1_name} (Person 1):** {user1_summary}

**{user2_name} (Person 2):** {user2_summary}

{f"**CONTEXT:** {context_note}" if context_note else ""}

Create a warm opening (80-100 words):

1. Welcome them - acknowledge they've both prepared
2. Outline the process - share perspectives, find common ground, create solutions
3. Share ONE insight from their summaries - something one might not realize about the other
4. Ask {user1_name} a specific question to start (they will speak first)

IMPORTANT: End your opening by asking {user1_name} a question. They go first.

Example: "I notice one of you mentioned trying hard but feeling unappreciated, while the other feels nagged. It sounds like you're both trying to show love in different ways. {user1_name}, what does a 'cared-for home' mean to you?"

Keep it natural and conversational."""
                }
            ]
        )
        
        opening = response.content[0].text
        
        return {
            "opening_message": opening,
            "first_speaker": "user1"
        }
        
    except Exception as e:
        print(f"Main room start error: {e}")
        return {
            "opening_message": f"Welcome to the conversation. {user1_name}, would you like to start by sharing your perspective?",
            "first_speaker": "user1"
        }


def process_main_room_response(
    conversation_history: List[Dict],
    user_message: str,
    user_name: str,
    other_user_name: str,
    exchange_count: int,
    consecutive_questions_to_same_user: int = 0,
    breathing_break_count: int = 0
) -> Dict:
    """
    Process user response in main room and generate AI guidance.

    Args:
        conversation_history: Full conversation [{role, content}]
        user_message: Current user's message
        user_name: Name of current speaker
        other_user_name: Name of other person
        exchange_count: Number of exchanges so far
        consecutive_questions_to_same_user: Not used (kept for API compatibility)
        breathing_break_count: Number of breathing breaks taken so far

    Returns:
        Dict with ai_response, resolution (if reached), halt signal, or breathing_break
    """

    # Add current message to history
    messages = conversation_history + [
        {"role": "user", "content": f"{user_name}: {user_message}"}
    ]

    # Include breathing break count in instruction
    breathing_status = ""
    if breathing_break_count >= 5:
        breathing_status = f"\n\nWARNING: This session has already had {breathing_break_count} breathing breaks. If you detect escalation again, suggest HALT instead of another breathing break."
    elif breathing_break_count > 0:
        breathing_status = f"\n\nNote: This session has had {breathing_break_count} breathing break(s) so far."

    mode_instruction = f"""After {user_name} spoke, you need to decide who speaks next.{breathing_status}

DECISION POINT - Choose ONE approach:

**OPTION A - SWITCH to {other_user_name}** (Most common - use this 80% of the time)
- When you want to hear {other_user_name}'s reaction to what {user_name} just said
- When it's important to maintain balanced conversation flow
- When you've already asked {user_name} 1-2 questions in a row
Format: NEXT_SPEAKER: OTHER
Then ask {other_user_name} a question (under 40 words)

**OPTION B - STAY with {user_name}** (Only when truly needed for clarity)
- When {user_name} said something vague/incomplete that needs immediate clarification
- When you need to understand {user_name}'s deeper feelings before moving on
- When {user_name} hinted at something important but didn't fully express it
- LIMIT: Maximum 2 follow-up questions to same person before switching
Format: NEXT_SPEAKER: SAME
Then ask {user_name} a clarifying question (under 40 words)

**SPECIAL RESPONSES:**
- Breathing break needed: BREATHING_BREAK: [message]
- Agreement reached: RESOLUTION: [summary]
- Too many breaks/can't proceed: HALT: [reason]

**EXAMPLE RESPONSES:**

Example 1 (switching - most common):
```
NEXT_SPEAKER: OTHER
{other_user_name}, when you hear {user_name} say they feel unappreciated - what's your reaction to that?
```

Example 2 (staying for clarity - rare):
```
NEXT_SPEAKER: SAME
{user_name}, when you say "it bothers me" - can you say more about what specifically bothers you?
```

**CRITICAL:** Start your response with "NEXT_SPEAKER: SAME" or "NEXT_SPEAKER: OTHER" so the system knows who speaks next."""

    # Add instruction for AI
    messages.append({
        "role": "user",
        "content": f"""Exchange {exchange_count}.

{mode_instruction}"""
    })
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=MAIN_ROOM_MEDIATOR_PROMPT,
            messages=messages
        )
        
        ai_message = response.content[0].text

        # Parse NEXT_SPEAKER decision (NEW)
        next_speaker = "OTHER"  # Default to switching
        if "NEXT_SPEAKER: SAME" in ai_message:
            next_speaker = "SAME"
            # Remove the directive from the message shown to users
            ai_message = ai_message.replace("NEXT_SPEAKER: SAME", "").strip()
        elif "NEXT_SPEAKER: OTHER" in ai_message:
            next_speaker = "OTHER"
            # Remove the directive from the message shown to users
            ai_message = ai_message.replace("NEXT_SPEAKER: OTHER", "").strip()

        # Check for breathing break suggestion
        if "BREATHING_BREAK:" in ai_message:
            # Extract breathing break message
            breathing_message = ai_message.split("BREATHING_BREAK:", 1)[1].strip()
            return {
                "breathing_break": True,
                "ai_response": breathing_message,
                "session_complete": False,
                "next_speaker": "BOTH"  # Both users see the breathing modal
            }

        # Check for resolution (handle markdown bold)
        if "RESOLUTION:" in ai_message:
            # Strip markdown and extract resolution
            resolution = ai_message.split("RESOLUTION:", 1)[1].strip()
            # Remove any remaining markdown asterisks
            resolution = resolution.replace("**", "")
            return {
                "resolution": resolution,
                "session_complete": True,
                "next_speaker": next_speaker
            }

        # Check for halt
        if ai_message.startswith("HALT:"):
            reason = ai_message.replace("HALT:", "").strip()
            return {
                "ai_response": f"Let's pause here. {reason}",
                "session_complete": True,
                "next_speaker": next_speaker
            }

        # Continue conversation - always switch to other person
        return {
            "ai_response": ai_message,
            "session_complete": False,
            "next_speaker": next_speaker
        }

    except Exception as e:
        print(f"Main room response error: {e}")

        # Fallback - always switch to other speaker
        fallback_next_speaker = "OTHER"
        fallback_message = f"{other_user_name}, how do you respond to what {user_name} shared?"

        return {
            "ai_response": fallback_message,
            "session_complete": False,
            "next_speaker": fallback_next_speaker
        }
