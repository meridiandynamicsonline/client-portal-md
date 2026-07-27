import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Path to the backend folder
BASE_DIR = Path(__file__).resolve().parents[2]

# Local SQLite database path
LOCAL_DATABASE_URL = f"sqlite:///{(BASE_DIR / 'client_portal.db').as_posix()}"


class Settings:
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # Database
    # If DATABASE_URL exists in .env (Railway/Postgres), use it.
    # Otherwise, use the SQLite database inside the backend folder.
    DATABASE_URL = os.getenv("DATABASE_URL", LOCAL_DATABASE_URL)

    # Email
    SMTP_EMAIL = os.getenv("SMTP_EMAIL")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

    # Frontend
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


settings = Settings()