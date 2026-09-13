from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# ==========================================
# CONTENT CALENDAR SCHEMAS
# ==========================================
class ContentCalendarBase(BaseModel):
    title: str
    description: Optional[str] = None
    platform: str  # e.g., "LinkedIn", "Blog", "X", "Newsletter"
    scheduled_date: datetime
    status: Optional[str] = "Drafting"  # Drafting, In Review, Scheduled, Published

class ContentCalendarCreate(ContentCalendarBase):
    pass

class ContentCalendarResponse(ContentCalendarBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# ==========================================
# DELIVERABLE SCHEMAS
# ==========================================
class DeliverableBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    status: Optional[str] = "Pending"  # Pending, In Progress, Completed

class DeliverableCreate(DeliverableBase):
    pass

class DeliverableResponse(DeliverableBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# ==========================================
# DOCUMENT VAULT SCHEMAS
# ==========================================
class DocumentResponse(BaseModel):
    id: int
    user_id: int
    title: str
    file_type: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# LEAD MANAGEMENT SYSTEM SCHEMAS
# ==========================================
class LeadEventCreate(BaseModel):
    title: str
    event_date: datetime

class LeadEventResponse(BaseModel):
    id: int
    lead_id: int
    title: str
    event_date: datetime
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = "New"
    value: Optional[float] = 0.0
    notes: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    value: Optional[float] = None
    notes: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    events: List[LeadEventResponse] = []

    class Config:
        from_attributes = True