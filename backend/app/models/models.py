# apps/backend/app/models/models.py

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(
        String,
        nullable=False,
    )

    role = Column(
        String,
        default="client",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    profile = relationship(
        "BusinessProfile",
        back_populates="owner",
        uselist=False,
        cascade="all, delete-orphan",
    )

    content_items = relationship(
        "ContentCalendar",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    deliverables = relationship(
        "Deliverable",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(Integer, primary_key=True, index=True)

    company_name = Column(
        String,
        index=True,
        nullable=False,
    )

    website_url = Column(String)

    industry = Column(String)

    plan = Column(
        String,
        default="Pro Growth SEO",
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    owner = relationship(
        "User",
        back_populates="profile",
    )


class ContentCalendar(Base):
    __tablename__ = "content_calendar"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title = Column(
        String,
        nullable=False,
    )

    description = Column(
        String,
        nullable=True,
    )

    platform = Column(
        String,
        nullable=False,
    )

    scheduled_date = Column(
        DateTime,
        nullable=False,
    )

    status = Column(
        String,
        default="Drafting",
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="content_items",
    )


class Deliverable(Base):
    __tablename__ = "deliverables"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title = Column(
        String,
        nullable=False,
    )

    description = Column(
        String,
        nullable=True,
    )

    due_date = Column(
        DateTime,
        nullable=False,
    )

    status = Column(
        String,
        default="Pending",
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="deliverables",
    )