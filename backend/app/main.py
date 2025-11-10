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
