"""
Test script for SendGrid email notifications

Run this to test email delivery before enabling in production:
    python test_email.py
"""
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.services.email_service import send_turn_notification, send_break_notification


def test_turn_notification():
    """Test turn notification email"""
    print("\n" + "="*60)
    print("TESTING TURN NOTIFICATION EMAIL")
    print("="*60)

    # CHANGE THIS TO YOUR EMAIL
    test_email = input("\nEnter your email address to receive test: ")

    if not test_email or '@' not in test_email:
        print("❌ Invalid email address")
        return False

    # Test parameters
    test_name = "Adam"
    room_id = 123
    other_person_name = "Sarah"

    print(f"\nSending test email to: {test_email}")
    print(f"Scenario: Sarah just responded, now it's Adam's turn")
    print(f"Room ID: {room_id}")
    print("\nAttempting to send...")

    success = send_turn_notification(
        to_email=test_email,
        to_name=test_name,
        room_id=room_id,
        other_person_name=other_person_name
    )

    if success:
        print("\n✅ Email sent successfully!")
        print(f"📬 Check your inbox: {test_email}")
        print("   (Also check spam folder)")
        return True
    else:
        print("\n❌ Email failed to send")
        print("Check logs above for error details")
        return False


def test_break_notification():
    """Test break notification email"""
    print("\n" + "="*60)
    print("TESTING BREAK NOTIFICATION EMAIL")
    print("="*60)

    test_email = input("\nEnter your email address to receive test: ")

    if not test_email or '@' not in test_email:
        print("❌ Invalid email address")
        return False

    # Test parameters
    test_name = "Adam"
    room_id = 123
    requester_name = "Sarah"

    print(f"\nSending test email to: {test_email}")
    print(f"Scenario: Sarah requested a break")
    print(f"Room ID: {room_id}")
    print("\nAttempting to send...")

    success = send_break_notification(
        to_email=test_email,
        to_name=test_name,
        room_id=room_id,
        requester_name=requester_name
    )

    if success:
        print("\n✅ Email sent successfully!")
        print(f"📬 Check your inbox: {test_email}")
        print("   (Also check spam folder)")
        return True
    else:
        print("\n❌ Email failed to send")
        print("Check logs above for error details")
        return False


def check_configuration():
    """Check SendGrid configuration"""
    print("\n" + "="*60)
    print("CHECKING CONFIGURATION")
    print("="*60)

    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("FROM_EMAIL", "notifications@meedi8.com")
    enabled = os.getenv("EMAIL_NOTIFICATIONS_ENABLED", "false").lower() == "true"
    frontend_url = os.getenv("FRONTEND_URL", "https://meedi8.vercel.app")

    print(f"\nSENDGRID_API_KEY: {'✅ Set' if api_key else '❌ Missing'}")
    if api_key:
        print(f"  (starts with: {api_key[:15]}...)")

    print(f"FROM_EMAIL: {from_email}")
    print(f"EMAIL_NOTIFICATIONS_ENABLED: {'✅ true' if enabled else '⚠️  false (notifications disabled)'}")
    print(f"FRONTEND_URL: {frontend_url}")

    if not api_key:
        print("\n❌ SENDGRID_API_KEY is required")
        print("   Get it from: https://app.sendgrid.com/settings/api_keys")
        return False

    if not enabled:
        print("\n⚠️  EMAIL_NOTIFICATIONS_ENABLED is false")
        print("   Emails will be logged but not actually sent")
        print("   Set to 'true' to enable sending")

    return True


def main():
    """Main test runner"""
    print("\n" + "="*60)
    print("SENDGRID EMAIL SERVICE TEST")
    print("="*60)

    # Check configuration first
    if not check_configuration():
        print("\n❌ Configuration incomplete")
        print("\nSee SENDGRID_SETUP.md for setup instructions")
        return

    # Menu
    while True:
        print("\n" + "="*60)
        print("SELECT TEST TYPE")
        print("="*60)
        print("\n1. Turn Notification (when it's your turn to respond)")
        print("2. Break Notification (when other person requests break)")
        print("3. Check Configuration")
        print("4. Exit")

        choice = input("\nEnter choice (1-4): ").strip()

        if choice == "1":
            test_turn_notification()
        elif choice == "2":
            test_break_notification()
        elif choice == "3":
            check_configuration()
        elif choice == "4":
            print("\n👋 Exiting test script")
            break
        else:
            print("❌ Invalid choice, try again")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
