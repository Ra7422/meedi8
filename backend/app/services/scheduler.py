"""
Background scheduler for daily gamification jobs.
Uses APScheduler to run tasks at specific times.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models.gamification import UserProgress, ScoreEvent
from .gamification_helpers import get_or_create_progress, update_score

# Score penalties for inactivity
INACTIVITY_PENALTIES = {
    7: -5,   # 7 days inactive
    14: -10, # 14 days inactive
    30: -15  # 30 days inactive
}

scheduler = BackgroundScheduler()


def break_expired_streaks():
    """Break streaks for users who haven't been active in 24+ hours."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        threshold = now - timedelta(hours=24)

        # Find users with active streaks who haven't been active
        users_to_break = db.query(UserProgress).filter(
            UserProgress.current_streak > 0,
            UserProgress.streak_last_activity < threshold,
            # Skip if protected
            (UserProgress.streak_protected_until == None) |
            (UserProgress.streak_protected_until < now)
        ).all()

        broken_count = 0
        for progress in users_to_break:
            # Store longest streak if current is higher
            if progress.current_streak > progress.longest_streak:
                progress.longest_streak = progress.current_streak

            old_streak = progress.current_streak
            progress.current_streak = 0
            broken_count += 1

            print(f"Broke streak for user {progress.user_id}: {old_streak} days -> 0")

        db.commit()
        print(f"[Scheduler] Broke {broken_count} expired streaks at {now}")

    except Exception as e:
        print(f"[Scheduler] Error breaking streaks: {e}")
        db.rollback()
    finally:
        db.close()


def apply_inactivity_penalties():
    """Apply score penalties for users who haven't been active."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        penalties_applied = 0

        for days, penalty in INACTIVITY_PENALTIES.items():
            threshold = now - timedelta(days=days)

            # Find users inactive for this many days
            inactive_users = db.query(UserProgress).filter(
                UserProgress.streak_last_activity < threshold,
                UserProgress.current_score > 0  # Only penalize if they have score
            ).all()

            for progress in inactive_users:
                # Check if we already applied this penalty level today
                existing_penalty = db.query(ScoreEvent).filter(
                    ScoreEvent.user_id == progress.user_id,
                    ScoreEvent.event_type == f"inactivity_penalty_{days}d",
                    ScoreEvent.created_at >= now.replace(hour=0, minute=0, second=0)
                ).first()

                if existing_penalty:
                    continue

                # Apply penalty
                update_score(
                    db, progress, f"inactivity_penalty_{days}d", penalty,
                    description=f"{days}-day inactivity penalty"
                )
                penalties_applied += 1

                print(f"Applied {days}-day penalty ({penalty} pts) to user {progress.user_id}")

        db.commit()
        print(f"[Scheduler] Applied {penalties_applied} inactivity penalties at {now}")

    except Exception as e:
        print(f"[Scheduler] Error applying penalties: {e}")
        db.rollback()
    finally:
        db.close()


def rotate_daily_challenges():
    """Assign new daily challenges to all users at midnight."""
    # This is handled by the GET /challenges endpoint which auto-assigns
    # when user fetches challenges for a new day
    print(f"[Scheduler] Daily challenge rotation triggered at {datetime.utcnow()}")


def start_scheduler():
    """Start the background scheduler with all jobs."""

    # Break expired streaks - run at midnight UTC
    scheduler.add_job(
        break_expired_streaks,
        CronTrigger(hour=0, minute=0),
        id="break_expired_streaks",
        replace_existing=True
    )

    # Apply inactivity penalties - run at 1 AM UTC
    scheduler.add_job(
        apply_inactivity_penalties,
        CronTrigger(hour=1, minute=0),
        id="apply_inactivity_penalties",
        replace_existing=True
    )

    # Rotate challenges - run at midnight UTC
    scheduler.add_job(
        rotate_daily_challenges,
        CronTrigger(hour=0, minute=5),
        id="rotate_daily_challenges",
        replace_existing=True
    )

    scheduler.start()
    print("[Scheduler] Background scheduler started with jobs:")
    print("  - break_expired_streaks: daily at 00:00 UTC")
    print("  - apply_inactivity_penalties: daily at 01:00 UTC")
    print("  - rotate_daily_challenges: daily at 00:05 UTC")


def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        print("[Scheduler] Background scheduler stopped")
