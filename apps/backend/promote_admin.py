# apps/backend/promote_admin.py
import sys
import os

# 1. This foolproofs the script by forcing Python to recognize your 'app' folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import User

def promote_to_admin(email: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        if user.role == "admin":
            print(f"Notice: '{email}' is already an admin.")
        else:
            user.role = "admin"
            db.commit()
            print(f"Success! '{email}' has been officially upgraded to an Admin.")
    else:
        print(f"Error: Could not find a user with the email '{email}'.")
        print("Make sure they have registered on the Client Portal first!")
        
    db.close()

if __name__ == "__main__":
    print("--- Meridian Dynamics Admin Promotion Tool ---")
    # 2. Makes it interactive so you just type the email in the terminal!
    target_email = input("Enter the user's email address: ")
    promote_to_admin(target_email)