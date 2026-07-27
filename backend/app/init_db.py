# apps/backend/app/init_db.py
import os
import sys

# 1. Force Python to recognize the 'backend' folder so 'app.' imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, backend_dir)

# 2. Import the database engine and models
from app.core.database import engine
from app.models.models import Base

def create_tables():
    print("Creating tables in local SQLite database...")
    # This command looks at your models and physically generates the tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    create_tables()