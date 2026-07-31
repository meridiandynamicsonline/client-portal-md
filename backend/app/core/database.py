import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 1. Fetch the database URL from the environment (Railway provides this automatically)
# If it doesn't exist (like on your local computer), fallback to SQLite.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./client_portal.db")

# 2. Fix a common cloud provider quirk
# Platforms like Railway often provide URLs starting with 'postgres://', 
# but modern SQLAlchemy strictly requires 'postgresql://'. This safely patches it.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Configure the engine dynamically
# SQLite needs a specific thread argument to work with FastAPI. PostgreSQL does not.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()