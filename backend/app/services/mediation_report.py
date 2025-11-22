"""
Professional Mediation Report Generation Service
Uses OpenAI GPT-4 to create comprehensive post-mediation assessments
"""
from typing import Dict, List, Optional
from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Professional mediation report prompt
MEDIATION_REPORT_PROMPT = """You are a licensed family mediator and relationship counselor creating a comprehensive post-mediation report. Analyze the mediation session including both parties' individual coaching and their joint mediation conversation.

Create a detailed professional report with the following sections:

## 1. SESSION OVERVIEW
- Date and participants (use "Party A" and "Party B")
- Nature of conflict
- Session duration and engagement level
- Resolution status

## 2. PRESENTING ISSUES
- Core conflict areas identified
- Underlying needs and interests for each party
- Emotional triggers observed

## 3. INDIVIDUAL ASSESSMENTS

### Party A
- Communication style observed
- Key concerns and needs expressed
- Emotional patterns and triggers
- Growth areas identified
- Strengths demonstrated

### Party B
- Communication style observed
- Key concerns and needs expressed
- Emotional patterns and triggers
- Growth areas identified
- Strengths demonstrated

## 4. RELATIONSHIP DYNAMICS
- Communication patterns between parties
- Power dynamics observed
- Areas of compatibility
- Points of tension
- Mutual understanding achieved

## 5. RESOLUTION ANALYSIS
- Agreements reached
- Outstanding issues
- Likelihood of adherence
- Follow-up needed

## 6. THERAPEUTIC OBSERVATIONS
- Attachment styles observed
- Defense mechanisms identified
- Emotional regulation capacity
- Empathy levels demonstrated

## 7. RECOMMENDATIONS

### For the Relationship
- Specific actionable steps
- Communication strategies to implement
- Boundaries to establish or maintain

### For Individual Growth
- Personal development areas for Party A
- Personal development areas for Party B
- Self-care practices

### Professional Support Suggested
Based on the complexity and depth of issues observed, consider seeking additional support:
- **Individual Therapy**: For processing personal patterns and triggers
- **Couples/Family Therapy**: For ongoing relationship work
- **Support Groups**: For specific issues identified

**Important Note**: While AI-mediated sessions provide valuable structure and insight, professional human therapists offer irreplaceable depth of understanding, real-time emotional attunement, and specialized clinical interventions. For complex or ongoing issues, we strongly recommend consulting with a licensed professional.

**Recommended Resource**: [OnlineTherapy.com](https://www.onlinetherapy.com) - Connect with licensed therapists specializing in relationship issues, communication, and personal growth.

## 8. FOLLOW-UP CHECKLIST
- [ ] Schedule check-in in 7 days
- [ ] Review agreements after 2 weeks
- [ ] Consider professional therapy consultation
- [ ] Practice recommended communication techniques
- [ ] Individual self-reflection exercises

## 9. CLOSING NOTES
- Overall prognosis
- Encouraging observations
- Final recommendations

---
*This report is generated for informational and self-reflection purposes only. It does not constitute professional therapy or medical advice. For clinical assessment and treatment, please consult with a licensed mental health professional.*

Write in a warm but professional tone. Be specific with observations and actionable with recommendations. Use NVC (Nonviolent Communication) principles throughout."""


def generate_mediation_report(
    resolution_text: str,
    user1_coaching_turns: List[Dict],
    user2_coaching_turns: List[Dict],
    main_room_turns: List[Dict],
    user1_name: str = "Party A",
    user2_name: str = "Party B",
    room_title: str = "Mediation Session"
) -> Dict:
    """
    Generate a professional mediation report from session data

    Args:
        resolution_text: The final resolution/agreement text
        user1_coaching_turns: User 1's individual coaching conversation
        user2_coaching_turns: User 2's individual coaching conversation
        main_room_turns: Joint mediation conversation
        user1_name: Display name for user 1 (defaults to "Party A" for privacy)
        user2_name: Display name for user 2 (defaults to "Party B" for privacy)
        room_title: Title/topic of the mediation

    Returns:
        Dict with report content and metadata
    """

    # Build coaching transcripts
    user1_transcript = _format_conversation(user1_coaching_turns, "Client", "Coach")
    user2_transcript = _format_conversation(user2_coaching_turns, "Client", "Coach")
    main_transcript = _format_main_room(main_room_turns, user1_name, user2_name)

    # Build the analysis prompt
    user_prompt = f"""MEDIATION TOPIC: {room_title}

## PARTY A ({user1_name}) - INDIVIDUAL COACHING SESSION:
{user1_transcript}

## PARTY B ({user2_name}) - INDIVIDUAL COACHING SESSION:
{user2_transcript}

## JOINT MEDIATION SESSION:
{main_transcript}

## RESOLUTION REACHED:
{resolution_text}

Please generate a comprehensive professional mediation report based on the above sessions."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": MEDIATION_REPORT_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=3000
        )

        full_report = response.choices[0].message.content

        # Calculate costs
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens

        # GPT-4 pricing
        INPUT_COST = 0.03 / 1000
        OUTPUT_COST = 0.06 / 1000
        cost_usd = (input_tokens * INPUT_COST) + (output_tokens * OUTPUT_COST)

        return {
            "full_report": full_report,
            "resolution": resolution_text,
            "cost_info": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "cost_usd": round(cost_usd, 4),
                "model": "gpt-4"
            }
        }

    except Exception as e:
        print(f"Error generating mediation report: {e}")
        import traceback
        traceback.print_exc()

        return {
            "full_report": "Error generating report. Please try again.",
            "resolution": resolution_text,
            "cost_info": {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "cost_usd": 0.0,
                "model": "gpt-4"
            },
            "error": str(e)
        }


def _format_conversation(turns: List[Dict], client_label: str, coach_label: str) -> str:
    """Format coaching turns into readable transcript"""
    if not turns:
        return "(No coaching data available)"

    lines = []
    for turn in turns:
        role = turn.get("role", turn.get("kind", "user"))
        content = turn.get("content", turn.get("summary", ""))

        if role in ["assistant", "ai_response", "ai_question"]:
            lines.append(f"**{coach_label}**: {content}")
        else:
            lines.append(f"**{client_label}**: {content}")

    return "\n\n".join(lines) if lines else "(No data)"


def _format_main_room(turns: List[Dict], user1_name: str, user2_name: str) -> str:
    """Format main room turns with speaker identification"""
    if not turns:
        return "(No joint session data available)"

    lines = []
    for turn in turns:
        kind = turn.get("kind", "")
        content = turn.get("content", turn.get("summary", ""))
        speaker = turn.get("speaker_name", "Unknown")

        if kind in ["ai_response", "ai_question"]:
            lines.append(f"**Mediator**: {content}")
        elif kind == "resolution":
            lines.append(f"**[RESOLUTION REACHED]**: {content}")
        else:
            # Use generic names for privacy
            if speaker == user1_name:
                lines.append(f"**Party A**: {content}")
            elif speaker == user2_name:
                lines.append(f"**Party B**: {content}")
            else:
                lines.append(f"**{speaker}**: {content}")

    return "\n\n".join(lines) if lines else "(No data)"
