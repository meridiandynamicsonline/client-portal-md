# apps/backend/promote_admin.py

import sys
import os

# Allow imports from the backend folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.models import User


def promote_to_admin(email: str):
    print("\n========== DATABASE DEBUG ==========")
    print("Current Working Directory :", os.getcwd())
    print("Database URL             :", engine.url)
    print("Absolute DB Path         :", os.path.abspath("client_portal.db"))
    print("====================================\n")

    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()

        if user:
            if user.role == "admin":
                print(f"Notice: '{email}' is already an admin.")
            else:
                user.role = "admin"
                db.commit()
                print(f"Success! '{email}' has been promoted to Admin.")
        else:
            print(f"Error: No user found with email '{email}'.")

    finally:
        db.close()


if __name__ == "__main__":
    print("=== Meridian Dynamics Admin Promotion Tool ===")
    target_email = input("Enter the user's email address: ").strip()
    promote_to_admin(target_email)