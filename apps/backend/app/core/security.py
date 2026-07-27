# apps/backend/app/core/security.py
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import models # <-- 1. Added this import

# 1. JWT Configuration Constants
SECRET_KEY = "my_super_secret_temporary_key_for_local_testing"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# 2. Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 3. Security Scheme for the "Digital Bouncer"
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    """Checks if a typed password matches the scrambled hash in the database"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Takes a plain password and irreversibly scrambles it"""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Generates a secure JWT with an expiration timer"""
    to_encode = data.copy()
    
    # Calculate exactly when this token should expire
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Sign the token using our secret key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db) # <-- 2. Inject the database session
):
    """The Digital Bouncer: Decodes the JWT and validates the user"""
    token = credentials.credentials
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # 3. STRICT CHECK: Ensure the user actually exists in the current database
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User no longer exists in system")
            
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
def create_reset_token(email: str):
    """Generates a short-lived JWT specifically for password resets (15 minutes)"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    # Notice we add a "type" claim to ensure this token can't be used to log in
    to_encode = {"sub": email, "exp": expire, "type": "reset"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str):
    """Decodes the reset token and returns the email if it is valid and unexpired"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            return None
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None