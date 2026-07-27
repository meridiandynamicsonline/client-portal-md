from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import models

# JWT Configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is missing.")

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security Scheme
security = HTTPBearer()


def verify_password(plain_password, hashed_password):
    """Checks if a typed password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Hashes a plain-text password."""
    return pwd_context.hash(password)


def create_access_token(data: dict):
    """Generates a JWT access token."""
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
):
    """Validates the JWT and returns the current user's ID."""

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = (
            db.query(models.User)
            .filter(models.User.id == int(user_id))
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User no longer exists in system",
            )

        return int(user_id)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
        )


def create_reset_token(email: str):
    """Creates a 15-minute password reset token."""

    expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    payload = {
        "sub": email,
        "exp": expire,
        "type": "reset",
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_reset_token(token: str):
    """Validates a password reset token and returns the user's email."""

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "reset":
            return None

        return payload.get("sub")

    except jwt.ExpiredSignatureError:
        return None

    except jwt.InvalidTokenError:
        return None