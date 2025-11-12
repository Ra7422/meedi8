from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="Clean Air API", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes import auth, users, rooms, admin, subscriptions, screening
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rooms.router)
app.include_router(admin.router)
app.include_router(subscriptions.router)
app.include_router(screening.router)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/debug/env")
def debug_env():
    """Debug endpoint to check if AWS env vars are loaded"""
    import os
    # Get all env vars that contain 'AWS' to debug what Railway actually has
    aws_vars = {k: v[:10] + "..." if v else "EMPTY" for k, v in os.environ.items() if "AWS" in k}
    return {
        "AWS_ACCESS_KEY_ID": "present" if os.getenv("AWS_ACCESS_KEY_ID") else "missing",
        "AWS_SECRET_ACCESS_KEY": "present" if os.getenv("AWS_SECRET_ACCESS_KEY") else "missing",
        "AWS_SECRET_KEY": "present" if os.getenv("AWS_SECRET_KEY") else "missing",  # Alternative name
        "AWS_S3_BUCKET": os.getenv("AWS_S3_BUCKET", "missing"),
        "AWS_REGION": os.getenv("AWS_REGION", "missing"),
        "OPENAI_API_KEY": "present" if os.getenv("OPENAI_API_KEY") else "missing",
        "ANTHROPIC_API_KEY": "present" if os.getenv("ANTHROPIC_API_KEY") else "missing",
        "all_aws_vars": aws_vars  # Shows all AWS-related variables Railway has
    }

@app.get("/debug/database")
def debug_database():
    """Debug endpoint to check database schema and recent migrations"""
    from app.db import SessionLocal
    from sqlalchemy import text, inspect

    db = SessionLocal()
    try:
        # Check if critical columns exist
        inspector = inspect(db.bind)

        # Check rooms table columns
        rooms_columns = [col['name'] for col in inspector.get_columns('rooms')]

        # Check turns table columns
        turns_columns = [col['name'] for col in inspector.get_columns('turns')]

        # Check alembic version
        result = db.execute(text("SELECT version_num FROM alembic_version")).fetchone()
        current_migration = result[0] if result else "no_migration_applied"

        return {
            "database_url": settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else "sqlite",
            "current_migration": current_migration,
            "rooms_has_room_type": "room_type" in rooms_columns,
            "rooms_has_clarity_summary": "clarity_summary" in rooms_columns,
            "rooms_has_solo_columns": all(col in rooms_columns for col in ["room_type", "clarity_summary", "key_insights", "suggested_actions"]),
            "turns_has_attachment_url": "attachment_url" in turns_columns,
            "turns_has_attachment_filename": "attachment_filename" in turns_columns,
            "rooms_all_columns": rooms_columns,
            "turns_all_columns": turns_columns,
            "tags_column_type": str(inspector.get_columns('turns')[next(i for i, col in enumerate(inspector.get_columns('turns')) if col['name'] == 'tags')]['type']),
        }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
    finally:
        db.close()

@app.get("/debug/cors")
def debug_cors():
    """Debug endpoint to check CORS configuration"""
    import os
    cors_origins_raw = os.getenv("CORS_ORIGINS", "NOT_SET")
    return {
        "cors_origins_raw": cors_origins_raw,
        "cors_list_from_settings": settings.cors_list,
        "cors_list_length": len(settings.cors_list),
        "app_env": settings.APP_ENV,
        "secret_key_first_10": settings.SECRET_KEY[:10] + "...",
        "secret_key_is_default": settings.SECRET_KEY == "dev-secret-change-me",
    }
