from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class RoomCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    room_type: Optional[str] = Field("mediation", max_length=20)  # "mediation" or "solo"

class RoomResponse(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    created_at: datetime

class IntakeRequest(BaseModel):
    # allow either text or summary; backend will fold text->summary
    text: Optional[str] = None
    summary: Optional[str] = None
    desired_outcome: str = ""
    nonnegotiables: str = ""
    timeline: str = ""
    evidence_urls: List[str] = []

class IntakeResponse(BaseModel):
    turn_id: int
    room_id: int
    user_id: int
    kind: str
    text: str
    tags: List[str]
    created_at: datetime

class TurnResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    kind: str
    text: str
    tags: List[str]
    created_at: datetime

class TurnFeedItem(BaseModel):
    id: int
    room_id: int
    user_id: int
    author_name: str
    text: str
    tags: List[str]
    created_at: datetime
    desired_outcome: Optional[str] = ""

class AIQuestionOut(BaseModel):
    user_id: int
    question: str

class MediateOut(BaseModel):
    items: List[AIQuestionOut]

class RespondRequest(BaseModel):
    text: str

class RespondOut(BaseModel):
    halted: bool = False
    reason: Optional[str] = None
    resolution: Optional[str] = None
    next_question: Optional[str] = None

class SignalRequest(BaseModel):
    signal_type: str

# === PRE-MEDIATION COACHING SCHEMAS ===

from pydantic import BaseModel
from typing import Optional

class StartCoachingRequest(BaseModel):
    initial_message: str

class StartCoachingResponse(BaseModel):
    ai_question: str
    exchange_count: int
    room_phase: str
    other_user_name: Optional[str] = None  # For User 2: shows User 1's name
    other_user_summary: Optional[str] = None  # For User 2: shows User 1's perspective

class CoachingResponseRequest(BaseModel):
    user_message: str

class CoachingResponseOut(BaseModel):
    ai_question: Optional[str] = None
    ready_to_finalize: bool
    polished_summary: Optional[str] = None
    exchange_count: int
    transcribed_text: Optional[str] = None  # For voice recordings

class FinalizeCoachingResponse(BaseModel):
    success: bool
    invite_link: Optional[str] = None  # Only for User 1
    ready_for_main_room: bool  # Only for User 2
    user1_summary: Optional[str] = None  # User 1's polished summary

class LobbyInfoResponse(BaseModel):
    room_id: int
    title: str
    user1_issue: str  # What User 1 described
    user1_name: str

# === MAIN ROOM SCHEMAS ===

class MainRoomSummariesResponse(BaseModel):
    user1_id: int
    user1_name: str
    user1_summary: str
    user2_id: int
    user2_name: str
    user2_summary: str
    room_title: str
    invite_token: str
    user1_present: bool  # Whether User 1 has been in main room recently (< 1 min)
    user2_present: bool  # Whether User 2 has been in main room recently (< 1 min)

class MainRoomStartResponse(BaseModel):
    opening_message: str
    current_speaker_id: int
    next_turn: str  # "user1" or "user2"

class MainRoomRespondRequest(BaseModel):
    message: str

class MainRoomRespondResponse(BaseModel):
    ai_response: Optional[str] = None
    resolution: Optional[str] = None
    resolution_reached: bool = False
    resolution_text: Optional[str] = None
    next_speaker_id: Optional[int] = None
    addressed_user_name: Optional[str] = None  # First name of who AI is addressing
    session_complete: bool = False
    transcribed_text: Optional[str] = None  # For voice recordings
    breathing_break: bool = False  # Whether a breathing break was triggered
    breathing_break_count: Optional[int] = None  # Total breathing breaks in this session
