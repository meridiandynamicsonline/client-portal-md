# apps/backend/app/models/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Determines if the user is a "client", "admin", etc.
    role = Column(String, default="client")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # The relationship linking to the Business Profile
    profile = relationship("BusinessProfile", back_populates="owner", uselist=False)

class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    website_url = Column(String)
    industry = Column(String)
    
    # Tracks the client's active subscription or service tier
    plan = Column(String, default="Pro Growth SEO") 
    
    # The Foreign Key linking back to the User's ID
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    # The relationship linking back to the User
    owner = relationship("User", back_populates="profile")

class ContentCalendar(Base):
    __tablename__ = "content_calendar"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String, nullable=True)
    platform = Column(String) 
    scheduled_date = Column(DateTime)
    status = Column(String, default="Drafting") 
    
    # Links this content item back to the specific client
    user = relationship("User", backref="content_items")


class Deliverable(Base):
    __tablename__ = "deliverables"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String, nullable=True)
    due_date = Column(DateTime)
    status = Column(String, default="Pending") 
    
    # Links this deliverable back to the specific client
    user = relationship("User", backref="deliverables")