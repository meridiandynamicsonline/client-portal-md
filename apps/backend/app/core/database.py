# apps/backend/app/core/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Get the absolute path to the main 'apps/backend' folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. Explicitly load the .env file from that specific folder
load_dotenv(os.path.join(BASE_DIR, ".env"))

# 3. Read the URL from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 4. CRITICAL FIX: If using a relative SQLite path in .env, convert it to absolute!
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("sqlite:///./"):
    db_name = SQLALCHEMY_DATABASE_URL.replace("sqlite:///./", "")
    db_path = os.path.join(BASE_DIR, db_name)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
elif not SQLALCHEMY_DATABASE_URL:
    # Fallback just in case the .env is missing
    db_path = os.path.join(BASE_DIR, "local_portal.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

# SQLite specifically needs the connect_args check to prevent threading errors in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()