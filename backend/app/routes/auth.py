from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import httpx

from ..models.user import User
from ..security import hash_password, verify_password, create_access_token
from ..db import get_db
from ..config import settings
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterIn(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthIn(BaseModel):
    token: str  # Google OAuth ID token

class FacebookAuthIn(BaseModel):
    accessToken: str  # Facebook access token
    userID: str  # Facebook user ID

class TwitterAuthIn(BaseModel):
    access_token: str  # X/Twitter OAuth token
    access_token_secret: str  # X/Twitter OAuth secret

class TelegramAuthIn(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    has_completed_screening: bool = False

class UpdateUserIn(BaseModel):
    name: Optional[str] = None

@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=payload.email, name=payload.name, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

@router.post("/google", response_model=TokenOut)
async def google_login(payload: GoogleAuthIn, db: Session = Depends(get_db)):
    """Login or register using Google OAuth token"""
    try:
        # Verify the Google token with Google's API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.token}"
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")

            google_data = response.json()
            email = google_data.get("email")
            name = google_data.get("name")
            picture = google_data.get("picture")

            if not email:
                raise HTTPException(status_code=400, detail="Email not provided by Google")

            # Find or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                # Create new user with Google profile data
                user = User(
                    email=email,
                    name=name,
                    profile_picture_url=picture,
                    hashed_password=None  # No password for OAuth users
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update existing user's profile picture if they don't have one or if Google provides a new one
                if picture and (not user.profile_picture_url or user.profile_picture_url != picture):
                    user.profile_picture_url = picture
                    if not user.name and name:
                        user.name = name
                    db.commit()

            # Create access token
            token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            return TokenOut(access_token=token)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify Google token: {str(e)}")

@router.post("/facebook", response_model=TokenOut)
async def facebook_login(payload: FacebookAuthIn, db: Session = Depends(get_db)):
    """Login or register using Facebook access token"""
    try:
        # Verify Facebook token and get user data
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token={payload.accessToken}"
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Facebook token")

            fb_data = response.json()
            email = fb_data.get("email")
            name = fb_data.get("name")
            picture_url = fb_data.get("picture", {}).get("data", {}).get("url")

            if not email:
                raise HTTPException(status_code=400, detail="Email not provided by Facebook")

            # Find or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    name=name,
                    profile_picture_url=picture_url,
                    hashed_password=None
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update profile picture if changed
                if picture_url and (not user.profile_picture_url or user.profile_picture_url != picture_url):
                    user.profile_picture_url = picture_url
                    if not user.name and name:
                        user.name = name
                    db.commit()

            token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            return TokenOut(access_token=token)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify Facebook token: {str(e)}")

@router.post("/twitter", response_model=TokenOut)
async def twitter_login(payload: TwitterAuthIn, db: Session = Depends(get_db)):
    """Login or register using X/Twitter OAuth credentials"""
    try:
        # Verify Twitter credentials and get user data
        async with httpx.AsyncClient() as client:
            # Note: This requires Twitter API v2 credentials
            response = await client.get(
                "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
                headers={"Authorization": f"Bearer {payload.access_token}"}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Twitter credentials")

            twitter_data = response.json().get("data", {})
            username = twitter_data.get("username")
            name = twitter_data.get("name")
            picture_url = twitter_data.get("profile_image_url", "").replace("_normal", "_400x400")  # Get larger image

            # Twitter doesn't always provide email, use username@twitter.com as fallback
            email = f"{username}@twitter.meedi8.com"  # Custom domain to avoid conflicts

            # Find or create user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    name=name or username,
                    profile_picture_url=picture_url,
                    hashed_password=None
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update profile picture if changed
                if picture_url and (not user.profile_picture_url or user.profile_picture_url != picture_url):
                    user.profile_picture_url = picture_url
                    if not user.name and name:
                        user.name = name
                    db.commit()

            token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            return TokenOut(access_token=token)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify Twitter credentials: {str(e)}")

@router.post("/telegram", response_model=TokenOut)
async def telegram_login(payload: TelegramAuthIn, db: Session = Depends(get_db)):
    """Login or register using Telegram Login Widget data"""
    import hashlib
    import hmac

    # Verify Telegram data authenticity
    bot_token = settings.TELEGRAM_BOT_TOKEN if hasattr(settings, 'TELEGRAM_BOT_TOKEN') else ""

    if not bot_token:
        raise HTTPException(status_code=500, detail="Telegram bot token not configured")

    # Create verification hash
    data_check_dict = {
        "id": str(payload.id),
        "first_name": payload.first_name,
        "auth_date": str(payload.auth_date)
    }
    if payload.last_name:
        data_check_dict["last_name"] = payload.last_name
    if payload.username:
        data_check_dict["username"] = payload.username
    if payload.photo_url:
        data_check_dict["photo_url"] = payload.photo_url

    data_check_string = "\n".join([f"{k}={v}" for k, v in sorted(data_check_dict.items())])
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if calculated_hash != payload.hash:
        raise HTTPException(status_code=401, detail="Invalid Telegram data")

    # Use Telegram ID as email (since Telegram doesn't provide email)
    email = f"telegram_{payload.id}@telegram.meedi8.com"
    name = f"{payload.first_name} {payload.last_name or ''}".strip()

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            profile_picture_url=payload.photo_url,
            hashed_password=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update profile picture if changed
        if payload.photo_url and (not user.profile_picture_url or user.profile_picture_url != payload.photo_url):
            user.profile_picture_url = payload.photo_url
            if not user.name and name:
                user.name = name
            db.commit()

    token = create_access_token({"sub": str(user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=current_user.profile_picture_url,
        has_completed_screening=current_user.has_completed_screening
    )

@router.put("/me", response_model=UserOut)
def update_me(
    payload: UpdateUserIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile (name)"""
    if payload.name is not None:
        current_user.name = payload.name.strip() if payload.name else current_user.name

    db.commit()
    db.refresh(current_user)

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        profile_picture_url=current_user.profile_picture_url,
        has_completed_screening=current_user.has_completed_screening
    )

@router.get("/me/usage")
def get_my_usage(
    current_user: User = Depends(get_current_user)
):
    """Get current user's subscription usage"""
    from app.middleware.rate_limit import get_usage_info
    return get_usage_info(current_user)

@router.post("/create-guest", response_model=TokenOut, status_code=201)
def create_guest(db: Session = Depends(get_db)):
    """Create a temporary guest account for users to try the platform"""
    import uuid
    import secrets

    # Generate unique guest email
    guest_uuid = str(uuid.uuid4())[:8]
    guest_email = f"guest_{guest_uuid}@temp.meedi8.com"

    # Create guest user with random password (user won't see it)
    guest = User(
        email=guest_email,
        name=f"Guest {guest_uuid}",
        hashed_password=hash_password(secrets.token_urlsafe(32)),  # Random password
        is_guest=True  # Mark as guest account
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)

    # Create access token
    token = create_access_token({"sub": str(guest.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)

class ConvertGuestIn(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: str

@router.put("/convert-guest", response_model=TokenOut)
def convert_guest(
    payload: ConvertGuestIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convert a guest account to a real account with email and password"""
    # Verify user is actually a guest
    if not current_user.is_guest:
        raise HTTPException(status_code=400, detail="Only guest accounts can be converted")

    # Check if email is already taken
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Update guest account to real account
    current_user.email = payload.email
    current_user.name = payload.name or current_user.name
    current_user.hashed_password = hash_password(payload.password)
    current_user.is_guest = False

    db.commit()
    db.refresh(current_user)

    # Return new token with updated user data
    token = create_access_token({"sub": str(current_user.id)}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return TokenOut(access_token=token)
