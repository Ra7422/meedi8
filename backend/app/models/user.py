from sqlalchemy import Column, Integer, String, DateTime, Boolean, func, Index
from sqlalchemy.orm import relationship
from ..db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_admin = Column(Integer, default=0, nullable=False)  # 0 = regular user, 1 = admin
    is_guest = Column(Boolean, default=False, nullable=False)  # True for temporary guest accounts
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)  # Stripe customer ID
    profile_picture_url = Column(String(500), nullable=True)  # Google OAuth profile picture URL
    has_completed_screening = Column(Boolean, default=False, nullable=False)  # First-time screening gate

    # Telegram integration fields
    telegram_id = Column(String(255), nullable=True, unique=True, index=True)  # Telegram user ID
    telegram_username = Column(String(255), nullable=True)  # Telegram username (optional)
    telegram_phone = Column(String(50), nullable=True)  # Phone number connected to Telegram
    telegram_session_string = Column(String(1000), nullable=True)  # Encrypted Telethon session
    telegram_connected_at = Column(DateTime(timezone=True), nullable=True)  # When user connected Telegram

    # Relationships
    rooms = relationship('Room', secondary='room_participants', back_populates='participants')
    subscription = relationship('Subscription', back_populates='user', uselist=False)
    health_profile = relationship('UserHealthProfile', back_populates='user', uselist=False)
    telegram_session = relationship('TelegramSession', back_populates='user', uselist=False)
    telegram_downloads = relationship('TelegramDownload', back_populates='user')
