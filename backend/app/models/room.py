from sqlalchemy import Date, Numeric, Column, Integer, String, DateTime, Text, ForeignKey, Table, ARRAY, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import json

# Many-to-many association table
room_participants = Table(
    'room_participants',
    Base.metadata,
    Column('room_id', Integer, ForeignKey('rooms.id', ondelete='CASCADE')),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'))
)

class Room(Base):
    __tablename__ = 'rooms'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String(50), nullable=True)  # work, family, romance, money, other
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Mediation flow phases
    phase = Column(String, nullable=False, default='user1_intake')
    # Phases: user1_intake, user1_coaching, user2_lobby, user2_coaching, main_room, resolved
    
    # Invite system
    invite_token = Column(String(100), unique=True, nullable=True, index=True)
    
    # Polished summaries after coaching
    user1_summary = Column(Text, nullable=True)
    user2_summary = Column(Text, nullable=True)
    
    # Resolution tracking
    resolution_text = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    check_in_date = Column(Date, nullable=True)

    # Break/pause tracking for main room
    break_requested_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    break_requested_at = Column(DateTime(timezone=True), nullable=True)

    # Deep exploration tracking (for staying with same person for follow-up questions)
    last_speaker_id = Column(Integer, nullable=True)  # Who spoke last
    consecutive_questions_to_same = Column(Integer, default=0)  # How many times in a row

    # Breathing break tracking (for managing escalation)
    breathing_break_count = Column(Integer, default=0)  # How many breathing breaks in this session
    last_breathing_break_at = Column(DateTime(timezone=True), nullable=True)  # When last break happened

    # User presence tracking in main room
    user1_last_seen_main_room = Column(DateTime(timezone=True), nullable=True)
    user2_last_seen_main_room = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    participants = relationship('User', secondary=room_participants, back_populates='rooms')
    turns = relationship('Turn', back_populates='room', cascade='all, delete-orphan')
    break_requester = relationship('User', foreign_keys=[break_requested_by_id])

class Turn(Base):
    __tablename__ = 'turns'
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey('rooms.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    kind = Column(String, nullable=False)  # intake, ai_question, user_response, resolution
    summary = Column(Text, nullable=True)
    tags = Column(JSON, default=list)  # Changed from ARRAY to JSON for SQLite compatibility
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Context tracks pre-mediation vs main room
    context = Column(String, nullable=False, default='main')  # pre_mediation, main
    
    # Cost tracking for AI responses
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    cost_usd = Column(Numeric(10, 6), default=0.0)
    model = Column(String(50), nullable=True)

    # Audio storage for voice messages
    audio_url = Column(String(500), nullable=True)

    # Track which user the AI is addressing (for main room AI questions)
    addressed_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    room = relationship('Room', back_populates='turns')
    user = relationship('User', foreign_keys=[user_id])
    addressed_user = relationship('User', foreign_keys=[addressed_user_id])
