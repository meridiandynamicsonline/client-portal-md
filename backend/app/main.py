# apps/backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from app.core.config import settings
from typing import List, Optional
from app.core.email import send_reset_email
from app.core.database import get_db, Base, engine
from app.schemas import schemas
from app.models import models
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    create_reset_token,
    verify_reset_token
)

models.Base.metadata.create_all(bind=engine)


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileCreate(BaseModel):
    company_name: str
    website_url: str
    industry: str
    
class ProfileUpdate(BaseModel):
    company_name: str
    industry: str
    plan: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

app = FastAPI(
    title="Meridian Dynamics Client Portal API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ==========================================
# CORS CONFIGURATION
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    settings.FRONTEND_URL,
    "https://admin.meridiandynamics.online",
    "https://portal.meridiandynamics.online",
    "http://localhost:3000",
    "http://localhost:3001",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DEPENDENCIES
# ==========================================
def get_current_admin(
    current_user_id: int = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access the admin portal.",
        )
    return user

# ==========================================
# PUBLIC & CLIENT ROUTES
# ==========================================
@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to the Client Portal API"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1")) 
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection error: {str(e)}")
    
@app.get("/profiles/me")
def get_my_profile(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user)
):
    # 1. Fetch the user to check their role
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    
    # 2. THE NEW BOUNCER: Kick admins out of the client portal!
    if user.role == "admin":
        raise HTTPException(
            status_code=403, 
            detail="Admins are not allowed in the Client Portal."
        )

    # 3. If they are a client, proceed as normal
    profile = db.query(models.BusinessProfile).filter(
        models.BusinessProfile.user_id == current_user_id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile
    
@app.post("/users/register")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user_data.password)
    # New registrations default to the "client" role
    new_user = models.User(email=user_data.email, hashed_password=hashed_pw, role="client")
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created securely", "user_id": new_user.id, "email": new_user.email}

@app.post("/users/login")
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "message": "Login successful"}

@app.post("/profiles/")
def create_profile(
    profile_data: ProfileCreate, 
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    existing_profile = db.query(models.BusinessProfile).filter(models.BusinessProfile.user_id == current_user_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists for this user")

    new_profile = models.BusinessProfile(
        **profile_data.dict(),
        user_id=current_user_id
    )
    
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    
    return {
        "message": "Business profile created successfully", 
        "profile_id": new_profile.id,
        "company": new_profile.company_name
    }

@app.post("/users/forgot-password")
def forgot_password(
    req: ForgotPasswordRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    
    if user:
        token = create_reset_token(user.email)
        background_tasks.add_task(send_reset_email, user.email, token)
        
    return {"message": "If an account exists for that email, a reset link has been sent."}

@app.post("/users/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_reset_token(req.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return {"message": "Password has been successfully reset"}


# ==========================================
# ADMIN ROUTES (Requires Admin Role)
# ==========================================
@app.get("/admin/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    users = db.query(models.User).all()
    result = []
    for u in users:
        profile = db.query(models.BusinessProfile).filter(models.BusinessProfile.user_id == u.id).first()
        result.append({
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "profile": profile
        })
    return result

@app.post("/admin/users/{user_id}/profile")
def update_user_profile(
    user_id: int, 
    req: ProfileUpdate, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    profile = db.query(models.BusinessProfile).filter(models.BusinessProfile.user_id == user_id).first()
    
    if not profile:
        profile = models.BusinessProfile(
            user_id=user_id, 
            company_name=req.company_name, 
            industry=req.industry, 
            plan=req.plan
        )
        db.add(profile)
    else:
        profile.company_name = req.company_name
        profile.industry = req.industry
        profile.plan = req.plan
        
    db.commit()
    return {"message": "Client profile updated successfully"}

# ==========================================
# ADMIN ROUTES: CONTENT CALENDAR & DELIVERABLES
# ==========================================

@app.post("/admin/users/{user_id}/content", response_model=schemas.ContentCalendarResponse)
def create_content_item(
    user_id: int, 
    item: schemas.ContentCalendarCreate, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to assign a content item to a specific client."""
    db_item = models.ContentCalendar(**item.model_dump(), user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/admin/users/{user_id}/content", response_model=List[schemas.ContentCalendarResponse])
def get_client_content_admin(
    user_id: int, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to view all content items for a given client."""
    return db.query(models.ContentCalendar).filter(models.ContentCalendar.user_id == user_id).all()


@app.post("/admin/users/{user_id}/deliverables", response_model=schemas.DeliverableResponse)
def create_deliverable(
    user_id: int, 
    deliverable: schemas.DeliverableCreate, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to assign a deliverable to a specific client."""
    db_deliverable = models.Deliverable(**deliverable.model_dump(), user_id=user_id)
    db.add(db_deliverable)
    db.commit()
    db.refresh(db_deliverable)
    return db_deliverable


@app.get("/admin/users/{user_id}/deliverables", response_model=List[schemas.DeliverableResponse])
def get_client_deliverables_admin(
    user_id: int, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to view all deliverables for a given client."""
    return db.query(models.Deliverable).filter(models.Deliverable.user_id == user_id).all()


# ==========================================
# CLIENT ROUTES: READ-ONLY ACCESS
# ==========================================

@app.get("/content/me", response_model=List[schemas.ContentCalendarResponse])
def get_my_content(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user)
):
    """Client endpoint to view their own scheduled content items."""
    return db.query(models.ContentCalendar).filter(models.ContentCalendar.user_id == current_user_id).all()


@app.get("/deliverables/me", response_model=List[schemas.DeliverableResponse])
def get_my_deliverables(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user)
):
    """Client endpoint to view their own deliverables."""
    return db.query(models.Deliverable).filter(models.Deliverable.user_id == current_user_id).all()