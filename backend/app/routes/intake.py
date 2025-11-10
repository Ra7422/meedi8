from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, AnyUrl
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.user import User
from ..models.room import Room, RoomParticipant, Turn
from ..security import get_current_user

router = APIRouter(prefix="/rooms", tags=["intake"])

class IntakePayload(BaseModel):
    summary: str
    desired_outcome: Optional[str] = None
    nonnegotiables: Optional[str] = None
    timeline: Optional[str] = None
    evidence_urls: Optional[List[AnyUrl]] = None

class IntakeOut(BaseModel):
    turn_id: int
    room_id: int
    user_id: int
    kind: str
    tags: List[str]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

FACT_WORDS = {"because", "due to", "data", "evidence", "report", "saw", "observed", "metrics", "prove"}
FEELING_WORDS = {"feel", "felt", "anxious", "worried", "happy", "upset", "frustrated", "angry", "sad"}
REQUEST_WORDS = {"please", "could you", "can you", "would you", "i want you to", "request"}
OPINION_WORDS = {"i think", "i believe", "in my view", "opinion", "should", "ought"}

def classify_text(*texts: Optional[str]) -> List[str]:
    text = " ".join([t for t in texts if t])[:10000].lower()
    tags = set()
    if any(w in text for w in FACT_WORDS): tags.add("fact")
    if any(w in text for w in FEELING_WORDS): tags.add("feeling")
    if any(w in text for w in REQUEST_WORDS): tags.add("request")
    if any(w in text for w in OPINION_WORDS): tags.add("opinion")
    if not tags:
      if any(c.isdigit() for c in text) or "http" in text: tags.add("fact")
      else: tags.add("opinion")
    return sorted(tags)

def require_participant(db: Session, room_id: int, user_id: int):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    member = (
        db.query(RoomParticipant)
        .filter(RoomParticipant.room_id == room_id, RoomParticipant.user_id == user_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a participant in this room")
    return room

@router.post("/{room_id}/intake", response_model=IntakeOut, status_code=201)
def submit_intake(
    payload: IntakePayload,
    room_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_participant(db, room_id, current_user.id)
    tags = classify_text(payload.summary, payload.desired_outcome, payload.nonnegotiables, payload.timeline)
    turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="intake",
        summary=payload.summary,
        desired_outcome=payload.desired_outcome,
        nonnegotiables=payload.nonnegotiables,
        timeline=payload.timeline,
        evidence_urls=[str(u) for u in (payload.evidence_urls or [])],
        tags=tags,
    )
    db.add(turn)
    db.commit()
    db.refresh(turn)
    return IntakeOut(turn_id=turn.id, room_id=turn.room_id, user_id=turn.user_id, kind=turn.kind, tags=turn.tags)
