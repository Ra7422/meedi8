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
    return {
        "AWS_ACCESS_KEY_ID": "present" if os.getenv("AWS_ACCESS_KEY_ID") else "missing",
        "AWS_SECRET_ACCESS_KEY": "present" if os.getenv("AWS_SECRET_ACCESS_KEY") else "missing",
        "AWS_S3_BUCKET": os.getenv("AWS_S3_BUCKET", "missing"),
        "AWS_REGION": os.getenv("AWS_REGION", "missing"),
        "OPENAI_API_KEY": "present" if os.getenv("OPENAI_API_KEY") else "missing",
        "ANTHROPIC_API_KEY": "present" if os.getenv("ANTHROPIC_API_KEY") else "missing"
    }
