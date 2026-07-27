# apps/backend/app/core/email.py

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)

# SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465


def send_reset_email(to_email: str, token: str):
    """Sends a password reset email."""

    msg = EmailMessage()
    msg["Subject"] = "Password Reset Request - Meridian Dynamics"
    msg["From"] = settings.SMTP_EMAIL
    msg["To"] = to_email

    # Build the reset link from the frontend URL
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    msg.set_content(
        f"""
Hello,

We received a request to reset the password for your Meridian Dynamics Client Portal.

Click the link below to reset your password:

{reset_link}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.

Regards,

Meridian Dynamics
"""
    )

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(
                settings.SMTP_EMAIL,
                settings.SMTP_PASSWORD,
            )
            server.send_message(msg)

        logger.info("Password reset email sent to %s", to_email)

    except Exception:
        logger.exception("Failed to send password reset email to %s", to_email)
        raise