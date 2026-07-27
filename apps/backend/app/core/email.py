# apps/backend/app/core/email.py
import smtplib
from email.message import EmailMessage

# For production, these should be moved to a .env file!
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SENDER_EMAIL = "meridiandynamics.online@gmail.com"  # Replace with your actual Gmail
SENDER_PASSWORD = "xlfk hwzd fidp izav" # Replace with the App Password

def send_reset_email(to_email: str, token: str):
    """Sends a real password reset email using Gmail's SMTP server"""
    
    # 1. Construct the email structure
    msg = EmailMessage()
    msg['Subject'] = "Password Reset Request - Meridian Dynamics"
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    
    # 2. Build the reset link
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
    # 3. Write the email content
    msg.set_content(f"""\
    Hello,

    We received a request to reset the password for your Meridian Dynamics portal.
    Click the link below to set a new password:

    {reset_link}

    This link will expire in 15 minutes. If you did not request this, please ignore this email.
    
    Best,
    The Meridian Dynamics Team
    """)

    # 4. Connect to Gmail and send!
    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        print(f"✅ Real email successfully sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")