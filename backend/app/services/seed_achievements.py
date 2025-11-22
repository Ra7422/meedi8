"""
Seed achievement badges for gamification system.
Run with: python -m app.services.seed_achievements
"""

from app.db import SessionLocal
from app.models.gamification import Achievement

ACHIEVEMENTS = [
    # Communication Category
    {
        "code": "first_message",
        "name": "First Words",
        "description": "Send your first message in a mediation",
        "icon": "💬",
        "category": "communication",
        "criteria": {"type": "count", "target": "messages", "value": 1},
        "xp_reward": 10,
        "rarity": "common",
        "sort_order": 1,
        "is_hidden": False
    },
    {
        "code": "voice_pioneer",
        "name": "Voice Pioneer",
        "description": "Send your first voice message",
        "icon": "🎙️",
        "category": "communication",
        "criteria": {"type": "count", "target": "voice_messages", "value": 1},
        "xp_reward": 15,
        "rarity": "common",
        "sort_order": 2,
        "is_hidden": False
    },
    {
        "code": "eloquent",
        "name": "Eloquent",
        "description": "Send 100 messages across all sessions",
        "icon": "📝",
        "category": "communication",
        "criteria": {"type": "count", "target": "messages", "value": 100},
        "xp_reward": 50,
        "rarity": "rare",
        "sort_order": 3,
        "is_hidden": False
    },

    # Empathy Category
    {
        "code": "active_listener",
        "name": "Active Listener",
        "description": "Complete your first coaching session",
        "icon": "👂",
        "category": "empathy",
        "criteria": {"type": "count", "target": "coaching_complete", "value": 1},
        "xp_reward": 20,
        "rarity": "common",
        "sort_order": 10,
        "is_hidden": False
    },
    {
        "code": "perspective_taker",
        "name": "Perspective Taker",
        "description": "Read your partner's summary in 5 sessions",
        "icon": "🔄",
        "category": "empathy",
        "criteria": {"type": "count", "target": "summaries_read", "value": 5},
        "xp_reward": 30,
        "rarity": "rare",
        "sort_order": 11,
        "is_hidden": False
    },
    {
        "code": "breakthrough",
        "name": "Breakthrough",
        "description": "Reach a resolution in under 30 minutes",
        "icon": "💡",
        "category": "empathy",
        "criteria": {"type": "special", "target": "fast_resolution", "value": 30},
        "xp_reward": 40,
        "rarity": "epic",
        "sort_order": 12,
        "is_hidden": False
    },

    # Growth Category
    {
        "code": "first_resolution",
        "name": "First Resolution",
        "description": "Complete your first mediation successfully",
        "icon": "🌱",
        "category": "growth",
        "criteria": {"type": "count", "target": "resolutions", "value": 1},
        "xp_reward": 25,
        "rarity": "common",
        "sort_order": 20,
        "is_hidden": False
    },
    {
        "code": "peacemaker",
        "name": "Peacemaker",
        "description": "Complete 5 mediations successfully",
        "icon": "☮️",
        "category": "growth",
        "criteria": {"type": "count", "target": "resolutions", "value": 5},
        "xp_reward": 50,
        "rarity": "rare",
        "sort_order": 21,
        "is_hidden": False
    },
    {
        "code": "conflict_master",
        "name": "Conflict Master",
        "description": "Complete 25 mediations successfully",
        "icon": "🏆",
        "category": "growth",
        "criteria": {"type": "count", "target": "resolutions", "value": 25},
        "xp_reward": 100,
        "rarity": "legendary",
        "sort_order": 22,
        "is_hidden": False
    },
    {
        "code": "level_up",
        "name": "Level Up",
        "description": "Reach Silver tier",
        "icon": "🔷",
        "category": "growth",
        "criteria": {"type": "tier", "target": "health_tier", "value": "silver"},
        "xp_reward": 30,
        "rarity": "common",
        "sort_order": 23,
        "is_hidden": False
    },
    {
        "code": "golden_heart",
        "name": "Golden Heart",
        "description": "Reach Gold tier",
        "icon": "🔶",
        "category": "growth",
        "criteria": {"type": "tier", "target": "health_tier", "value": "gold"},
        "xp_reward": 50,
        "rarity": "rare",
        "sort_order": 24,
        "is_hidden": False
    },
    {
        "code": "diamond_soul",
        "name": "Diamond Soul",
        "description": "Reach Platinum tier",
        "icon": "💎",
        "category": "growth",
        "criteria": {"type": "tier", "target": "health_tier", "value": "platinum"},
        "xp_reward": 100,
        "rarity": "legendary",
        "sort_order": 25,
        "is_hidden": False
    },

    # Commitment Category
    {
        "code": "streak_7",
        "name": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon": "🔥",
        "category": "commitment",
        "criteria": {"type": "streak", "target": "current_streak", "value": 7},
        "xp_reward": 25,
        "rarity": "common",
        "sort_order": 30,
        "is_hidden": False
    },
    {
        "code": "streak_14",
        "name": "Fortnight Fighter",
        "description": "Maintain a 14-day streak",
        "icon": "🔥",
        "category": "commitment",
        "criteria": {"type": "streak", "target": "current_streak", "value": 14},
        "xp_reward": 40,
        "rarity": "rare",
        "sort_order": 31,
        "is_hidden": False
    },
    {
        "code": "streak_30",
        "name": "Monthly Master",
        "description": "Maintain a 30-day streak",
        "icon": "🔥",
        "category": "commitment",
        "criteria": {"type": "streak", "target": "current_streak", "value": 30},
        "xp_reward": 75,
        "rarity": "epic",
        "sort_order": 32,
        "is_hidden": False
    },
    {
        "code": "streak_90",
        "name": "Unstoppable",
        "description": "Maintain a 90-day streak",
        "icon": "⚡",
        "category": "commitment",
        "criteria": {"type": "streak", "target": "current_streak", "value": 90},
        "xp_reward": 150,
        "rarity": "legendary",
        "sort_order": 33,
        "is_hidden": False
    },

    # Mindfulness Category
    {
        "code": "first_breath",
        "name": "First Breath",
        "description": "Complete your first breathing exercise",
        "icon": "🫧",
        "category": "mindfulness",
        "criteria": {"type": "count", "target": "breathing_sessions", "value": 1},
        "xp_reward": 10,
        "rarity": "common",
        "sort_order": 40,
        "is_hidden": False
    },
    {
        "code": "breath_master",
        "name": "Breath Master",
        "description": "Complete 50 breathing exercises",
        "icon": "🌬️",
        "category": "mindfulness",
        "criteria": {"type": "count", "target": "breathing_sessions", "value": 50},
        "xp_reward": 50,
        "rarity": "rare",
        "sort_order": 41,
        "is_hidden": False
    },
    {
        "code": "zen_master",
        "name": "Zen Master",
        "description": "Breathe for 100 total minutes",
        "icon": "🧘",
        "category": "mindfulness",
        "criteria": {"type": "count", "target": "breathing_minutes", "value": 100},
        "xp_reward": 75,
        "rarity": "epic",
        "sort_order": 42,
        "is_hidden": False
    },
    {
        "code": "gratitude_starter",
        "name": "Gratitude Starter",
        "description": "Write your first gratitude entry",
        "icon": "💜",
        "category": "mindfulness",
        "criteria": {"type": "count", "target": "gratitude_entries", "value": 1},
        "xp_reward": 10,
        "rarity": "common",
        "sort_order": 43,
        "is_hidden": False
    },
    {
        "code": "gratitude_champion",
        "name": "Gratitude Champion",
        "description": "Write 30 gratitude entries",
        "icon": "🙏",
        "category": "mindfulness",
        "criteria": {"type": "count", "target": "gratitude_entries", "value": 30},
        "xp_reward": 50,
        "rarity": "rare",
        "sort_order": 44,
        "is_hidden": False
    },
    {
        "code": "mood_tracker",
        "name": "Mood Tracker",
        "description": "Log your mood 7 days in a row",
        "icon": "🌤️",
        "category": "mindfulness",
        "criteria": {"type": "count", "target": "mood_checkins", "value": 7},
        "xp_reward": 25,
        "rarity": "common",
        "sort_order": 45,
        "is_hidden": False
    },
    {
        "code": "emotional_intelligence",
        "name": "Emotional Intelligence",
        "description": "Log 50 mood check-ins",
        "icon": "🎭",
        "category": "mindfulness",
        "criteria": {"type": "count", "target": "mood_checkins", "value": 50},
        "xp_reward": 50,
        "rarity": "rare",
        "sort_order": 46,
        "is_hidden": False
    },

    # Hidden/Secret Achievements
    {
        "code": "night_owl",
        "name": "Night Owl",
        "description": "Complete a session after midnight",
        "icon": "🦉",
        "category": "commitment",
        "criteria": {"type": "special", "target": "late_night", "value": 0},
        "xp_reward": 20,
        "rarity": "rare",
        "sort_order": 50,
        "is_hidden": True
    },
    {
        "code": "early_bird",
        "name": "Early Bird",
        "description": "Complete a session before 6am",
        "icon": "🐦",
        "category": "commitment",
        "criteria": {"type": "special", "target": "early_morning", "value": 6},
        "xp_reward": 20,
        "rarity": "rare",
        "sort_order": 51,
        "is_hidden": True
    },
]


def seed_achievements():
    """Seed all achievements into the database."""
    db = SessionLocal()

    try:
        created = 0
        updated = 0

        for achievement_data in ACHIEVEMENTS:
            # Check if achievement already exists
            existing = db.query(Achievement).filter(
                Achievement.code == achievement_data["code"]
            ).first()

            if existing:
                # Update existing achievement
                for key, value in achievement_data.items():
                    setattr(existing, key, value)
                updated += 1
            else:
                # Create new achievement
                achievement = Achievement(**achievement_data)
                db.add(achievement)
                created += 1

        db.commit()
        print(f"✅ Seeded achievements: {created} created, {updated} updated")
        print(f"   Total achievements: {len(ACHIEVEMENTS)}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding achievements: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_achievements()
