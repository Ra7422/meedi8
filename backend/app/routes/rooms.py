ALLOWED_SIGNALS = {"agree","disagree","sorry","hear_you","break","hurt"}

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, String
import io

from app.db import get_db
from app.deps import get_current_user, get_current_subscription
from app.models.user import User
from app.models.subscription import Subscription
from app.services.llm_service import is_unsafe
from app.services.pre_mediation_coach import start_coaching_session, process_coaching_response, generate_invite_token
from app.services.main_room_mediator import start_main_room, process_main_room_response
# SOLO MODE - Commented out for production until deployed
# from app.services.solo_coach import start_solo_session, process_solo_response
# from app.services.therapy_report import generate_professional_report
from app.services.whisper_service import transcribe_audio
from app.services.subscription_service import require_feature_access, increment_voice_usage, check_room_creation_limit, increment_room_counter, check_file_upload_allowed
from app.services.cost_tracker import calculate_whisper_cost, track_api_cost
from app.services.email_service import send_turn_notification, send_break_notification
from app.schemas.room import StartCoachingRequest, StartCoachingResponse, CoachingResponseRequest, CoachingResponseOut, FinalizeCoachingResponse, LobbyInfoResponse, MainRoomSummariesResponse, MainRoomStartResponse, MainRoomRespondRequest, MainRoomRespondResponse
from app.models.room import Room, Turn
from app.schemas.room import RoomCreate, RoomResponse, IntakeRequest, IntakeResponse, TurnResponse, TurnFeedItem, AIQuestionOut, MediateOut, RespondRequest, RespondOut, SignalRequest
router = APIRouter(prefix="/rooms", tags=["rooms"])

# ---- Helpers ----
def extract_tags(text: str) -> List[str]:
    t = (text or "").lower()
    # Safety screening: reject harmful content
    banned = ["violence", "self-harm", "threat"]
    if any(word in t for word in banned):
        # We raise in submit_intake to include correct HTTP status
        pass
    tags: List[str] = []
    if any(w in t for w in ["actually","fact","happened","did","was"]):
        tags.append("fact")
    if any(w in t for w in ["feel","felt","emotion","upset","happy","sad","angry","anxious","tired"]):
        tags.append("feeling")
    if any(w in t for w in ["need","want","would like","could you","please"]):
        tags.append("request")
    if any(w in t for w in ["think","believe","opinion","seems","probably"]):
        tags.append("opinion")
    if not tags:
        tags.append("statement")
    return tags

def clean_user_name(user) -> str:
    """Clean and validate user names - use first name only for display."""
    if hasattr(user, 'name') and hasattr(user, 'email'):
        name = (user.name or user.email).strip()
    else:
        # If it's already a string (edge case)
        name = str(user).strip()

    # Use first name only (handles "Dave Dave", "John Smith", etc.)
    words = name.split()
    if len(words) > 0:
        return words[0]

    return name

@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # PAYWALL: Check room creation limit before allowing room creation
    check_room_creation_limit(current_user.id, db)

    # Support room_type parameter (mediation or solo)
    room_type = getattr(room_data, 'room_type', 'mediation')  # Default to mediation for backward compatibility

    # Set initial phase based on room type
    if room_type == 'solo':
        initial_phase = 'solo_intake'
    else:
        initial_phase = 'user1_intake'

    room = Room(
        title=room_data.title,
        category=room_data.category,
        room_type=room_type,
        phase=initial_phase
    )
    room.participants.append(current_user)
    db.add(room)
    db.commit()
    db.refresh(room)

    # PAYWALL: Increment room counter after successful creation
    increment_room_counter(current_user.id, db)

    return room

@router.post("/{room_id}/join")
def join_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check if already a participant using relationship
    if current_user in room.participants:
        return {"message": "Already a participant"}

    # Add user to room participants
    room.participants.append(current_user)
    db.commit()
    return {"message": "Joined room"}

@router.post("/{room_id}/intake", response_model=IntakeResponse, status_code=status.HTTP_201_CREATED)
def submit_intake(
    room_id: int,
    intake: IntakeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # must exist
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # must be participant
    participant = db.query(RoomParticipant).filter(
        RoomParticipant.room_id == room_id,
        RoomParticipant.user_id == current_user.id,
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="You must join the room before submitting intake")

    # accept either summary or text (fallback)
    effective = (intake.summary or intake.text or "").strip()
    if not effective:
        raise HTTPException(status_code=400, detail="Provide 'text' or 'summary'.")

    # Safety screening: reject certain content
    lowered = effective.lower()
    banned_keywords = ["violence", "self-harm", "threat"]
    if any(bad in lowered for bad in banned_keywords):
        raise HTTPException(
            status_code=422,
            detail="Safety screening failed: please remove sensitive content (violence, self-harm, threat).",
        )

    tags = extract_tags(effective)

    turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="intake",
        summary=effective,
        desired_outcome=intake.desired_outcome or "",
        nonnegotiables=intake.nonnegotiables or "",
        timeline=intake.timeline or "",
        evidence_urls=intake.evidence_urls or [],
        tags=tags,
    )
    db.add(turn)
    db.commit()
    db.refresh(turn)

    # IMPORTANT: map DB summary -> API "text"
    return IntakeResponse(
        turn_id=turn.id,
        room_id=turn.room_id,
        user_id=turn.user_id,
        kind=turn.kind,
        text=turn.summary or "",
        tags=turn.tags or [],
        created_at=turn.created_at,
    )

@router.get("/{room_id}/intake/self", response_model=List[TurnResponse])
def get_own_intake(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # must be participant
    participant = db.query(RoomParticipant).filter(
        RoomParticipant.room_id == room_id,
        RoomParticipant.user_id == current_user.id,
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant in this room")

    rows = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.user_id == current_user.id,
        Turn.user_id == current_user.id,
        Turn.kind == "intake",
    ).order_by(Turn.created_at).all()

    # IMPORTANT: map DB summary -> API "text"
    return [
        TurnResponse(
            id=t.id,
            room_id=t.room_id,
            user_id=t.user_id,
            kind=t.kind,
            text=t.summary or "",
            tags=t.tags or [],
            created_at=t.created_at,
        )
        for t in rows
    ]

@router.get("/my", response_model=List[RoomResponse])
def get_my_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Room).join(RoomParticipant, RoomParticipant.room_id == Room.id).filter(
        RoomParticipant.user_id == current_user.id
    ).order_by(Room.created_at).all()
    return rows

@router.get("/{room_id}/feed", response_model=List[TurnFeedItem])
def get_room_feed(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify user is a participant
    participant = db.query(RoomParticipant).filter(
        RoomParticipant.room_id == room_id,
        RoomParticipant.user_id == current_user.id,
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant in this room")

    # Get all intake turns for this room with user info, newest first
    rows = db.query(Turn, User).join(User, User.id == Turn.user_id).filter(
        Turn.room_id == room_id,
        Turn.user_id == current_user.id,
        Turn.kind == "intake"
    ).order_by(Turn.created_at.desc()).all()

    return [
        TurnFeedItem(
            id=turn.id,
            room_id=turn.room_id,
            user_id=turn.user_id,
            author_name=user.name or user.email,
            text=turn.summary or "",
            tags=turn.tags or [],
            created_at=turn.created_at,
            desired_outcome=turn.desired_outcome or "",
        )
        for turn, user in rows
    ]
# --- Mediation endpoints (appended by setup) ---
from typing import List, Dict
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import get_current_user
from app.models.room import Turn, Room
from app.models.user import User
from app.services.llm_service import build_initial_questions, generate_next_step, is_unsafe
from app.services.pre_mediation_coach import start_coaching_session, process_coaching_response, generate_invite_token
from app.schemas.room import StartCoachingRequest, StartCoachingResponse, CoachingResponseRequest, CoachingResponseOut, FinalizeCoachingResponse, LobbyInfoResponse, MainRoomSummariesResponse, MainRoomStartResponse, MainRoomRespondRequest, MainRoomRespondResponse

def _room_participant_ids(db: Session, room_id: int) -> List[int]:
    return [rp.user_id for rp in db.query(RoomParticipant).filter(RoomParticipant.room_id == room_id).all()]

def _latest_intake_by_user(db: Session, room_id: int) -> Dict[int, Turn]:
    rows = (
        db.query(Turn)
        .filter(Turn.room_id == room_id, Turn.kind == "intake")
        .order_by(Turn.user_id, Turn.created_at.desc())
        .all()
    )
    latest: Dict[int, Turn] = {}
    for t in rows:
        if t.user_id not in latest:
            latest[t.user_id] = t  # first seen per user is latest due to desc order
    return latest

@router.post("/{room_id}/mediate", response_model=MediateOut, status_code=status.HTTP_201_CREATED)
def start_mediation(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # must be a participant
    participant_ids = _room_participant_ids(db, room_id)
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="You are not a participant in this room")

    # need intake from at least two distinct users
    latest = _latest_intake_by_user(db, room_id)
    if len(latest) < 2:
        raise HTTPException(status_code=400, detail="Waiting for both perspectives")

    # build participant payload for LLM
    participants = []
    for uid, t in latest.items():
        user = db.query(User).filter(User.id == uid).first()
        participants.append({
            "user_id": uid,
            "name": (user.name or user.email),
            "summary": t.summary
        })

    questions = build_initial_questions(participants, context={})

    # store as AI questions
    items: List[AIQuestionOut] = []
    for q in questions:
        text = q["question"]
        turn = Turn(
            room_id=room_id,
            user_id=current_user.id,  # stored under current user; tagged as AI
            kind="ai_question",
            summary=text,
            tags=["ai"]
        )
        db.add(turn)
        db.flush()
        items.append(AIQuestionOut(user_id=q["user_id"], question=text))
    db.commit()
    return MediateOut(items=items)

def _room_history(db: Session, room_id: int) -> List[Dict]:
    rows = (
        db.query(Turn)
        .filter(Turn.room_id == room_id)
        .order_by(Turn.created_at.asc())
        .all()
    )
    hist: List[Dict] = []
    for t in rows:
        role = "user"
        if t.kind in ("ai_question", "resolution"):
            role = "assistant"

        item = {
            "role": role,
            "user_id": t.user_id,
            "text": t.summary or "",
            "kind": t.kind,
        }

        # Derive signal_type from tags like ["signal","agree"]
        if t.kind == "signal":
            sig = None
            if t.tags:
                for tag in t.tags:
                    if tag in {"agree","disagree","sorry","hear_you","break","hurt"}:
                        sig = tag
                        break
            if sig:
                item["signal_type"] = sig

        hist.append(item)
    return hist
@router.post("/{room_id}/respond", response_model=RespondOut)
def respond_mediation(
    room_id: int,
    payload: RespondRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Must be a participant
    participant_ids = _room_participant_ids(db, room_id)
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="You are not a participant in this room")

    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Response text is required")

    # Single safety check — unpack the tuple properly
    unsafe = is_unsafe(text); reason = "Safety screening triggered" if unsafe else ""
    if unsafe:
        raise HTTPException(status_code=422, detail=f"Safety triggered ({reason}). Session paused.")

    # Save user response
    t = Turn(room_id=room_id, user_id=current_user.id, kind="user_response", summary=text, tags=["response"])
    db.add(t)
    db.commit()
    db.refresh(t)

    # Just save message - frontend handles AI responses
    return RespondOut(halted=False, next_question=None, resolution=None)

    # Fallback
    return RespondOut(next_question="Mediator temporarily unavailable — please try again.", halted=False)
    # Ensure user is a participant
    participant_ids = _room_participant_ids(db, room_id)
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="You are not a participant in this room")

    # Join turns -> users for author name
    rows = (
        db.query(Turn, User)
          .join(User, Turn.user_id == User.id)
          .filter(Turn.room_id == room_id)
          .order_by(Turn.id.asc())
          .all()
    )
    out = []
    for t, u in rows:
        out.append(TurnFeedItem(
            id=t.id,
            room_id=t.room_id,
            user_id=t.user_id,
            author_name=(u.name or u.email),
            text=t.summary,
            tags=t.tags or [],
            created_at=t.created_at
        ))
    return out

@router.post("/{room_id}/signal", response_model=RespondOut)
def send_signal(
    room_id: int,
    payload: SignalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Must be a participant
    participant_ids = _room_participant_ids(db, room_id)
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="You are not a participant in this room")

    st = (payload.signal_type or "").strip().lower()
    if st not in ALLOWED_SIGNALS:
        raise HTTPException(status_code=422, detail="Invalid signal_type")

    text = (payload.text or "").strip()

    # Safety check only on optional text
    if text:
        unsafe, reason = is_unsafe(text)
        if unsafe:
            raise HTTPException(status_code=422, detail=f"Safety triggered ({reason}). Session paused.")

    # Persist the signal turn (encode signal_type in tags)
    t = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="signal",
        summary=text,
        tags=["signal", st]
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    # Build history and normalize signal_type for signal turns (from tags)
    history = _room_history(db, room_id)
    for h in history:
        if h.get("kind") == "signal":
            sig = None
            for tg in (h.get("tags") or []):
                if tg in ALLOWED_SIGNALS:
                    sig = tg
                    break
            h["signal_type"] = sig

    result = generate_next_step(history, {"last_signal_type": payload.signal_type})

    # Halted (e.g., Need a Break)
    if result.get("halted"):
        return RespondOut(halted=True, reason=result.get("reason") or "Session paused")

    # Resolution
    if result.get("resolution"):
        res_text = result["resolution"]
        db.add(Turn(room_id=room_id, user_id=current_user.id, kind="resolution", summary=res_text, tags=["ai","resolution"]))
        db.commit()
        return RespondOut(resolution=res_text, halted=False)

    # Next question
    if result.get("next_question"):
        q_text = result["next_question"]
        db.add(Turn(room_id=room_id, user_id=current_user.id, kind="ai_question", summary=q_text, tags=["ai"]))
        db.commit()
        return RespondOut(next_question=q_text, halted=False)

    # Fallback
    return RespondOut(next_question="Mediator temporarily unavailable — please try again.", halted=False)

@router.get("/{room_id}/conversation", response_model=List[TurnFeedItem])
def get_conversation(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get ALL messages in the conversation (not just intake)"""
    participant = db.query(RoomParticipant).filter(
        RoomParticipant.room_id == room_id,
        RoomParticipant.user_id == current_user.id,
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Get ALL turn types: user_response, ai_question, resolution
    rows = db.query(Turn, User).join(User, User.id == Turn.user_id).filter(
        Turn.room_id == room_id,
        Turn.user_id == current_user.id,
        Turn.kind.in_(["user_response", "ai_question", "resolution"])
    ).order_by(Turn.created_at.asc()).all()

    return [
        TurnFeedItem(
            id=turn.id,
            room_id=turn.room_id,
            user_id=turn.user_id,
            author_name="AI Mediator" if "ai" in (turn.tags or []) else (user.name or user.email),
            text=turn.summary or "",
            tags=turn.tags or [],
            created_at=turn.created_at,
            desired_outcome=turn.desired_outcome or "",
        )
        for turn, user in rows
    ]

@router.post("/{room_id}/ai-message")
def save_ai_message(
    room_id: int,
    payload: RespondRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save an AI mediator message"""
    participant_ids = _room_participant_ids(db, room_id)
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Message required")
    
    # Save as AI message
    t = Turn(
        room_id=room_id,
        user_id=current_user.id,  # Still track who triggered it
        kind="ai_question",
        summary=text,
        tags=["ai"]
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    
    return {"ok": True, "id": t.id}

# ============================================
# PRE-MEDIATION COACHING ENDPOINTS
# ============================================


@router.get("/{room_id}/coach/turns")
def get_coaching_turns(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all coaching conversation turns for a room"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Get all pre-mediation turns for this room
    turns = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.user_id == current_user.id,
        Turn.context == 'pre_mediation'
    ).order_by(Turn.id).all()  # Use id for guaranteed sequential ordering
    
    # Format as conversation messages
    messages = []
    for turn in turns:
        if turn.kind == 'user_response':
            messages.append({"role": "user", "content": turn.summary or ""})
        elif turn.kind == 'ai_question':
            messages.append({"role": "assistant", "content": turn.summary or ""})
    
    return {"messages": messages}

@router.post("/{room_id}/coach/start", response_model=StartCoachingResponse)
def start_coaching(
    room_id: int,
    payload: StartCoachingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start AI coaching session for user before main mediation."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if user is participant
    participant_ids = [p.id for p in room.participants]
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    # Determine if this is User 1 or User 2
    is_user1 = (room.participants[0].id == current_user.id)
    
    # Start coaching (User 2 gets User 1's summary as context)
    user1_summary = room.user1_summary if not is_user1 else None
    result = start_coaching_session(payload.initial_message, is_user1, user1_summary)
    
    # Save initial turn
    turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="user_response",
        summary=payload.initial_message,
        context="pre_mediation",
        tags=["coaching_start"]
    )
    db.add(turn)
    
    # Save AI question with cost tracking
    ai_turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="ai_question",
        summary=result["ai_question"],
        context="pre_mediation",
        tags=["coaching"],
        input_tokens=result.get("input_tokens", 0),
        output_tokens=result.get("output_tokens", 0),
        cost_usd=result.get("cost_usd", 0.0),
        model=result.get("model")
    )
    db.add(ai_turn)
    
    # Update room phase
    if is_user1 and room.phase == "user1_intake":
        room.phase = "user1_coaching"
    elif not is_user1 and room.phase == "user2_lobby":
        room.phase = "user2_coaching"
    
    db.commit()

    # For User 2, include User 1's name and summary so frontend can display it properly
    other_user_name = None
    other_user_summary = None
    if not is_user1:
        user1 = room.participants[0]
        other_user_name = user1.name
        other_user_summary = room.user1_summary

    return StartCoachingResponse(
        ai_question=result["ai_question"],
        exchange_count=result["exchange_count"],
        room_phase=room.phase,
        other_user_name=other_user_name,
        other_user_summary=other_user_summary
    )


@router.post("/{room_id}/coach/respond", response_model=CoachingResponseOut)
def respond_to_coaching(
    room_id: int,
    payload: CoachingResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """User responds during coaching session."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Get coaching conversation history
    turns = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.user_id == current_user.id,
        Turn.user_id == current_user.id,
        Turn.context == "pre_mediation"
    ).order_by(Turn.created_at.asc()).all()
    
    # Build conversation for Claude
    conversation_history = []
    for turn in turns:
        if turn.kind == "ai_question":
            conversation_history.append({"role": "assistant", "content": turn.summary})
        else:
            conversation_history.append({"role": "user", "content": turn.summary})
    
    exchange_count = len([t for t in turns if t.kind == "user_response"])
    
    # Process response
    result = process_coaching_response(
        conversation_history,
        payload.user_message,
        exchange_count
    )
    
    # Save user response
    user_turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="user_response",
        summary=payload.user_message,
        context="pre_mediation",
        tags=["coaching"]
    )
    db.add(user_turn)
    
    if result.get("ready_to_finalize"):
        # Save polished summary
        # Determine User 1 vs User 2 based on who started coaching first (earliest turn)
        first_turn = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.context == "pre_mediation"
        ).order_by(Turn.created_at.asc()).first()

        is_user1 = (first_turn and first_turn.user_id == current_user.id)
        if is_user1:
            room.user1_summary = result["polished_summary"]
        else:
            room.user2_summary = result["polished_summary"]
    else:
        # Save next AI question with cost tracking
        ai_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="ai_question",
            summary=result["ai_question"],
            context="pre_mediation",
            tags=["coaching"],
            input_tokens=result.get("input_tokens", 0),
            output_tokens=result.get("output_tokens", 0),
            cost_usd=result.get("cost_usd", 0.0),
            model=result.get("model")
        )
        db.add(ai_turn)
    
    db.commit()
    
    return CoachingResponseOut(
        ai_question=result.get("ai_question"),
        ready_to_finalize=result.get("ready_to_finalize", False),
        polished_summary=result.get("polished_summary"),
        exchange_count=result["exchange_count"]
    )


@router.post("/{room_id}/coach/update-summary")
def update_coaching_summary(
    room_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's polished summary after coaching (allows editing before finalize)."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Determine if User 1 or User 2
    is_user1 = (room.participants[0].id == current_user.id)

    # Update the appropriate summary
    new_summary = payload.get("summary", "").strip()
    if not new_summary:
        raise HTTPException(status_code=400, detail="Summary cannot be empty")

    if is_user1:
        room.user1_summary = new_summary
    else:
        room.user2_summary = new_summary

    db.commit()

    return {"success": True, "message": "Summary updated"}


@router.post("/{room_id}/coach/finalize", response_model=FinalizeCoachingResponse)
def finalize_coaching(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Finalize coaching and generate invite link (User 1) or enter main room (User 2)."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Determine User 1 vs User 2 based on who started coaching first (earliest turn)
    first_turn = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.context == "pre_mediation"
    ).order_by(Turn.created_at.asc()).first()

    if not first_turn:
        raise HTTPException(status_code=400, detail="No coaching history found")

    # User who created first turn is User 1 (gets invite link)
    # User who joined via invite is User 2 (goes straight to main room)
    is_user1 = (first_turn.user_id == current_user.id)
    
    if is_user1:
        # Generate invite token
        if not room.invite_token:
            room.invite_token = generate_invite_token()
        
        # Update phase
        room.phase = "user2_lobby"
        db.commit()

        # Return invite link (frontend URL)
        # Use localhost for local development, Vercel for production
        from app.config import settings
        import os

        # Check if running in production (Railway has DATABASE_URL env var)
        is_production = "railway" in os.getenv("DATABASE_URL", "").lower() or settings.APP_ENV == "prod"
        frontend_url = "https://meedi8.vercel.app" if is_production else "http://localhost:5173"
        invite_link = f"{frontend_url}/join/{room.invite_token}"

        return FinalizeCoachingResponse(
            success=True,
            invite_link=invite_link,
            ready_for_main_room=False,
            user1_summary=room.user1_summary
        )
    else:
        # User 2 finished coaching - validate summary exists before proceeding
        if not room.user2_summary:
            raise HTTPException(
                status_code=400,
                detail="Coaching not complete. Please continue the conversation until you receive your summary."
            )

        room.phase = "main_room"
        db.commit()

        return FinalizeCoachingResponse(
            success=True,
            invite_link=None,
            ready_for_main_room=True
        )


@router.get("/{room_id}/lobby")
def get_room_phase(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current room phase for polling (used by User 1 to check if User 2 is ready)."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check if user is participant
    participant_ids = [p.id for p in room.participants]
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not a participant")

    return {"room_phase": room.phase, "room_id": room.id}


@router.get("/join/{invite_token}", response_model=LobbyInfoResponse)
def get_lobby_info(invite_token: str, db: Session = Depends(get_db)):
    """Get lobby information for User 2 (shows User 1's polished NVC summary)."""
    room = db.query(Room).filter(Room.invite_token == invite_token).first()
    if not room:
        raise HTTPException(status_code=404, detail="Invalid invite link")

    if room.phase not in ["user2_lobby", "user2_coaching", "main_room"]:
        raise HTTPException(status_code=400, detail="Room not ready for User 2")

    # Get User 1 info
    user1 = room.participants[0]

    # Show User 1's POLISHED NVC summary (after coaching), not raw initial issue
    user1_perspective = room.user1_summary if room.user1_summary else "User 1 is preparing their perspective."

    return LobbyInfoResponse(
        room_id=room.id,
        title=room.title,
        user1_issue=user1_perspective,
        user1_name=user1.name or user1.email
    )


@router.get("/{room_id}/main-room/summaries", response_model=MainRoomSummariesResponse)
def get_main_room_summaries(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get both polished summaries to display in main room + update presence."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room.phase not in ["main_room", "resolved"]:
        raise HTTPException(status_code=400, detail=f"Room not ready. Current phase: {room.phase}")

    participants = room.participants
    if len(participants) < 2:
        raise HTTPException(status_code=400, detail="Need two participants")

    # CRITICAL: Determine user1/user2 by who initiated (has pre_mediation turns first)
    # Find the earliest pre_mediation turn to determine who started coaching first
    first_turn = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.context == "pre_mediation"
    ).order_by(Turn.created_at.asc()).first()

    if not first_turn:
        # Fallback if no coaching history
        user1 = participants[0]
        user2 = participants[1]
    else:
        # User who created the first turn is User 1
        user1_id = first_turn.user_id
        user1 = next((p for p in participants if p.id == user1_id), participants[0])
        user2 = next((p for p in participants if p.id != user1_id), participants[1])

    # Update presence timestamp for current user
    from datetime import datetime, timedelta
    now = datetime.now()
    if current_user.id == user1.id:
        room.user1_last_seen_main_room = now
    elif current_user.id == user2.id:
        room.user2_last_seen_main_room = now
    db.commit()

    # Check if users are present (within last minute)
    user1_present = False
    user2_present = False
    if room.user1_last_seen_main_room:
        user1_present = (now - room.user1_last_seen_main_room.replace(tzinfo=None)) < timedelta(minutes=1)
    if room.user2_last_seen_main_room:
        user2_present = (now - room.user2_last_seen_main_room.replace(tzinfo=None)) < timedelta(minutes=1)

    return MainRoomSummariesResponse(
        user1_id=user1.id,
        user1_name=clean_user_name(user1),
        user1_summary=room.user1_summary or "No summary available",
        user2_id=user2.id,
        user2_name=clean_user_name(user2),
        user2_summary=room.user2_summary or "No summary available",
        room_title=room.title,
        invite_token=room.invite_token or "",
        user1_present=user1_present,
        user2_present=user2_present
    )


@router.post("/{room_id}/main-room/start", response_model=MainRoomStartResponse)
def start_main_room_session(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start the main room mediation session (idempotent - safe to call multiple times)."""
    try:
        # Lock the room row to prevent race condition when both users enter simultaneously
        room = db.query(Room).filter(Room.id == room_id).with_for_update().first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        if room.phase not in ["main_room", "resolved"]:
            raise HTTPException(status_code=400, detail="Not ready for main room")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Database query failed in start_main_room: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

    try:
        participants = room.participants

        # CRITICAL: Determine user1/user2 by who initiated (has pre_mediation turns first)
        # Find the earliest pre_mediation turn to determine who started coaching first
        first_turn = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.context == "pre_mediation"
        ).order_by(Turn.created_at.asc()).first()

        if not first_turn:
            # Fallback if no coaching history
            user1 = participants[0]
            user2 = participants[1]
        else:
            # User who created the first turn is User 1
            user1_id = first_turn.user_id
            user1 = next((p for p in participants if p.id == user1_id), participants[0])
            user2 = next((p for p in participants if p.id != user1_id), participants[1])
    except Exception as e:
        import traceback
        error_detail = f"Failed to determine user1/user2: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

    try:
        # Check if conversation already started (CRITICAL: prevents duplicates when both users enter)
        # Query inside the locked transaction to prevent race condition
        existing_turns = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.context == "main",
            Turn.kind == "ai_question",
            cast(Turn.tags, String).like('%main_room_start%')  # PostgreSQL-compatible JSON query
        ).order_by(Turn.created_at.asc()).all()
    except Exception as e:
        import traceback
        error_detail = f"Failed to query existing turns: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

    if existing_turns:
        # Already started - return existing state
        opening = next((t for t in existing_turns if t.kind == "ai_question"), None)
        if opening:
            # Determine current speaker based on conversation history
            user_responses = [t for t in existing_turns if t.kind == "user_response"]
            if not user_responses:
                # No responses yet, user1 should start
                current_speaker = user1.id
            else:
                # Alternate: last responder was user X, so now it's the other user's turn
                last_responder = user_responses[-1].user_id
                current_speaker = user2.id if last_responder == user1.id else user1.id
            
            return MainRoomStartResponse(
                opening_message=opening.summary,
                current_speaker_id=current_speaker,
                next_turn="user1" if current_speaker == user1.id else "user2"
            )
    
    # Generate opening for first time
    # Clean names in summaries (replace "dave dave" -> "dave", etc.)
    try:
        user1_clean_name = clean_user_name(user1)
        user2_clean_name = clean_user_name(user2)
    except Exception as e:
        import traceback
        error_detail = f"Failed to clean user names: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

    # Check that both users have completed coaching
    if not room.user1_summary or not room.user2_summary:
        raise HTTPException(
            status_code=400,
            detail="Both users must complete coaching before starting main room"
        )

    # Pass summaries directly to AI - no placeholder replacement needed
    try:
        result = start_main_room(
            room.user1_summary,
            room.user2_summary,
            user1_clean_name,
            user2_clean_name,
            room.category
        )
    except Exception as e:
        import traceback
        error_detail = f"AI service (start_main_room) failed - check ANTHROPIC_API_KEY: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)
    
    # Save opening message (only once)
    # Double-check one more time before creating to handle race condition
    try:
        final_check = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.context == "main",
            Turn.kind == "ai_question"
        ).first()

        if final_check:
            # Another request beat us to it - return that opening message
            return MainRoomStartResponse(
                opening_message=final_check.summary,
                current_speaker_id=user1.id,
                next_turn="user1"
            )

        opening_turn = Turn(
            room_id=room_id,
            user_id=user1.id,  # Use user1.id not current_user (for consistency)
            kind="ai_question",
            summary=result["opening_message"],
            context="main",
            tags=["main_room_start"]
        )
        db.add(opening_turn)
        db.commit()
    except Exception as e:
        import traceback
        db.rollback()
        error_detail = f"Failed to save opening turn (check if attachment/solo columns exist): {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

    # ALWAYS user1 (who initiated) speaks first
    first_speaker_id = user1.id

    return MainRoomStartResponse(
        opening_message=result["opening_message"],
        current_speaker_id=first_speaker_id,
        next_turn="user1" if result["first_speaker"] == "user1" else "user2"
    )


@router.post("/{room_id}/main-room/respond", response_model=MainRoomRespondResponse)
def respond_main_room(
    room_id: int,
    payload: MainRoomRespondRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """User responds in main room, AI guides conversation."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Get conversation history from main room
    turns = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.context == "main"
    ).order_by(Turn.created_at.asc()).all()

    # Get user names FIRST (need them for building history)
    participants = room.participants
    user1 = participants[0]
    user2 = participants[1]

    current_user_name = clean_user_name(current_user)
    other_user = user2 if current_user.id == user1.id else user1
    other_user_name = clean_user_name(other_user)

    # Build conversation for Claude with speaker names for ALL messages
    # IMPORTANT: Clean ALL instances of duplicate names (like "dave dave" -> "dave")
    user1_clean = clean_user_name(user1)
    user2_clean = clean_user_name(user2)

    conversation_history = []
    for turn in turns:
        if turn.kind == "ai_question":
            # Clean AI responses too (they might contain "dave dave" from previous turns)
            ai_content = turn.summary

            # Replace any instances of full duplicate names with clean first name
            if user1.name and ' ' in user1.name:
                words = user1.name.split()
                if len(words) >= 2 and words[0].lower() == words[1].lower():
                    ai_content = ai_content.replace(user1.name, user1_clean)
                    ai_content = ai_content.replace(user1.name.lower(), user1_clean.lower())
                    ai_content = ai_content.replace(user1.name.title(), user1_clean.title())

            if user2.name and ' ' in user2.name:
                words = user2.name.split()
                if len(words) >= 2 and words[0].lower() == words[1].lower():
                    ai_content = ai_content.replace(user2.name, user2_clean)
                    ai_content = ai_content.replace(user2.name.lower(), user2_clean.lower())
                    ai_content = ai_content.replace(user2.name.title(), user2_clean.title())

            conversation_history.append({"role": "assistant", "content": ai_content})
        else:
            # Include user response without any placeholder
            conversation_history.append({"role": "user", "content": turn.summary})
    
    exchange_count = len([t for t in turns if t.kind == "user_response"])

    # Get breathing break count
    breathing_break_count = room.breathing_break_count or 0

    # Process response with strict turn-by-turn and breathing break support
    result = process_main_room_response(
        conversation_history,
        payload.message,
        current_user_name,  # Pass actual first name
        other_user_name,    # Pass actual first name
        exchange_count,
        0,  # consecutive_count not used anymore
        breathing_break_count
    )

    # SAFETY NET: Clean AI response in case it still generated duplicate names
    if result.get("ai_response"):
        ai_response_cleaned = result["ai_response"]

        # Replace any duplicate name patterns
        if user1.name and ' ' in user1.name:
            words = user1.name.split()
            if len(words) >= 2 and words[0].lower() == words[1].lower():
                ai_response_cleaned = ai_response_cleaned.replace(user1.name, user1_clean)
                ai_response_cleaned = ai_response_cleaned.replace(user1.name.lower(), user1_clean.lower())
                ai_response_cleaned = ai_response_cleaned.replace(user1.name.title(), user1_clean.title())

        if user2.name and ' ' in user2.name:
            words = user2.name.split()
            if len(words) >= 2 and words[0].lower() == words[1].lower():
                ai_response_cleaned = ai_response_cleaned.replace(user2.name, user2_clean)
                ai_response_cleaned = ai_response_cleaned.replace(user2.name.lower(), user2_clean.lower())
                ai_response_cleaned = ai_response_cleaned.replace(user2.name.title(), user2_clean.title())

        result["ai_response"] = ai_response_cleaned

    # Save user message
    user_turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="user_response",
        summary=payload.message,
        context="main",
        tags=["main_room"]
    )
    db.add(user_turn)

    # Handle breathing break
    if result.get("breathing_break"):
        # Increment breathing break counter and set timestamp
        room.breathing_break_count = (room.breathing_break_count or 0) + 1
        room.last_breathing_break_at = func.now()
        db.commit()

        # Return breathing break response (don't save as turn - only show in modal)
        return MainRoomRespondResponse(
            ai_response=result["ai_response"],
            resolution=None,
            next_speaker_id=None,
            addressed_user_name=None,
            session_complete=False,
            breathing_break=True,
            breathing_break_count=room.breathing_break_count
        )

    # Save AI response or resolution
    if result.get("resolution"):
        resolution_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="resolution",
            summary=result["resolution"],
            context="main",
            tags=["main_room", "resolution"],
            input_tokens=result.get("input_tokens", 0),
            output_tokens=result.get("output_tokens", 0),
            cost_usd=result.get("cost_usd", 0.0),
            model=result.get("model")
        )
        db.add(resolution_turn)
        room.phase = "resolved"
        room.resolution_text = result["resolution"]
        room.resolved_at = func.now()
        # Set check-in date to 1 week from now
        from datetime import date, timedelta
        room.check_in_date = date.today() + timedelta(days=7)
        # Reset deep exploration tracking
        room.last_speaker_id = None
        room.consecutive_questions_to_same = 0
    elif result.get("ai_response"):
        ai_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="ai_question",
            summary=result["ai_response"],
            context="main",
            tags=["main_room"],
            input_tokens=result.get("input_tokens", 0),
            output_tokens=result.get("output_tokens", 0),
            cost_usd=result.get("cost_usd", 0.0),
            model=result.get("model")
        )
        db.add(ai_turn)

    db.commit()

    # Respect AI's next_speaker decision (SAME or OTHER)
    if result.get("next_speaker") == "SAME":
        # AI wants to ask current speaker a follow-up question
        next_speaker_id = current_user.id
        addressed_user_name = current_user_name
    else:
        # AI wants to switch to other person (default behavior)
        next_speaker_id = other_user.id
        addressed_user_name = other_user_name

    print(f"\n=== TURN-TAKING DEBUG (AI-Driven) ===")
    print(f"Current speaker: {current_user_name} (ID: {current_user.id})")
    print(f"AI decision: {result.get('next_speaker', 'OTHER')}")
    print(f"Next speaker: {addressed_user_name} (ID: {next_speaker_id})")
    print(f"User1: {clean_user_name(user1)} (ID: {user1.id})")
    print(f"User2: {clean_user_name(user2)} (ID: {user2.id})")
    if result.get("next_speaker") == "SAME":
        print(f"✓ STAYING with {current_user_name} for follow-up")
    else:
        print(f"✓ SWITCHING from {current_user_name} -> {addressed_user_name}")
    print(f"=========================\n")

    if result.get("session_complete"):
        next_speaker_id = None
        addressed_user_name = None

    # Send email notification to next speaker (if they're not the current user)
    if next_speaker_id and next_speaker_id != current_user.id:
        next_speaker = other_user  # We already determined this above
        try:
            send_turn_notification(
                to_email=next_speaker.email,
                to_name=clean_user_name(next_speaker),
                room_id=room_id,
                other_person_name=current_user_name
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"⚠️  Failed to send email notification: {e}")

    return MainRoomRespondResponse(
        ai_response=result.get("ai_response"),
        resolution=result.get("resolution"),
        next_speaker_id=next_speaker_id,
        addressed_user_name=addressed_user_name,
        session_complete=result.get("session_complete", False)
    )

@router.get("/", response_model=list)
def list_my_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all rooms where the current user is a participant."""
    rooms = db.query(Room).join(Room.participants).filter(
        User.id == current_user.id
    ).order_by(Room.created_at.desc()).all()

    return [
        {
            "id": room.id,
            "title": room.title,
            "phase": room.phase,
            "created_at": room.created_at.isoformat()
        }
        for room in rooms
    ]

@router.get("/my-sessions")
def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active sessions with detailed status for dashboard."""
    rooms = db.query(Room).join(Room.participants).filter(
        User.id == current_user.id
    ).order_by(Room.created_at.desc()).all()

    result = []
    for room in rooms:
        participants = room.participants

        # Determine if current user is user1 (room creator) or user2
        is_user1 = len(participants) > 0 and participants[0].id == current_user.id

        # Get other participant info
        user1_name = None
        user2_name = None
        if len(participants) > 0:
            user1_name = participants[0].name
        if len(participants) > 1:
            user2_name = participants[1].name

        result.append({
            "id": room.id,
            "title": room.title,
            "phase": room.phase,
            "created_at": room.created_at.isoformat(),
            "is_user1": is_user1,
            "user1_name": user1_name,
            "user2_name": user2_name,
            "user1_summary": room.user1_summary,
            "user2_summary": room.user2_summary
        })

    return {"rooms": result}

@router.get("/{room_id}/main-room/messages")
def get_main_room_messages(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages from main room conversation."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check user is participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all main room messages
    turns = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.context == "main"
    ).order_by(Turn.created_at.asc()).all()
    
    # CRITICAL: Determine user1/user2 by who has which summary, not participant order!
    # participants list is ordered by ID, not by who initiated
    participants = room.participants

    # Find who is user1 (has user1_summary) vs user2 (has user2_summary)
    # User1 is whoever completed coaching first / initiated
    # Find the earliest pre_mediation turn to determine who started coaching first
    first_turn = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.context == "pre_mediation"
    ).order_by(Turn.created_at.asc()).first()

    if not first_turn:
        # Fallback if no coaching history
        user1 = participants[0]
        user2 = participants[1]
    else:
        # User who created the first turn is User 1
        user1_id = first_turn.user_id
        user1 = next((p for p in participants if p.id == user1_id), participants[0])
        user2 = next((p for p in participants if p.id != user1_id), participants[1])
    
    messages = []
    for turn in turns:
        if turn.kind == "ai_question":
            messages.append({
                "role": "assistant",
                "content": turn.summary
            })
        elif turn.kind == "resolution":
            messages.append({
                "role": "resolution",
                "content": turn.summary
            })
        else:
            msg = {
                "role": "user",
                "content": turn.summary,
                "userId": turn.user_id
            }
            # Include audio URL if this was a voice message
            if turn.audio_url:
                msg["audioUrl"] = turn.audio_url
            # Include attachment info if this message has a file
            if turn.attachment_url:
                msg["attachmentUrl"] = turn.attachment_url
                msg["attachmentFilename"] = turn.attachment_filename
            messages.append(msg)
    
    # Determine current speaker (alternates)
    user_messages = [t for t in turns if t.kind == "user_response"]
    if not user_messages:
        # No responses yet - user1 (initiator) goes first
        next_speaker_id = user1.id
    else:
        # Alternate: if last speaker was user1, now it's user2's turn
        last_user_id = user_messages[-1].user_id
        next_speaker_id = user2.id if last_user_id == user1.id else user1.id
    
    # Include break information
    break_info = None
    if room.break_requested_by_id:
        break_requester = db.query(User).filter(User.id == room.break_requested_by_id).first()
        if break_requester:
            break_info = {
                "requested_by_id": room.break_requested_by_id,
                "requested_by_name": break_requester.name,
                "requested_at": room.break_requested_at.isoformat() if room.break_requested_at else None
            }

    return {
        "messages": messages,
        "current_speaker_id": next_speaker_id,
        "session_complete": room.phase == "resolved",
        "break_info": break_info
    }


@router.post("/{room_id}/request-break")
def request_break(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request a breathing break in the main room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check user is participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Set break state
    room.break_requested_by_id = current_user.id
    room.break_requested_at = func.now()
    db.commit()

    # Send email notification to other participant
    other_participant = next((p for p in room.participants if p.id != current_user.id), None)
    if other_participant:
        try:
            send_break_notification(
                to_email=other_participant.email,
                to_name=clean_user_name(other_participant),
                room_id=room_id,
                requester_name=clean_user_name(current_user)
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"⚠️  Failed to send break notification email: {e}")

    return {"status": "break_requested"}


@router.post("/{room_id}/clear-break")
def clear_break(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear the breathing break in the main room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check user is participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Clear break state
    room.break_requested_by_id = None
    room.break_requested_at = None
    db.commit()

    return {"status": "break_cleared"}


@router.get("/admin/costs")
def get_cost_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed cost statistics for all mediations."""
    from sqlalchemy import func, text
    
    # Total costs
    total_result = db.execute(
        text("SELECT COALESCE(SUM(cost_usd), 0) as total_cost, COALESCE(SUM(input_tokens), 0) as total_input, COALESCE(SUM(output_tokens), 0) as total_output FROM turns WHERE cost_usd > 0")
    ).first()
    
    # Cost per room
    room_costs = db.execute(text("""
        SELECT 
            r.id as room_id,
            r.title,
            r.phase,
            COUNT(DISTINCT t.id) as ai_calls,
            COALESCE(SUM(t.input_tokens), 0) as input_tokens,
            COALESCE(SUM(t.output_tokens), 0) as output_tokens,
            COALESCE(SUM(t.cost_usd), 0) as total_cost
        FROM rooms r
        LEFT JOIN turns t ON r.id = t.room_id AND t.cost_usd > 0
        GROUP BY r.id, r.title, r.phase
        HAVING COALESCE(SUM(t.cost_usd), 0) > 0
        ORDER BY total_cost DESC
        LIMIT 50
    """)).fetchall()
    
    # Average cost by phase
    phase_costs = db.execute(text("""
        SELECT 
            t.context as phase,
            COUNT(*) as ai_calls,
            AVG(t.cost_usd) as avg_cost,
            SUM(t.cost_usd) as total_cost
        FROM turns t
        WHERE t.cost_usd > 0
        GROUP BY t.context
    """)).fetchall()
    
    # Cost per completed mediation
    completed_rooms = db.execute(text("""
        SELECT 
            COUNT(*) as completed_count,
            AVG(room_total) as avg_cost_per_mediation
        FROM (
            SELECT r.id, SUM(t.cost_usd) as room_total
            FROM rooms r
            JOIN turns t ON r.id = t.room_id
            WHERE r.phase = 'resolved' AND t.cost_usd > 0
            GROUP BY r.id
        ) as room_costs
    """)).first()
    
    return {
        "total_statistics": {
            "total_cost_usd": float(total_result[0] or 0),
            "total_input_tokens": int(total_result[1] or 0),
            "total_output_tokens": int(total_result[2] or 0),
            "total_tokens": int((total_result[1] or 0) + (total_result[2] or 0))
        },
        "completed_mediations": {
            "count": int(completed_rooms[0] or 0) if completed_rooms else 0,
            "avg_cost_per_mediation": float(completed_rooms[1] or 0) if completed_rooms and completed_rooms[1] else 0
        },
        "cost_by_phase": [
            {
                "phase": row[0],
                "ai_calls": int(row[1]),
                "avg_cost": float(row[2]),
                "total_cost": float(row[3])
            }
            for row in phase_costs
        ],
        "top_rooms_by_cost": [
            {
                "room_id": row[0],
                "title": row[1],
                "phase": row[2],
                "ai_calls": int(row[3]),
                "input_tokens": int(row[4] or 0),
                "output_tokens": int(row[5] or 0),
                "total_cost": float(row[6])
            }
            for row in room_costs
        ]
    }

@router.get("/{room_id}/status")
def get_room_status(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current room status (lightweight endpoint for polling)"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check user is participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "id": room.id,
        "phase": room.phase
    }


@router.get("/{room_id}")
def get_room_details(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get room details including resolution"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check user is participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "id": room.id,
        "title": room.title,
        "phase": room.phase,
        "user1_summary": room.user1_summary,
        "user2_summary": room.user2_summary,
        "invite_token": room.invite_token,
        "resolution_text": room.resolution_text,
        "resolved_at": room.resolved_at.isoformat() if room.resolved_at else None,
        "check_in_date": room.check_in_date.isoformat() if room.check_in_date else None,
        "created_at": room.created_at.isoformat()
    }


# ========================================
# EVIDENCE UPLOAD ENDPOINT
# ========================================

from typing import List as TypingList

@router.post("/{room_id}/upload-evidence")
async def upload_evidence(
    room_id: int,
    files: TypingList[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload evidence files (screenshots, documents) for AI review."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check if user is participant
    participant_ids = [p.id for p in room.participants]
    if current_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Upload files to S3
    from app.services.s3_service import upload_file_to_s3

    uploaded_files = []
    for file in files:
        try:
            # Read file content
            file_content = await file.read()

            # Upload to S3
            file_url = upload_file_to_s3(
                file_content,
                room_id,
                current_user.id,
                file.filename,
                file.content_type or "application/octet-stream"
            )

            uploaded_files.append({
                "filename": file.filename,
                "url": file_url,
                "content_type": file.content_type
            })

            print(f"Evidence uploaded: {file.filename} -> {file_url}")

        except Exception as e:
            print(f"Error uploading {file.filename}: {e}")
            # Continue with other files

    return {"success": True, "files": uploaded_files}

# ========================================
# VOICE RECORDING ENDPOINTS
# ========================================

@router.post("/{room_id}/coach/voice-respond", response_model=CoachingResponseOut)
async def voice_respond_coaching(
    room_id: int,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_current_subscription)
):
    """
    Upload voice recording for coaching session.
    Audio is transcribed via Whisper, then processed like text coaching.
    """
    # Check subscription access
    access = require_feature_access(subscription, "voice_recording")

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    try:
        # Read audio file
        audio_bytes = await audio.read()
        audio_file = io.BytesIO(audio_bytes)

        # Transcribe with Whisper
        transcription_result = transcribe_audio(audio_file, audio.filename)
        transcribed_text = transcription_result["text"]
        audio_duration = transcription_result.get("duration", len(audio_bytes) / 16000)  # Estimate if not available

        # Calculate and track Whisper cost
        whisper_cost = calculate_whisper_cost(audio_duration)
        track_api_cost(
            db=db,
            user_id=current_user.id,
            service_type="openai_whisper",
            cost_usd=whisper_cost,
            room_id=room_id,
            audio_seconds=audio_duration,
            model="whisper-1"
        )

        # Get coaching conversation history
        turns = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.user_id == current_user.id,
            Turn.context == "pre_mediation"
        ).order_by(Turn.created_at.asc()).all()

        # Build conversation for Claude
        conversation_history = []
        for turn in turns:
            if turn.kind == "ai_question":
                conversation_history.append({"role": "assistant", "content": turn.summary})
            else:
                conversation_history.append({"role": "user", "content": turn.summary})

        exchange_count = len([t for t in turns if t.kind == "user_response"])

        # Process transcribed response through coaching
        result = process_coaching_response(
            conversation_history,
            transcribed_text,
            exchange_count
        )

        # Upload audio to S3
        from app.services.s3_service import upload_audio_to_s3
        audio_url = upload_audio_to_s3(audio_bytes, room_id, current_user.id, audio.filename)

        # Save user response (with transcription note and audio URL)
        user_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="user_response",
            summary=transcribed_text,
            context="pre_mediation",
            tags=["voice_recording"],
            audio_url=audio_url
        )
        db.add(user_turn)

        # Save AI response with cost tracking
        if not result.get("ready_to_finalize"):
            ai_turn = Turn(
                room_id=room_id,
                user_id=current_user.id,
                kind="ai_question",
                summary=result["ai_question"],
                context="pre_mediation",
                tags=["coaching"],
                input_tokens=result.get("input_tokens", 0),
                output_tokens=result.get("output_tokens", 0),
                cost_usd=result.get("cost_usd", 0.0),
                model=result.get("model")
            )
            db.add(ai_turn)

            # Track Anthropic cost
            track_api_cost(
                db=db,
                user_id=current_user.id,
                service_type="anthropic",
                cost_usd=result.get("cost_usd", 0.0),
                room_id=room_id,
                turn_id=ai_turn.id,
                input_tokens=result.get("input_tokens", 0),
                output_tokens=result.get("output_tokens", 0),
                model=result.get("model")
            )

        db.commit()

        # Increment voice usage for free tier (if applicable)
        if access.get("is_trial"):
            increment_voice_usage(db, current_user.id)

        return CoachingResponseOut(
            ready_to_finalize=result.get("ready_to_finalize", False),
            ai_question=result.get("ai_question"),
            polished_summary=result.get("polished_summary"),
            exchange_count=result.get("exchange_count", exchange_count + 1),
            transcribed_text=transcribed_text  # Return transcription for user verification
        )

    except Exception as e:
        print(f"Voice transcription error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process voice recording: {str(e)}"
        )


@router.post("/{room_id}/main-room/voice-respond", response_model=MainRoomRespondResponse)
async def voice_respond_main_room(
    room_id: int,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_current_subscription)
):
    """
    Upload voice recording for main room mediation.
    Audio is transcribed via Whisper, then processed like text response.
    """
    # Check subscription access
    access = require_feature_access(subscription, "voice_recording")

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    try:
        # Read and transcribe audio
        audio_bytes = await audio.read()
        audio_file = io.BytesIO(audio_bytes)

        transcription_result = transcribe_audio(audio_file, audio.filename)
        transcribed_text = transcription_result["text"]
        audio_duration = transcription_result.get("duration", len(audio_bytes) / 16000)

        # Track Whisper cost
        whisper_cost = calculate_whisper_cost(audio_duration)
        track_api_cost(
            db=db,
            user_id=current_user.id,
            service_type="openai_whisper",
            cost_usd=whisper_cost,
            room_id=room_id,
            audio_seconds=audio_duration,
            model="whisper-1"
        )

        # Get conversation history
        turns = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.context == "main"
        ).order_by(Turn.created_at.asc()).all()

        # Get user names FIRST (need them for building history)
        participants = room.participants
        user1 = participants[0]
        user2 = participants[1]

        current_user_name = clean_user_name(current_user)
        other_user = user2 if current_user.id == user1.id else user1
        other_user_name = clean_user_name(other_user)

        # Build conversation for Claude with speaker names for ALL messages
        conversation_history = []
        for turn in turns:
            if turn.kind == "ai_question":
                conversation_history.append({"role": "assistant", "content": turn.summary})
            else:
                # Include speaker name in user messages so AI knows who's talking
                speaker_name = clean_user_name(user1) if turn.user_id == user1.id else clean_user_name(user2)
                conversation_history.append({"role": "user", "content": f"{speaker_name}: {turn.summary}"})

        exchange_count = len([t for t in turns if t.kind == "user_response"])

        # Process through mediator
        result = process_main_room_response(
            conversation_history,
            transcribed_text,
            current_user_name,
            other_user_name,
            exchange_count
        )

        # Upload audio to S3
        from app.services.s3_service import upload_audio_to_s3
        audio_url = upload_audio_to_s3(audio_bytes, room_id, current_user.id, audio.filename)

        # Save user turn with audio URL
        user_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="user_response",
            summary=transcribed_text,
            context="main",
            tags=["main_room", "voice_recording"],
            audio_url=audio_url
        )
        db.add(user_turn)

        # Save AI response or resolution
        if result.get("resolution"):
            resolution_turn = Turn(
                room_id=room_id,
                user_id=current_user.id,
                kind="resolution",
                summary=result["resolution"],
                context="main",
                tags=["main_room", "resolution"],
                input_tokens=result.get("input_tokens", 0),
                output_tokens=result.get("output_tokens", 0),
                cost_usd=result.get("cost_usd", 0.0),
                model=result.get("model")
            )
            db.add(resolution_turn)
            room.phase = "resolved"
            room.resolution_text = result["resolution"]
            room.resolved_at = func.now()
            from datetime import date, timedelta
            room.check_in_date = date.today() + timedelta(days=7)
        elif result.get("ai_response"):
            ai_turn = Turn(
                room_id=room_id,
                user_id=current_user.id,
                kind="ai_question",
                summary=result["ai_response"],
                context="main",
                tags=["main_room"],
                input_tokens=result.get("input_tokens", 0),
                output_tokens=result.get("output_tokens", 0),
                cost_usd=result.get("cost_usd", 0.0),
                model=result.get("model")
            )
            db.add(ai_turn)

        db.commit()

        # Increment voice usage
        if access.get("is_trial"):
            increment_voice_usage(db, current_user.id)

        # Determine next speaker using signals from AI service (no name parsing!)
        next_speaker_signal = result.get("next_speaker", "OTHER")

        # Convert signal to actual user ID
        if next_speaker_signal == "SAME":
            # Stay with current speaker
            next_speaker_id = current_user.id
        elif next_speaker_signal == "OTHER":
            # Switch to other user
            next_speaker_id = other_user.id
        else:
            # Fallback: alternate turns
            next_speaker_id = other_user.id

        if result.get("session_complete"):
            next_speaker_id = None

        return MainRoomRespondResponse(
            ai_response=result.get("ai_response"),
            resolution=result.get("resolution"),
            next_speaker_id=next_speaker_id,
            session_complete=result.get("session_complete", False)
        )

    except Exception as e:
        print(f"Voice transcription error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process voice recording: {str(e)}"
        )


@router.post("/{room_id}/main-room/upload-file")
async def upload_file_main_room(
    room_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file (image, PDF, document) to main room.
    File is stored in S3 and visible to both users in the chat.
    """
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Read file bytes for validation
    file_bytes = await file.read()
    file_size_bytes = len(file_bytes)

    # PAYWALL: Check file upload allowed and enforce size limits by tier
    check_file_upload_allowed(current_user.id, file_size_bytes, db)

    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'}
    file_extension = '.' + file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}")

    try:
        # Upload to S3
        from app.services.s3_service import upload_file_to_s3
        file_url = upload_file_to_s3(
            file_bytes=file_bytes,
            room_id=room_id,
            user_id=current_user.id,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream"
        )

        # Analyze image if it's an image file
        summary_text = f"[Uploaded file: {file.filename}]"
        input_tokens = 0
        output_tokens = 0
        model_used = None
        cost_usd = 0.0

        # Check if file is an image
        is_image = file_extension.lower() in {'.jpg', '.jpeg', '.png', '.gif'}

        if is_image:
            try:
                from app.services.image_analysis import analyze_image
                from app.services.cost_tracker import calculate_anthropic_cost
                analysis = await analyze_image(file_url, file.filename)
                summary_text = analysis['description']
                input_tokens = analysis['input_tokens']
                output_tokens = analysis['output_tokens']
                model_used = analysis['model']
                cost_usd = calculate_anthropic_cost(input_tokens, output_tokens, model_used) if input_tokens > 0 else 0.0
            except Exception as e:
                print(f"Image analysis failed: {e}")
                # Fall back to placeholder if analysis fails
                summary_text = f"[Uploaded image: {file.filename}]"

        # Create a turn with the file attachment
        file_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="user_response",
            summary=summary_text,
            context="main",
            tags=["main_room", "file_upload", "image" if is_image else "document"],
            attachment_url=file_url,
            attachment_filename=file.filename,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost_usd,
            model=model_used
        )
        db.add(file_turn)
        db.commit()

        # Track API cost if image was analyzed
        if is_image and input_tokens > 0:
            from app.services.cost_tracker import track_api_cost
            track_api_cost(
                db=db,
                user_id=current_user.id,
                service_type="anthropic",
                cost_usd=cost_usd,
                room_id=room_id,
                turn_id=file_turn.id,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                model=model_used
            )

        return {
            "success": True,
            "file_url": file_url,
            "filename": file.filename,
            "message": "File uploaded successfully"
        }

    except Exception as e:
        print(f"File upload error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )


from pydantic import BaseModel

class TelegramImportRequest(BaseModel):
    download_id: int
    chat_name: str
    message_count: int

@router.post("/{room_id}/main-room/telegram-import")
async def import_telegram_conversation(
    room_id: int,
    payload: TelegramImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import a downloaded Telegram conversation into the main room.
    Creates a turn with the Telegram data that both users can view.
    """
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    try:
        # Get the Telegram download with messages
        from app.models.telegram import TelegramDownload
        download = db.query(TelegramDownload).filter(
            TelegramDownload.id == payload.download_id,
            TelegramDownload.user_id == current_user.id,
            TelegramDownload.status == "completed"
        ).first()

        if not download:
            raise HTTPException(status_code=404, detail="Download not found or not completed")

        # Create summary for the turn
        summary_text = f"📱 Imported Telegram conversation: '{payload.chat_name}' ({payload.message_count} messages)"

        # Create a turn with Telegram metadata
        telegram_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="telegram_import",
            summary=summary_text,
            context="main",
            tags=["main_room", "telegram_import"],
            # Store download_id in text field for reference
            text=str(payload.download_id)
        )
        db.add(telegram_turn)
        db.commit()

        return {
            "success": True,
            "turn_id": telegram_turn.id,
            "download_id": payload.download_id,
            "message": "Telegram conversation imported successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Telegram import error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to import Telegram conversation: {str(e)}"
        )


# ============================================
# SOLO MODE ENDPOINTS
# ============================================

@router.post("/{room_id}/solo/start")
def start_solo_coaching(
    room_id: int,
    payload: StartCoachingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start Solo coaching session for self-reflection and conflict processing."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check if user is participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Verify this is a solo room
    if room.room_type != 'solo':
        raise HTTPException(status_code=400, detail="This endpoint is for Solo mode only")

    # Get user's name for personalization
    user_name = clean_user_name(current_user)

    # Start Solo session
    result = start_solo_session(payload.initial_message, user_name)

    # Save initial turn (intake)
    turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="intake",
        summary=payload.initial_message,
        context="solo",
        tags=["solo_start"]
    )
    db.add(turn)

    # Save AI response with cost tracking
    ai_turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="ai_question",
        summary=result["ai_response"],
        context="solo",
        tags=["solo"],
        input_tokens=result.get("input_tokens", 0),
        output_tokens=result.get("output_tokens", 0),
        cost_usd=result.get("cost_usd", 0.0),
        model=result.get("model")
    )
    db.add(ai_turn)

    # Update room phase
    if room.phase == "solo_intake":
        room.phase = "solo_reflection"

    db.commit()

    return {
        "ai_response": result["ai_response"],
        "ready_for_clarity": result.get("ready_for_clarity", False),
        "room_phase": room.phase
    }


@router.post("/{room_id}/solo/respond")
async def respond_solo_coaching(
    room_id: int,
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_current_subscription)
):
    """Process Solo response (text or audio). Returns ai_response or clarity_summary."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Verify this is a solo room
    if room.room_type != 'solo':
        raise HTTPException(status_code=400, detail="This endpoint is for Solo mode only")

    # Process audio if provided
    transcribed_text = None
    audio_url = None
    if audio:
        # Check subscription access for voice
        access = require_feature_access(subscription, "voice_recording")

        try:
            # Read and transcribe audio
            audio_bytes = await audio.read()
            audio_file = io.BytesIO(audio_bytes)

            transcription_result = transcribe_audio(audio_file, audio.filename)
            transcribed_text = transcription_result["text"]
            text = transcribed_text  # Use transcription as text
            audio_duration = transcription_result.get("duration", len(audio_bytes) / 16000)

            # Track Whisper cost
            whisper_cost = calculate_whisper_cost(audio_duration)
            track_api_cost(
                db=db,
                user_id=current_user.id,
                service_type="openai_whisper",
                cost_usd=whisper_cost,
                room_id=room_id,
                audio_seconds=audio_duration,
                model="whisper-1"
            )

            # Upload audio to S3
            from app.services.s3_service import upload_audio_to_s3
            audio_url = upload_audio_to_s3(audio_bytes, room_id, current_user.id, audio.filename)

            # Increment voice usage for free tier
            if access.get("is_trial"):
                increment_voice_usage(db, current_user.id)

        except Exception as e:
            print(f"Voice transcription error: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process voice recording: {str(e)}"
            )

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Response text is required")

    # Get Solo conversation history
    turns = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.user_id == current_user.id,
        Turn.context == "solo"
    ).order_by(Turn.created_at.asc()).all()

    # Build conversation for Claude
    conversation_history = []
    for turn in turns:
        if turn.kind == "ai_question":
            conversation_history.append({"role": "assistant", "content": turn.summary})
        else:
            conversation_history.append({"role": "user", "content": turn.summary})

    # Get user's name
    user_name = clean_user_name(current_user)

    # Process response through Solo coach
    result = process_solo_response(conversation_history, text, user_name)

    # Save user response
    user_turn = Turn(
        room_id=room_id,
        user_id=current_user.id,
        kind="user_response",
        summary=text,
        context="solo",
        tags=["solo", "voice_recording"] if audio_url else ["solo"],
        audio_url=audio_url
    )
    db.add(user_turn)

    # If ready for clarity, save clarity summary to Room
    if result.get("ready_for_clarity"):
        room.clarity_summary = result["clarity_summary"]
        room.key_insights = result.get("key_insights", [])
        room.suggested_actions = result.get("suggested_actions", [])
        room.phase = "solo_clarity"

        db.commit()

        return {
            "ready_for_clarity": True,
            "clarity_summary": result["clarity_summary"],
            "key_insights": result.get("key_insights", []),
            "suggested_actions": result.get("suggested_actions", []),
            "possible_actions": result.get("possible_actions", []),
            "transcribed_text": transcribed_text
        }
    else:
        # Save next AI question with cost tracking
        ai_turn = Turn(
            room_id=room_id,
            user_id=current_user.id,
            kind="ai_question",
            summary=result["ai_response"],
            context="solo",
            tags=["solo"],
            input_tokens=result.get("input_tokens", 0),
            output_tokens=result.get("output_tokens", 0),
            cost_usd=result.get("cost_usd", 0.0),
            model=result.get("model")
        )
        db.add(ai_turn)

        db.commit()

        return {
            "ai_response": result["ai_response"],
            "ready_for_clarity": False,
            "transcribed_text": transcribed_text
        }


@router.get("/{room_id}/solo/turns")
def get_solo_turns(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all Solo conversation turns for this room."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Get all solo turns
    turns = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.context == "solo"
    ).order_by(Turn.id).all()

    # Format as conversation messages
    messages = []
    for turn in turns:
        if turn.kind == "user_response" or turn.kind == "intake":
            msg = {"role": "user", "content": turn.summary or ""}
            if turn.audio_url:
                msg["audioUrl"] = turn.audio_url
            messages.append(msg)
        elif turn.kind == "ai_question":
            messages.append({"role": "assistant", "content": turn.summary or ""})

    # Include clarity summary if exists
    clarity_data = None
    if room.clarity_summary:
        clarity_data = {
            "summary": room.clarity_summary,
            "key_insights": room.key_insights or [],
            "suggested_actions": room.suggested_actions or [],
            "action_taken": room.action_taken
        }

    return {
        "messages": messages,
        "clarity_summary": clarity_data,
        "room_phase": room.phase
    }


@router.post("/{room_id}/generate-therapy-report")
def generate_therapy_report(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a professional therapy report from Solo session.
    Uses GPT-4 to create comprehensive clinical assessment.
    Only available for Solo rooms with clarity_summary completed.
    """
    # Get room
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check user is participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Verify this is a Solo room
    if room.room_type != 'solo':
        raise HTTPException(status_code=400, detail="Therapy reports are only available for Solo mode")

    # Verify room is in solo_clarity phase (has completed clarity summary)
    if not room.clarity_summary:
        raise HTTPException(
            status_code=400,
            detail="Room must have a clarity summary before generating therapy report. Complete your Solo session first."
        )

    # Get all Solo conversation turns
    turns = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.context == "solo"
    ).order_by(Turn.created_at.asc()).all()

    # Build conversation history for report
    conversation_turns = []
    for turn in turns:
        if turn.kind == "user_response" or turn.kind == "intake":
            conversation_turns.append({"role": "user", "content": turn.summary or ""})
        elif turn.kind == "ai_question":
            conversation_turns.append({"role": "assistant", "content": turn.summary or ""})

    # Generate professional report
    try:
        report_result = generate_professional_report(
            clarity_summary=room.clarity_summary,
            conversation_turns=conversation_turns
        )

        # Save report to Room
        room.professional_report = report_result["full_report"]
        room.report_generated_at = func.now()

        # Track OpenAI API cost
        cost_info = report_result.get("cost_info", {})
        track_api_cost(
            db=db,
            user_id=current_user.id,
            service_type="openai_gpt4",
            cost_usd=cost_info.get("cost_usd", 0.0),
            room_id=room_id,
            input_tokens=cost_info.get("input_tokens", 0),
            output_tokens=cost_info.get("output_tokens", 0),
            model=cost_info.get("model", "gpt-4")
        )

        db.commit()

        # Return structured report data
        return {
            "success": True,
            "report": {
                "full_report": report_result["full_report"],
                "clinical_summary": report_result["clinical_summary"],
                "key_themes": report_result["key_themes"],
                "strengths": report_result["strengths"],
                "support_areas": report_result["support_areas"],
                "recommendations": report_result["recommendations"],
                "therapist_notes": report_result["therapist_notes"],
                "urgency_level": report_result["urgency_level"]
            },
            "cost_info": cost_info,
            "generated_at": room.report_generated_at.isoformat() if room.report_generated_at else None
        }

    except Exception as e:
        print(f"Error generating therapy report: {e}")
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate therapy report: {str(e)}"
        )


@router.post("/{room_id}/convert-to-mediation")
def convert_solo_to_mediation(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Convert Solo room to Joint Mediation. User's clarity summary becomes user1_summary."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Verify this is a solo room
    if room.room_type != 'solo':
        raise HTTPException(status_code=400, detail="Room is already a mediation room")

    # Verify clarity summary exists
    if not room.clarity_summary:
        raise HTTPException(
            status_code=400,
            detail="Complete Solo coaching first to get your clarity summary"
        )

    # Generate invite token
    if not room.invite_token:
        room.invite_token = generate_invite_token()

    # Convert room to mediation
    room.room_type = 'mediation'
    room.user1_summary = room.clarity_summary  # Use Solo clarity as user1_summary
    room.phase = 'user2_lobby'
    room.converted_from_solo = True
    room.converted_at = func.now()

    db.commit()

    # Return invite link
    from app.config import settings
    import os

    # Check if running in production
    is_production = "railway" in os.getenv("DATABASE_URL", "").lower() or settings.APP_ENV == "prod"
    frontend_url = "https://meedi8.vercel.app" if is_production else "http://localhost:5173"
    invite_link = f"{frontend_url}/join/{room.invite_token}"

    return {
        "success": True,
        "invite_link": invite_link,
        "message": "Room converted to mediation. Share this link with the other person.",
        "room_phase": room.phase
    }


# === ROOM DELETION ENDPOINTS ===

@router.delete("/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a room and all associated data (turns, S3 files, etc.)."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check if user is a participant
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not authorized to delete this room")

    # Delete all S3 audio files associated with this room
    from app.services.s3_service import delete_audio_from_s3
    turns_with_audio = db.query(Turn).filter(
        Turn.room_id == room_id,
        Turn.audio_url.isnot(None)
    ).all()

    for turn in turns_with_audio:
        try:
            delete_audio_from_s3(turn.audio_url)
        except Exception as e:
            print(f"Error deleting S3 file {turn.audio_url}: {e}")
            # Continue deletion even if S3 delete fails

    # Delete room (cascade will handle turns and associations)
    db.delete(room)
    db.commit()

    return {"success": True, "message": "Room deleted successfully"}


@router.post("/bulk-delete")
def bulk_delete_rooms(
    room_ids: list[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete multiple rooms at once."""
    if not room_ids:
        raise HTTPException(status_code=400, detail="No room IDs provided")

    deleted_count = 0
    errors = []

    from app.services.s3_service import delete_audio_from_s3

    for room_id in room_ids:
        try:
            room = db.query(Room).filter(Room.id == room_id).first()
            if not room:
                errors.append(f"Room {room_id} not found")
                continue

            # Check authorization
            if current_user not in room.participants:
                errors.append(f"Not authorized to delete room {room_id}")
                continue

            # Delete S3 files
            turns_with_audio = db.query(Turn).filter(
                Turn.room_id == room_id,
                Turn.audio_url.isnot(None)
            ).all()

            for turn in turns_with_audio:
                try:
                    delete_audio_from_s3(turn.audio_url)
                except Exception as e:
                    print(f"Error deleting S3 file {turn.audio_url}: {e}")

            # Delete room
            db.delete(room)
            deleted_count += 1

        except Exception as e:
            errors.append(f"Error deleting room {room_id}: {str(e)}")

    db.commit()

    return {
        "success": True,
        "deleted_count": deleted_count,
        "total_requested": len(room_ids),
        "errors": errors if errors else None
    }


@router.post("/{room_id}/generate-report")
def generate_professional_report(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a professional therapy-style PDF report for a resolved mediation room.
    Returns the S3 URL of the generated PDF.
    """
    # Get room
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Check authorization
    if current_user not in room.participants:
        raise HTTPException(status_code=403, detail="Not a participant in this room")

    # Only allow for resolved rooms
    if room.phase != 'resolved':
        raise HTTPException(status_code=400, detail="Report can only be generated for resolved rooms")

    # Check if report already exists
    if room.professional_report_url:
        return {
            "success": True,
            "report_url": room.professional_report_url,
            "message": "Report already exists"
        }

    try:
        # Get participants (determine User1 and User2)
        participants = room.participants
        if len(participants) < 2:
            raise HTTPException(status_code=400, detail="Room must have 2 participants")

        # Determine User1 by finding who started coaching first
        first_turn = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.context == "pre_mediation"
        ).order_by(Turn.created_at.asc()).first()

        if not first_turn:
            # Fallback to participant order
            user1 = participants[0]
            user2 = participants[1]
        else:
            user1_id = first_turn.user_id
            user1 = next((p for p in participants if p.id == user1_id), participants[0])
            user2 = next((p for p in participants if p.id != user1_id), participants[1])

        user1_name = clean_user_name(user1)
        user2_name = clean_user_name(user2)

        # Get main room conversation transcript
        main_turns = db.query(Turn).filter(
            Turn.room_id == room_id,
            Turn.context == "main"
        ).order_by(Turn.created_at.asc()).all()

        # Build transcript for Claude
        transcript = []
        for turn in main_turns:
            if turn.kind == "ai_question":
                transcript.append({
                    "role": "assistant",
                    "content": turn.summary,
                    "userId": None,
                    "isUser1": None
                })
            elif turn.kind == "resolution":
                transcript.append({
                    "role": "resolution",
                    "content": turn.summary,
                    "userId": None,
                    "isUser1": None
                })
            else:
                is_user1 = turn.user_id == user1.id
                transcript.append({
                    "role": "user",
                    "content": turn.summary,
                    "userId": turn.user_id,
                    "isUser1": is_user1
                })

        # Import report generation services
        from app.services.report_generator import generate_report_content_with_claude, create_pdf_report
        from app.services.s3_service import upload_report_to_s3

        # Generate report content using Claude
        report_data = generate_report_content_with_claude(
            room_title=room.title,
            category=room.category or "general",
            user1_name=user1_name,
            user2_name=user2_name,
            user1_summary=room.user1_summary or "",
            user2_summary=room.user2_summary or "",
            transcript=transcript,
            resolution_text=room.resolution_text or ""
        )

        # Create PDF
        pdf_bytes = create_pdf_report(
            room_id=room.id,
            room_title=room.title,
            category=room.category or "general",
            created_at=room.created_at,
            user1_name="User 1",  # Anonymized in PDF
            user2_name="User 2",  # Anonymized in PDF
            report_content=report_data["report_content"],
            resolution_text=room.resolution_text or ""
        )

        # Upload to S3
        report_url = upload_report_to_s3(pdf_bytes, room.id)

        # Save URL to database
        room.professional_report_url = report_url
        db.commit()

        return {
            "success": True,
            "report_url": report_url,
            "message": "Report generated successfully",
            "cost_info": {
                "input_tokens": report_data["input_tokens"],
                "output_tokens": report_data["output_tokens"],
                "cost_usd": report_data["cost_usd"],
                "model": report_data["model"]
            }
        }

    except Exception as e:
        print(f"Error generating report: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )
