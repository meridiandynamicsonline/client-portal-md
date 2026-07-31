from pydantic import BaseModel
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
        from_attributes = True  # Note: Use `orm_mode = True` if you are on an older version of Pydantic