"""
Solo Coach AI Service
Guides individual users through self-reflection and conflict processing
"""
import os
from typing import Dict, List
from anthropic import Anthropic
from app.services.cost_tracker import extract_usage
from app.config import settings

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Load the comprehensive Solo Coach prompt from file
with open(os.path.join(os.path.dirname(__file__), '../../solo_coach_prompt.md'), 'r') as f:
    SOLO_COACH_PROMPT = f.read()


def start_solo_session(user_input: str, user_name: str) -> Dict:
    """
    Start a new Solo coaching session with the user's initial situation

    Args:
        user_input: The user's initial description of what they want to discuss
        user_name: The user's name for personalization

    Returns:
        Dict with ai_response, ready_for_clarity, usage data
    """
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=SOLO_COACH_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"User's name: {user_name}\n\nUser says: {user_input}\n\nThis is the start of the session. Begin warmly and naturally."
                }
            ]
        )

        ai_message = response.content[0].text
        usage = extract_usage(response)

        # Check if AI detected immediate clarity (unlikely but possible)
        ready_for_clarity = "CLARITY:" in ai_message

        return {
            "ai_response": ai_message,
            "ready_for_clarity": ready_for_clarity,
            **usage
        }

    except Exception as e:
        print(f"Solo coaching error: {e}")
        return {
            "ai_response": "I'm here to help you think through this. What's on your mind?",
            "ready_for_clarity": False
        }


def process_solo_response(conversation_history: List[Dict], user_response: str, user_name: str) -> Dict:
    """
    Process the user's response in an ongoing Solo coaching conversation

    Args:
        conversation_history: List of previous messages in Claude format [{"role": "user/assistant", "content": "..."}]
        user_response: The user's latest response
        user_name: The user's name for personalization

    Returns:
        Dict with ai_response or clarity_summary, ready_for_clarity, usage data
    """

    messages = conversation_history + [
        {"role": "user", "content": user_response}
    ]

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,  # Longer for potential clarity summary
            system=SOLO_COACH_PROMPT,
            messages=messages
        )

        ai_message = response.content[0].text
        usage = extract_usage(response)

        # Check if the AI has produced a clarity summary
        if "CLARITY:" in ai_message:
            # Extract the clarity summary
            summary_text = ai_message.split("CLARITY:", 1)[1].strip()

            # Parse the summary into structured parts
            key_insights = []
            suggested_actions = []
            possible_actions = []

            # Parse KEY INSIGHTS section
            if "KEY INSIGHTS:" in summary_text:
                insights_section = summary_text.split("KEY INSIGHTS:")[1]
                if "SUGGESTED ACTIONS:" in insights_section:
                    insights_section = insights_section.split("SUGGESTED ACTIONS:")[0]

                # Extract bullet points
                for line in insights_section.strip().split('\n'):
                    line = line.strip()
                    if line.startswith('- '):
                        key_insights.append(line[2:].strip())

            # Parse SUGGESTED ACTIONS section
            if "SUGGESTED ACTIONS:" in summary_text:
                actions_section = summary_text.split("SUGGESTED ACTIONS:")[1]
                if "POSSIBLE ACTIONS:" in actions_section:
                    actions_section = actions_section.split("POSSIBLE ACTIONS:")[0]

                # Extract bullet points
                for line in actions_section.strip().split('\n'):
                    line = line.strip()
                    if line.startswith('- '):
                        suggested_actions.append(line[2:].strip())

            # Parse POSSIBLE ACTIONS section (structured action buttons)
            if "POSSIBLE ACTIONS:" in summary_text:
                possible_section = summary_text.split("POSSIBLE ACTIONS:")[1].strip()

                # Extract action tags like [talk_to_person], [set_boundary], etc.
                for line in possible_section.split('\n'):
                    line = line.strip()
                    if line.startswith('[') and ']' in line:
                        # Extract the action type and description
                        action_type = line[1:line.index(']')]
                        action_description = line[line.index(']')+1:].strip()
                        possible_actions.append({
                            "type": action_type,
                            "description": action_description
                        })

            return {
                "ready_for_clarity": True,
                "clarity_summary": summary_text,
                "key_insights": key_insights,
                "suggested_actions": suggested_actions,
                "possible_actions": possible_actions,
                **usage
            }
        else:
            return {
                "ai_response": ai_message,
                "ready_for_clarity": False,
                **usage
            }

    except Exception as e:
        print(f"Solo coaching error during processing: {e}")
        import traceback
        traceback.print_exc()

        # Fallback response
        return {
            "ai_response": "Tell me more about that. What's important to you here?",
            "ready_for_clarity": False
        }
