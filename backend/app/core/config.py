import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Path to the backend folder
BASE_DIR = Path(__file__).resolve().parents[2]

# Local SQLite database fallback
LOCAL_DATABASE_URL = f"sqlite:///{(BASE_DIR / 'client_portal.db').as_posix()}"


class Settings:
    # 1. Environment Detection (Render sets RENDER=true by default)
    IS_RENDER = os.getenv("RENDER", "false").lower() == "true"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "production" if IS_RENDER else "development")
    IS_PROD = ENVIRONMENT == "production"

    # 2. JWT Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "temporary-local-secret-for-dev-only")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # 3. Database URL (Fixes SQLAlchemy requiring postgresql:// instead of postgres://)
    _db_url = os.getenv("DATABASE_URL", LOCAL_DATABASE_URL)
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = _db_url

    # 4. Frontend URL (Automatically points to custom domain in prod, localhost in dev)
    _default_frontend = (
        "https://portal.meridiandynamics.online"
        if IS_PROD
        else "http://localhost:3000"
    )
    FRONTEND_URL = os.getenv("FRONTEND_URL", _default_frontend).rstrip("/")

    # 5. Email Configuration
    SMTP_EMAIL = os.getenv("SMTP_EMAIL")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


settings = Settings()