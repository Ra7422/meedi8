"""
Seed daily challenges for gamification system.
Run with: python -m app.services.seed_challenges
"""

from app.db import SessionLocal
from app.models.gamification import DailyChallenge

CHALLENGES = [
    # Breathing Challenges
    {
        "code": "breathing_1",
        "title": "Take a Breath",
        "description": "Complete 1 breathing exercise",
        "challenge_type": "daily",
        "requirements": {"action": "breathing", "count": 1},
        "score_reward": 3,
        "is_active": True
    },
    {
        "code": "breathing_3",
        "title": "Breath Master",
        "description": "Complete 3 breathing exercises",
        "challenge_type": "daily",
        "requirements": {"action": "breathing", "count": 3},
        "score_reward": 8,
        "is_active": True
    },

    # Gratitude Challenges
    {
        "code": "gratitude_1",
        "title": "Grateful Heart",
        "description": "Write 1 gratitude entry",
        "challenge_type": "daily",
        "requirements": {"action": "gratitude", "count": 1},
        "score_reward": 3,
        "is_active": True
    },
    {
        "code": "gratitude_3",
        "title": "Triple Thanks",
        "description": "Write 3 gratitude entries",
        "challenge_type": "daily",
        "requirements": {"action": "gratitude", "count": 3},
        "score_reward": 8,
        "is_active": True
    },

    # Mood Tracking Challenges
    {
        "code": "mood_1",
        "title": "Check In",
        "description": "Log your mood once",
        "challenge_type": "daily",
        "requirements": {"action": "mood", "count": 1},
        "score_reward": 2,
        "is_active": True
    },
    {
        "code": "mood_2",
        "title": "Morning & Evening",
        "description": "Log your mood twice today",
        "challenge_type": "daily",
        "requirements": {"action": "mood", "count": 2},
        "score_reward": 5,
        "is_active": True
    },

    # Streak Challenges
    {
        "code": "maintain_streak",
        "title": "Keep the Flame",
        "description": "Maintain your streak today",
        "challenge_type": "daily",
        "requirements": {"action": "streak_maintain", "count": 1},
        "score_reward": 3,
        "is_active": True
    },

    # Communication Challenges
    {
        "code": "voice_1",
        "title": "Voice Pioneer",
        "description": "Send a voice message",
        "challenge_type": "daily",
        "requirements": {"action": "voice_message", "count": 1},
        "score_reward": 4,
        "is_active": True
    },
    {
        "code": "message_5",
        "title": "Communicator",
        "description": "Send 5 messages in mediation",
        "challenge_type": "daily",
        "requirements": {"action": "message", "count": 5},
        "score_reward": 5,
        "is_active": True
    },

    # Mindfulness Combo Challenges
    {
        "code": "mindful_combo",
        "title": "Mindful Trio",
        "description": "Complete breathing, gratitude, and mood",
        "challenge_type": "daily",
        "requirements": {"action": "mindful_combo", "count": 3},
        "score_reward": 10,
        "is_active": True
    },

    # Session Challenges
    {
        "code": "coaching_complete",
        "title": "Deep Dive",
        "description": "Complete a coaching session",
        "challenge_type": "daily",
        "requirements": {"action": "coaching_complete", "count": 1},
        "score_reward": 8,
        "is_active": True
    },
    {
        "code": "resolution",
        "title": "Peacemaker",
        "description": "Reach a resolution in mediation",
        "challenge_type": "daily",
        "requirements": {"action": "resolution", "count": 1},
        "score_reward": 15,
        "is_active": True
    },

    # Engagement Challenges
    {
        "code": "daily_checkin",
        "title": "Show Up",
        "description": "Complete your daily check-in",
        "challenge_type": "daily",
        "requirements": {"action": "daily_checkin", "count": 1},
        "score_reward": 2,
        "is_active": True
    },
    {
        "code": "profile_view",
        "title": "Self Reflection",
        "description": "View your achievements",
        "challenge_type": "daily",
        "requirements": {"action": "achievements_view", "count": 1},
        "score_reward": 2,
        "is_active": True
    },

    # Summary Challenges
    {
        "code": "read_summary",
        "title": "Perspective",
        "description": "Read your partner's summary",
        "challenge_type": "daily",
        "requirements": {"action": "summary_read", "count": 1},
        "score_reward": 5,
        "is_active": True
    },
]


def seed_challenges():
    """Seed all challenges into the database."""
    db = SessionLocal()

    try:
        created = 0
        updated = 0

        for challenge_data in CHALLENGES:
            existing = db.query(DailyChallenge).filter(
                DailyChallenge.code == challenge_data["code"]
            ).first()

            if existing:
                for key, value in challenge_data.items():
                    setattr(existing, key, value)
                updated += 1
            else:
                challenge = DailyChallenge(**challenge_data)
                db.add(challenge)
                created += 1

        db.commit()
        print(f"Seeded challenges: {created} created, {updated} updated")
        print(f"Total challenges: {len(CHALLENGES)}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding challenges: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_challenges()
