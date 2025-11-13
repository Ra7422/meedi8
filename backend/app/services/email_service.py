"""
Email notification service using SendGrid

Handles turn-taking notifications for mediation sessions.
"""
import os
import logging
from typing import Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

logger = logging.getLogger(__name__)

# SendGrid configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "notifications@meedi8.com")
FROM_NAME = os.getenv("FROM_NAME", "Meedi8")

# Feature flag for email notifications
EMAIL_NOTIFICATIONS_ENABLED = os.getenv("EMAIL_NOTIFICATIONS_ENABLED", "false").lower() == "true"


def send_turn_notification(
    to_email: str,
    to_name: str,
    room_id: int,
    other_person_name: str
) -> bool:
    """
    Send email notification when it's user's turn to respond in mediation

    Args:
        to_email: Recipient email address
        to_name: Recipient's name
        room_id: Room ID for generating link
        other_person_name: Name of the person who just responded

    Returns:
        True if email sent successfully, False otherwise
    """
    if not EMAIL_NOTIFICATIONS_ENABLED:
        logger.info(f"📧 Email notifications disabled - would send to {to_email}")
        return False

    if not SENDGRID_API_KEY:
        logger.warning("⚠️ SENDGRID_API_KEY not configured")
        return False

    try:
        # Generate room URL
        frontend_url = os.getenv("FRONTEND_URL", "https://meedi8.vercel.app")
        room_url = f"{frontend_url}/main-room/{room_id}"

        # Create email content
        subject = f"{other_person_name} has responded - Your turn in Meedi8"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                     background: linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%);
                     margin: 0;
                     padding: 40px 20px;">

            <div style="max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        overflow: hidden;">

                <!-- Header with logo -->
                <div style="background: linear-gradient(135deg, #7DD3C0 0%, #4cd3c2 100%);
                            padding: 30px 20px;
                            text-align: center;">
                    <h1 style="color: white;
                               font-size: 28px;
                               margin: 0;
                               font-weight: 300;">
                        Meedi8
                    </h1>
                </div>

                <!-- Body content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937;
                               font-size: 24px;
                               font-weight: 400;
                               margin: 0 0 20px 0;">
                        Hi {to_name},
                    </h2>

                    <p style="color: #4b5563;
                              font-size: 16px;
                              line-height: 1.6;
                              margin: 0 0 20px 0;">
                        <strong>{other_person_name}</strong> has just responded in your mediation session.
                        It's now your turn to continue the conversation.
                    </p>

                    <p style="color: #4b5563;
                              font-size: 16px;
                              line-height: 1.6;
                              margin: 0 0 30px 0;">
                        The AI mediator is ready to help you both find common ground.
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{room_url}"
                           style="display: inline-block;
                                  background: #7DD3C0;
                                  color: white;
                                  text-decoration: none;
                                  padding: 16px 40px;
                                  border-radius: 12px;
                                  font-size: 18px;
                                  font-weight: 500;
                                  box-shadow: 0 2px 8px rgba(125, 211, 192, 0.3);">
                            Continue Mediation →
                        </a>
                    </div>

                    <p style="color: #9ca3af;
                              font-size: 14px;
                              line-height: 1.6;
                              margin: 30px 0 0 0;">
                        Or copy this link: <br>
                        <a href="{room_url}"
                           style="color: #7DD3C0;
                                  word-break: break-all;">
                            {room_url}
                        </a>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #f9fafb;
                            padding: 20px 30px;
                            border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af;
                              font-size: 13px;
                              line-height: 1.5;
                              margin: 0;
                              text-align: center;">
                        You're receiving this because you're participating in a Meedi8 mediation session.<br>
                        <a href="{frontend_url}/profile"
                           style="color: #7DD3C0; text-decoration: none;">
                            Manage notification preferences
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text fallback
        text_content = f"""
        Hi {to_name},

        {other_person_name} has just responded in your mediation session.
        It's now your turn to continue the conversation.

        Continue mediation: {room_url}

        The AI mediator is ready to help you both find common ground.

        ---
        You're receiving this because you're participating in a Meedi8 mediation session.
        Manage notification preferences: {frontend_url}/profile
        """

        # Create message
        message = Mail(
            from_email=Email(FROM_EMAIL, FROM_NAME),
            to_emails=To(to_email, to_name),
            subject=subject,
            plain_text_content=Content("text/plain", text_content),
            html_content=Content("text/html", html_content)
        )

        # Send via SendGrid
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        logger.info(f"✅ Email sent to {to_email} (status: {response.status_code})")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
        return False


def send_break_notification(
    to_email: str,
    to_name: str,
    room_id: int,
    requester_name: str
) -> bool:
    """
    Send email notification when other person requests a break

    Args:
        to_email: Recipient email address
        to_name: Recipient's name
        room_id: Room ID for generating link
        requester_name: Name of person who requested break

    Returns:
        True if email sent successfully, False otherwise
    """
    if not EMAIL_NOTIFICATIONS_ENABLED:
        logger.info(f"📧 Email notifications disabled - would send break notification to {to_email}")
        return False

    if not SENDGRID_API_KEY:
        logger.warning("⚠️ SENDGRID_API_KEY not configured")
        return False

    try:
        frontend_url = os.getenv("FRONTEND_URL", "https://meedi8.vercel.app")
        room_url = f"{frontend_url}/main-room/{room_id}"

        subject = f"{requester_name} requested a break - Meedi8"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                     background: linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%);
                     margin: 0;
                     padding: 40px 20px;">

            <div style="max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        overflow: hidden;">

                <div style="background: linear-gradient(135deg, #D3C1FF 0%, #B8A7E5 100%);
                            padding: 30px 20px;
                            text-align: center;">
                    <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 300;">
                        Break Requested
                    </h1>
                </div>

                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; font-size: 24px; font-weight: 400; margin: 0 0 20px 0;">
                        Hi {to_name},
                    </h2>

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        <strong>{requester_name}</strong> has requested a breathing break in your mediation session.
                    </p>

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Taking breaks during difficult conversations is healthy.
                        When you're both ready, you can continue the mediation.
                    </p>

                    <div style="text-align: center; margin: 40px 0;">
                        <a href="{room_url}"
                           style="display: inline-block;
                                  background: #B8A7E5;
                                  color: white;
                                  text-decoration: none;
                                  padding: 16px 40px;
                                  border-radius: 12px;
                                  font-size: 18px;
                                  font-weight: 500;">
                            View Session →
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Hi {to_name},

        {requester_name} has requested a breathing break in your mediation session.

        Taking breaks during difficult conversations is healthy.
        When you're both ready, you can continue the mediation.

        View session: {room_url}
        """

        message = Mail(
            from_email=Email(FROM_EMAIL, FROM_NAME),
            to_emails=To(to_email, to_name),
            subject=subject,
            plain_text_content=Content("text/plain", text_content),
            html_content=Content("text/html", html_content)
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        logger.info(f"✅ Break notification sent to {to_email} (status: {response.status_code})")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to send break notification to {to_email}: {str(e)}")
        return False
