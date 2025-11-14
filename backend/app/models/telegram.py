from sqlalchemy import Column, Integer, String, DateTime, Boolean, BigInteger, Text, Numeric, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from ..db import Base


class TelegramSession(Base):
    """Store encrypted Telegram session strings for authenticated users."""
    __tablename__ = "telegram_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    encrypted_session = Column(Text, nullable=False)  # Encrypted Telethon session string
    phone_number = Column(String(20), nullable=False)  # Phone number used for authentication
    is_active = Column(Boolean, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="telegram_session")
    downloads = relationship("TelegramDownload", back_populates="session", cascade="all, delete-orphan")


class TelegramDownload(Base):
    """Track individual chat download requests."""
    __tablename__ = "telegram_downloads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey("telegram_sessions.id", ondelete="CASCADE"), nullable=False)
    chat_id = Column(BigInteger, nullable=False)  # Telegram chat ID
    chat_name = Column(String(255), nullable=True)  # Display name of chat/contact
    chat_type = Column(String(50), nullable=True)  # 'user', 'group', 'channel'
    start_date = Column(DateTime(timezone=True), nullable=False)  # Filter messages from this date
    end_date = Column(DateTime(timezone=True), nullable=False)  # Filter messages until this date
    message_count = Column(Integer, server_default="0")  # Total messages downloaded
    media_count = Column(Integer, server_default="0")  # Total media files found
    status = Column(String(50), server_default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)  # Error details if failed
    transcript_url = Column(Text, nullable=True)  # S3 URL to formatted transcript
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    api_cost_usd = Column(Numeric(10, 6), server_default="0.00")  # Track API costs if AI analysis applied

    # Relationships
    user = relationship("User", back_populates="telegram_downloads")
    session = relationship("TelegramSession", back_populates="downloads")
    messages = relationship("TelegramMessage", back_populates="download", cascade="all, delete-orphan")


class TelegramMessage(Base):
    """Individual messages from downloaded chats."""
    __tablename__ = "telegram_messages"

    id = Column(Integer, primary_key=True, index=True)
    download_id = Column(Integer, ForeignKey("telegram_downloads.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(BigInteger, nullable=False)  # Telegram message ID
    sender_id = Column(BigInteger, nullable=False)  # Telegram user ID of sender
    sender_name = Column(String(255), nullable=True)  # Display name of sender
    date = Column(DateTime(timezone=True), nullable=False)  # Message timestamp
    text = Column(Text, nullable=True)  # Message text content
    reply_to_message_id = Column(BigInteger, nullable=True)  # If replying to another message
    has_media = Column(Boolean, server_default="false")
    media_type = Column(String(50), nullable=True)  # 'photo', 'video', 'document', 'voice', etc.
    media_url = Column(Text, nullable=True)  # S3 URL if media was downloaded
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    download = relationship("TelegramDownload", back_populates="messages")

    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_telegram_messages_download_date', 'download_id', 'date'),
        Index('idx_telegram_messages_sender', 'download_id', 'sender_id'),
    )
