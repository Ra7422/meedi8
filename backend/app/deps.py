from fastapi import Depends, HTTPException, status, Request
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.services.subscription_service import get_or_create_subscription, is_admin as check_is_admin

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    import logging
    logger = logging.getLogger(__name__)

    auth = request.headers.get("Authorization")
    logger.info(f"🔐 Auth header present: {bool(auth)}, Path: {request.url.path}")

    if not auth or not auth.lower().startswith("bearer "):
        logger.warning(f"❌ No valid auth header on {request.url.path}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = auth.split(" ", 1)[1].strip()
    logger.info(f"🎫 Token (first 20 chars): {token[:20]}...")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
        logger.info(f"✅ Token decoded successfully, user_id: {user_id}")
    except ExpiredSignatureError as e:
        # Handle expired tokens explicitly
        logger.error(f"❌ Token expired on {request.url.path}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired. Please log in again.")
    except (JWTError, ValueError, TypeError) as e:
        logger.error(f"❌ Token decode failed on {request.url.path}: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"❌ User {user_id} not found in database")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    logger.info(f"✅ User authenticated: {user.email}")
    return user


def get_current_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Subscription:
    """Get or create subscription for current user"""
    return get_or_create_subscription(db, user.id)


def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> User | None:
    """
    Optional authentication - returns User if authenticated, None if not.
    Use this for endpoints that support both authenticated and guest access.
    """
    import logging
    logger = logging.getLogger(__name__)

    auth = request.headers.get("Authorization")

    if not auth or not auth.lower().startswith("bearer "):
        logger.info(f"👤 No auth header, treating as guest on {request.url.path}")
        return None

    token = auth.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            logger.info(f"✅ Authenticated user: {user.email}")
            return user
        else:
            logger.warning(f"❌ Token valid but user {user_id} not found")
            return None
    except Exception as e:
        logger.warning(f"⚠️ Token decode failed, treating as guest: {type(e).__name__}")
        return None


def require_admin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Require user to be an admin"""
    if not check_is_admin(db, user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
