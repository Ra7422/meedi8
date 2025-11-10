from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db import Base


class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PLUS = "plus"
    PRO = "pro"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


class Subscription(Base):
    __tablename__ = 'subscriptions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    tier = Column(SQLEnum(SubscriptionTier, values_callable=lambda x: [e.value for e in x]), nullable=False, default=SubscriptionTier.FREE)
    status = Column(SQLEnum(SubscriptionStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=SubscriptionStatus.TRIAL)
    start_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Stripe integration
    stripe_subscription_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_price_id = Column(String(255), nullable=True)  # Which price they're on

    # Free tier quotas
    voice_conversations_used = Column(Integer, default=0, nullable=False)
    voice_conversations_limit = Column(Integer, default=1, nullable=False)  # 1 trial for free tier

    # Relationships
    user = relationship('User', back_populates='subscription')


class ApiCost(Base):
    """Track all API costs for profitability analysis"""
    __tablename__ = 'api_costs'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    room_id = Column(Integer, ForeignKey('rooms.id', ondelete='CASCADE'), nullable=True)
    turn_id = Column(Integer, ForeignKey('turns.id', ondelete='CASCADE'), nullable=True)

    # Service type: 'anthropic', 'openai_whisper', 'openai_tts'
    service_type = Column(String(50), nullable=False, index=True)

    # Token/usage tracking
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    audio_seconds = Column(Numeric(10, 2), default=0.0)  # For Whisper/TTS

    # Cost
    cost_usd = Column(Numeric(10, 6), nullable=False)

    # Metadata
    model = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship('User')
    room = relationship('Room')
    turn = relationship('Turn')
