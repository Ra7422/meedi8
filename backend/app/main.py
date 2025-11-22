from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
import logging
import traceback
import uuid
from datetime import datetime
from collections import deque
from typing import Optional

# Configure logger to show startup
logger = logging.getLogger(__name__)

# ========================================
# ERROR LOG STORE (In-Memory)
# ========================================

class ErrorLogStore:
    """In-memory store for error logs with max 500 entries"""

    def __init__(self, max_size: int = 500):
        self._logs = deque(maxlen=max_size)
        self._counter = 0

    def add_error(
        self,
        error_type: str,
        message: str,
        stack_trace: str,
        endpoint: str,
        method: str,
        severity: str = "error",
        user_id: Optional[int] = None,
        request_id: Optional[str] = None
    ) -> dict:
        """Add an error to the store and return the log entry"""
        self._counter += 1
        log_entry = {
            "id": self._counter,
            "timestamp": datetime.utcnow().isoformat(),
            "error_type": error_type,
            "message": message,
            "stack_trace": stack_trace,
            "endpoint": endpoint,
            "method": method,
            "severity": severity,
            "user_id": user_id,
            "request_id": request_id or str(uuid.uuid4()),
            "resolved": False
        }
        self._logs.append(log_entry)
        return log_entry

    def get_logs(
        self,
        severity: Optional[str] = None,
        resolved: Optional[bool] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> list:
        """Get logs with optional filtering"""
        logs = list(self._logs)

        if severity:
            logs = [l for l in logs if l["severity"] == severity]

        if resolved is not None:
            logs = [l for l in logs if l["resolved"] == resolved]

        if start_date:
            logs = [l for l in logs if l["timestamp"] >= start_date]

        if end_date:
            logs = [l for l in logs if l["timestamp"] <= end_date]

        # Return newest first
        return sorted(logs, key=lambda x: x["timestamp"], reverse=True)

    def resolve_error(self, error_id: int) -> bool:
        """Mark an error as resolved"""
        for log in self._logs:
            if log["id"] == error_id:
                log["resolved"] = True
                return True
        return False

    def get_unresolved_count(self) -> int:
        """Get count of unresolved errors"""
        return sum(1 for log in self._logs if not log["resolved"])


# Global error log store instance
error_log_store = ErrorLogStore()


# ========================================
# AUDIT LOG STORE (In-Memory)
# ========================================

class AuditLogStore:
    """In-memory store for audit logs with max 1000 entries"""

    def __init__(self, max_size: int = 1000):
        self._logs = deque(maxlen=max_size)
        self._counter = 0

    def add_log(
        self,
        admin_email: str,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None
    ) -> dict:
        """Add an audit log entry and return it"""
        self._counter += 1
        log_entry = {
            "id": self._counter,
            "timestamp": datetime.utcnow().isoformat(),
            "admin_email": admin_email,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "details": details or {},
            "ip_address": ip_address
        }
        self._logs.append(log_entry)
        return log_entry

    def get_logs(
        self,
        action: Optional[str] = None,
        admin_email: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> list:
        """Get logs with optional filtering"""
        logs = list(self._logs)

        if action:
            logs = [l for l in logs if l["action"] == action]

        if admin_email:
            logs = [l for l in logs if l["admin_email"] == admin_email]

        if start_date:
            logs = [l for l in logs if l["timestamp"] >= start_date]

        if end_date:
            logs = [l for l in logs if l["timestamp"] <= end_date]

        # Return newest first
        return sorted(logs, key=lambda x: x["timestamp"], reverse=True)

    def get_action_types(self) -> list:
        """Get list of unique action types"""
        return list(set(l["action"] for l in self._logs))


# Global audit log store instance
audit_log_store = AuditLogStore()

app = FastAPI(title="Clean Air API", version="0.4.0")

# DEPLOYMENT MARKER - FIX v4 BUILD
logger.info("=" * 80)
logger.info("🚀 DEPLOYMENT FIX v4 - Telethon offset_id NoneType fix - Nov 17 2025")
logger.info("=" * 80)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# ERROR LOGGING MIDDLEWARE
# ========================================

@app.middleware("http")
async def error_logging_middleware(request: Request, call_next):
    """Middleware to catch and log unhandled exceptions"""
    request_id = str(uuid.uuid4())

    # Try to get user_id from auth header (if present)
    user_id = None
    try:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # We'll extract user_id in the exception handler if needed
            pass
    except:
        pass

    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        # Log the error
        error_log_store.add_error(
            error_type=type(exc).__name__,
            message=str(exc),
            stack_trace=traceback.format_exc(),
            endpoint=str(request.url.path),
            method=request.method,
            severity="error",
            user_id=user_id,
            request_id=request_id
        )

        # Log to standard logger as well
        logger.error(f"Unhandled exception: {exc}", exc_info=True)

        # Return a generic error response
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id}
        )


from app.routes import auth, users, rooms, admin, subscriptions, screening, telegram, gamification
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rooms.router)
app.include_router(admin.router)
app.include_router(subscriptions.router)
app.include_router(screening.router)
app.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
app.include_router(gamification.router)

# Start background scheduler for gamification jobs
from app.services.scheduler import start_scheduler, stop_scheduler

@app.on_event("startup")
async def startup_event():
    """Start background scheduler on app startup."""
    start_scheduler()
    logger.info("🎮 Gamification scheduler started")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background scheduler on app shutdown."""
    stop_scheduler()
    logger.info("🎮 Gamification scheduler stopped")

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/debug/env")
def debug_env():
    """Debug endpoint to check if env vars are loaded"""
    import os
    # Get all env vars that contain 'AWS' to debug what Railway actually has
    aws_vars = {k: v[:10] + "..." if v else "EMPTY" for k, v in os.environ.items() if "AWS" in k}
    telegram_vars = {k: v[:10] + "..." if v else "EMPTY" for k, v in os.environ.items() if "TELEGRAM" in k}
    return {
        "AWS_ACCESS_KEY_ID": "present" if os.getenv("AWS_ACCESS_KEY_ID") else "missing",
        "AWS_SECRET_ACCESS_KEY": "present" if os.getenv("AWS_SECRET_ACCESS_KEY") else "missing",
        "AWS_SECRET_KEY": "present" if os.getenv("AWS_SECRET_KEY") else "missing",  # Alternative name
        "AWS_S3_BUCKET": os.getenv("AWS_S3_BUCKET", "missing"),
        "AWS_REGION": os.getenv("AWS_REGION", "missing"),
        "OPENAI_API_KEY": "present" if os.getenv("OPENAI_API_KEY") else "missing",
        "ANTHROPIC_API_KEY": "present" if os.getenv("ANTHROPIC_API_KEY") else "missing",
        "TELEGRAM_API_ID": "present" if os.getenv("TELEGRAM_API_ID") else "missing",
        "TELEGRAM_API_HASH": "present" if os.getenv("TELEGRAM_API_HASH") else "missing",
        "TELEGRAM_SESSION_ENCRYPTION_KEY": "present" if os.getenv("TELEGRAM_SESSION_ENCRYPTION_KEY") else "missing",
        "all_aws_vars": aws_vars,  # Shows all AWS-related variables Railway has
        "all_telegram_vars": telegram_vars  # Shows all Telegram-related variables Railway has
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
