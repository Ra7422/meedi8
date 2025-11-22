from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, func
from ..db import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info", nullable=False)  # info, warning, success, error
    is_active = Column(Boolean, default=True, nullable=False)
    is_dismissible = Column(Boolean, default=True, nullable=False)

    # Targeting
    target_audience = Column(String(50), default="all", nullable=False)  # all, free, plus, pro
    show_on_pages = Column(String(500), default="all", nullable=False)  # all, home, dashboard, coaching, etc.

    # Scheduling
    start_date = Column(DateTime(timezone=True), nullable=True)  # When to start showing
    end_date = Column(DateTime(timezone=True), nullable=True)  # When to stop showing

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(Integer, nullable=True)  # Admin user ID who created it

    # Analytics
    view_count = Column(Integer, default=0, nullable=False)
    dismiss_count = Column(Integer, default=0, nullable=False)
