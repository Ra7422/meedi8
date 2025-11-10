from sqlalchemy import Column, Integer, String, DateTime, func, Index
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
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)  # Stripe customer ID
    profile_picture_url = Column(String(500), nullable=True)  # Google OAuth profile picture URL

    # Relationships
    rooms = relationship('Room', secondary='room_participants', back_populates='participants')
    subscription = relationship('Subscription', back_populates='user', uselist=False)
    health_profile = relationship('UserHealthProfile', back_populates='user', uselist=False)
