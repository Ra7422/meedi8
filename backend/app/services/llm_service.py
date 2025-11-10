import os
from typing import Dict, List
from anthropic import Anthropic
from app.services.mediation_prompts import (
    MEDIATOR_SYSTEM_PROMPT,
    INITIAL_QUESTIONS_PROMPT,
    NEXT_STEP_PROMPT
)

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def build_initial_questions(participants: List[Dict], context: Dict = None) -> List[Dict]:
    """Generate evidence-based initial mediation questions."""
    
    if len(participants) < 2:
        return []
    
    perspectives = "\n\n".join([
        f"Person {i+1} ({p['name']}): {p['summary']}"
        for i, p in enumerate(participants)
    ])
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            system=MEDIATOR_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"{perspectives}\n\n{INITIAL_QUESTIONS_PROMPT}"
            }]
        )
        
        content = response.content[0].text
        print(f"DEBUG: Claude response: {content[:200]}...")
        
        questions = []
        lines = content.split('\n')
        
        for i, participant in enumerate(participants):
            for line in lines:
                if line.strip().startswith(f"QUESTION_{i+1}"):
                    if ':' in line:
                        q = line.split(':', 1)[1].strip()
                        questions.append({
                            "user_id": participant["user_id"],
                            "question": q + "\n\n— Not therapy/legal advice."
                        })
                        break
        
        if len(questions) < len(participants):
            questions = [
                {
                    "user_id": p["user_id"],
                    "question": f"What need of yours isn't being met in this situation?\n\n— Not therapy/legal advice."
                }
                for p in participants
            ]
        
        return questions
        
    except Exception as e:
        print(f"Claude API error: {e}")
        return [
            {"user_id": p["user_id"], "question": "What matters most to you in resolving this?\n\n— Not therapy/legal advice."}
            for p in participants
        ]


def generate_next_step(history: List[Dict]) -> Dict:
    """Generate next mediation step using evidence-based frameworks."""
    
    if len(history) < 2:
        return {"next_question": "What specific outcome would feel fair to each of you?"}
    
    # Build conversation history
    messages = []
    for turn in history:
        role = turn.get("role", "user")
        text = turn.get("text", "")
        
        if role == "assistant":
            messages.append({"role": "assistant", "content": text})
        else:
            user_id = turn.get("user_id", "unknown")
            messages.append({"role": "user", "content": f"[User {user_id}]: {text}"})
    
    messages.append({"role": "user", "content": NEXT_STEP_PROMPT})
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=MEDIATOR_SYSTEM_PROMPT,
            messages=messages
        )
        
        content = response.content[0].text
        
        if content.startswith("QUESTION:"):
            return {"next_question": content.replace("QUESTION:", "").strip() + "\n\n— Not therapy/legal advice."}
        elif content.startswith("RESOLUTION:"):
            return {"resolution": content.replace("RESOLUTION:", "").strip() + "\n\n— Not therapy/legal advice.", "done": True}
        elif content.startswith("HALT:"):
            return {"halted": True, "reason": content.replace("HALT:", "").strip()}
        else:
            return {"next_question": content + "\n\n— Not therapy/legal advice."}
            
    except Exception as e:
        print(f"Claude API error: {e}")
        return {"next_question": "Mediator temporarily unavailable.\n\n— Not therapy/legal advice."}


def is_unsafe(text: str) -> bool:
    """Keyword-based safety screening."""
    if not text:
        return False
    
    dangerous_keywords = [
        "kill", "hurt", "violence", "harm", "threat",
        "suicide", "self-harm", "abuse", "weapon"
    ]
    
    return any(keyword in text.lower() for keyword in dangerous_keywords)
