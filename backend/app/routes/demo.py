"""
Interactive Demo Endpoints
No authentication required - limited to 3 turns for trial purposes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.services.pre_mediation_coach import process_coaching_response, start_coaching_session

router = APIRouter(prefix="/demo", tags=["demo"])


class DemoRequest(BaseModel):
    message: str
    conversation: List[Dict[str, str]]  # [{"role": "user"|"assistant", "content": "..."}]


class DemoResponse(BaseModel):
    response: str
    turn_count: int
    is_complete: bool  # True when demo limit (3 turns) is reached


@router.post("/respond", response_model=DemoResponse)
async def demo_respond(request: DemoRequest):
    """
    Interactive demo endpoint - NO AUTH REQUIRED

    Allows users to try the AI coaching without creating an account.
    Limited to 3 turns (user messages) to prevent abuse and control costs.

    Args:
        request: DemoRequest containing user message and conversation history

    Returns:
        DemoResponse with AI response and turn tracking

    Raises:
        HTTPException 429: Demo turn limit reached (3 turns)
    """
    # Count user turns (not total messages)
    user_turns = [msg for msg in request.conversation if msg.get('role') == 'user']
    turn_count = len(user_turns)

    # Enforce 3-turn limit
    MAX_TURNS = 3
    if turn_count >= MAX_TURNS:
        raise HTTPException(
            status_code=429,
            detail="Demo limit reached. Create an account to continue your coaching session."
        )

    # If first message, start fresh session
    if turn_count == 0:
        result = start_coaching_session(
            user_input=request.message,
            is_user1=True,  # Always User 1 for demo
            user1_summary=None
        )
    else:
        # Continue existing conversation
        result = process_coaching_response(
            conversation_history=request.conversation,
            user_response=request.message,
            exchange_count=turn_count
        )

    # Extract AI response
    ai_response = result.get('ai_question') or result.get('ai_response', 'Tell me more about that.')

    # Check if finalized (READY: prefix means coaching is complete)
    is_finalized = ai_response.startswith('READY:')
    is_complete = (turn_count + 1 >= MAX_TURNS) or is_finalized

    return DemoResponse(
        response=ai_response,
        turn_count=turn_count + 1,
        is_complete=is_complete
    )


@router.get("/health")
async def demo_health():
    """
    Health check for demo service (no auth required)
    """
    return {"status": "ok", "service": "interactive_demo", "max_turns": 3}
