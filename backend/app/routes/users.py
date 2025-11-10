from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, ConfigDict

from ..db import get_db
from ..models.user import User

router = APIRouter(prefix="/users", tags=["users"])

class UserCreate(BaseModel):
    email: EmailStr
    name: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    created_at: Optional[datetime] = None  # ✅ Python 3.9 compatible

    model_config = ConfigDict(from_attributes=True)

def get_db_dep():
    return get_db()

@router.get("/", summary="List users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db_dep)):
    return db.query(User).all()

@router.post("/", summary="Create user", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db_dep)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(email=payload.email, name=payload.name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
