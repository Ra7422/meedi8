"""
Telegram Integration API Routes

Provides endpoints for connecting Telegram accounts, viewing contacts,
and downloading chat histories for conflict analysis.
"""

from typing import Dict, Tuple, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from telethon import TelegramClient

from ..db import get_db
from ..deps import get_current_user
from ..models.user import User
from ..models.telegram import TelegramSession, TelegramDownload
from ..services.telegram_service import TelegramService

router = APIRouter()

# In-memory storage for pending authentication clients
# Key: user_id, Value: (TelegramClient, phone_code_hash)
pending_clients: Dict[int, Tuple[TelegramClient, str]] = {}


# ===== Request/Response Models =====

class ConnectRequest(BaseModel):
    phone_number: str


class ConnectResponse(BaseModel):
    success: bool
    message: str


class VerifyRequest(BaseModel):
    phone_number: str
    code: str
    password: Optional[str] = None


class VerifyResponse(BaseModel):
    success: bool
    message: str


class ContactItem(BaseModel):
    id: int
    name: str
    type: str
    unread_count: int
    last_message_date: Optional[str] = None
    folder_id: Optional[int] = None
    folder_name: Optional[str] = None
    archived: bool = False
    pinned: bool = False
    profile_picture_url: Optional[str] = None


class FolderItem(BaseModel):
    id: int
    name: str


class ContactsResponse(BaseModel):
    contacts: list[ContactItem]
    folders: list[FolderItem] = []  # Add folders list


class DownloadRequest(BaseModel):
    chat_id: int
    start_date: str  # ISO datetime string
    end_date: str    # ISO datetime string


class DownloadResponse(BaseModel):
    success: bool
    download_id: int
    status: str


class DownloadStatusResponse(BaseModel):
    id: int
    status: str
    message_count: int
    chat_name: Optional[str] = None


class DisconnectResponse(BaseModel):
    success: bool
    message: str


class SessionStatusResponse(BaseModel):
    is_connected: bool
    phone_number: Optional[str] = None


class MessagePreviewItem(BaseModel):
    id: int
    date: str  # ISO datetime string
    sender_name: str
    text_preview: str  # First 100 chars of message
    is_outgoing: bool  # True if sent by user


class MessagesPreviewResponse(BaseModel):
    messages: list[MessagePreviewItem]
    has_more: bool  # True if there are older messages available


class DownloadHistoryItem(BaseModel):
    id: int
    chat_name: Optional[str] = None
    chat_type: Optional[str] = None
    start_date: str  # ISO datetime string
    end_date: str  # ISO datetime string
    message_count: int
    media_count: int
    status: str
    created_at: str  # ISO datetime string
    error_message: Optional[str] = None


class DownloadHistoryResponse(BaseModel):
    downloads: list[DownloadHistoryItem]


# ===== Helper Functions =====

async def background_download_task(
    encrypted_session: str,
    chat_id: int,
    start_date: datetime,
    end_date: datetime,
    db: Session,
    user_id: int,
    session_id: int,
    download_id: int = None
):
    """Background task to download chat history."""
    try:
        await TelegramService.download_chat_history(
            encrypted_session=encrypted_session,
            chat_id=chat_id,
            start_date=start_date,
            end_date=end_date,
            db=db,
            user_id=user_id,
            session_id=session_id,
            download_id=download_id  # Pass download ID to service
        )
    except Exception as e:
        # Log error - download status already updated in service
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Background download task failed for chat {chat_id}: {e}")


# ===== API Endpoints =====

@router.post("/connect", response_model=ConnectResponse)
async def connect_telegram(
    payload: ConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send verification code to phone number to initiate Telegram connection.

    The TelegramClient instance is stored in memory with the user's ID as the key.
    User must call /verify within a few minutes with the code received via SMS.
    """
    try:
        # Send verification code
        client, phone_code_hash = await TelegramService.send_verification_code(
            phone_number=payload.phone_number
        )

        # Store client and hash in memory for verification step
        pending_clients[current_user.id] = (client, phone_code_hash)

        return ConnectResponse(
            success=True,
            message="Code sent to phone"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /connect: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code"
        )


@router.post("/verify", response_model=VerifyResponse)
async def verify_telegram(
    payload: VerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify SMS code and create authenticated Telegram session.

    Retrieves the TelegramClient from memory, completes authentication,
    and stores the encrypted session in the database.
    """
    try:
        # Retrieve client from memory
        if current_user.id not in pending_clients:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending connection. Please call /connect first."
            )

        client, phone_code_hash = pending_clients[current_user.id]

        # Verify code and create session
        encrypted_session = await TelegramService.verify_code_and_create_session(
            client=client,
            phone_number=payload.phone_number,
            code=payload.code,
            phone_code_hash=phone_code_hash,
            password=payload.password,
            db=db,
            user_id=current_user.id
        )

        # Clean up pending client
        del pending_clients[current_user.id]

        return VerifyResponse(
            success=True,
            message="Connected successfully"
        )

    except ValueError as e:
        # Clean up on error
        if current_user.id in pending_clients:
            del pending_clients[current_user.id]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /verify: {e}")

        # Clean up on error
        if current_user.id in pending_clients:
            del pending_clients[current_user.id]

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify code"
        )


@router.get("/contacts", response_model=ContactsResponse)
async def get_contacts(
    limit: int = 10,
    folder_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's Telegram chats/contacts with pagination and folder filtering.

    Requires active TelegramSession in database. Returns recent chats
    with their names, types, and unread message counts.

    Query Parameters:
        limit: Number of contacts to fetch (default 10, use for "Load More")
        folder_id: Filter by folder ID (optional). If not provided, returns all contacts.
                   Use special value -1 for contacts with no folder.
    """
    import logging
    logger = logging.getLogger(__name__)
    print(f"🚀 /contacts endpoint called - user_id={current_user.id}, limit={limit}, folder_id={folder_id}")
    logger.info(f"🚀 /contacts endpoint called - user_id={current_user.id}, limit={limit}, folder_id={folder_id}")

    try:
        # Check for active session
        telegram_session = db.query(TelegramSession).filter(
            TelegramSession.user_id == current_user.id,
            TelegramSession.is_active == True
        ).first()

        if not telegram_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active Telegram session. Please connect first."
            )

        # Get dialogs from Telegram (fast - names only, no photos)
        print(f"📞 Calling TelegramService.get_dialogs() with limit={limit}, folder_id={folder_id}")
        logger.info(f"📞 Calling TelegramService.get_dialogs() with limit={limit}, folder_id={folder_id}")
        dialogs, folder_names = await TelegramService.get_dialogs(
            encrypted_session=telegram_session.encrypted_session,
            limit=limit,
            folder_id=folder_id
        )
        print(f"✅ Received {len(dialogs)} dialogs + {len(folder_names)} folders from TelegramService.get_dialogs()")
        print(f"✅ Folders: {folder_names}")
        logger.info(f"✅ Received {len(dialogs)} dialogs + {len(folder_names)} folders from TelegramService.get_dialogs()")

        # Update last_used_at timestamp
        telegram_session.last_used_at = datetime.utcnow()
        db.commit()

        # Convert to response format
        logger.info(f"🔄 Converting {len(dialogs)} dialogs to ContactItem format")
        contacts = [
            ContactItem(
                id=dialog["id"],
                name=dialog["name"],
                type=dialog["type"],
                unread_count=dialog["unread_count"],
                last_message_date=dialog.get("last_message_date"),
                folder_id=dialog.get("folder_id"),
                folder_name=dialog.get("folder_name"),
                archived=dialog.get("archived", False),
                pinned=dialog.get("pinned", False),
                profile_picture_url=dialog.get("profile_picture_url")
            )
            for dialog in dialogs
        ]

        # Convert folder_names dict to FolderItem list
        folders = [FolderItem(id=fid, name=fname) for fid, fname in folder_names.items()]

        print(f"📦 Returning {len(contacts)} contacts + {len(folders)} folders to frontend")
        print(f"📦 Folders being returned: {folders}")
        logger.info(f"📦 Returning {len(contacts)} contacts + {len(folders)} folders to frontend")
        # Log first few contacts with folder info
        for idx, contact in enumerate(contacts[:3]):
            print(f"📦 Contact #{idx}: name='{contact.name}', folder_id={contact.folder_id}, folder_name='{contact.folder_name}'")
            logger.info(f"📦 Contact #{idx}: name='{contact.name}', folder_id={contact.folder_id}, folder_name='{contact.folder_name}'")

        return ContactsResponse(contacts=contacts, folders=folders)

    except HTTPException:
        raise
    except ValueError as e:
        # ValueError from get_client_from_session means session is expired/invalid
        # This should be 404 (session not found), not 401 (user unauthorized)
        # User is authorized (they have valid JWT), they just need to reconnect Telegram
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telegram session expired or invalid. Please reconnect."
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /contacts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch contacts"
        )


@router.post("/download", response_model=DownloadResponse)
async def start_download(
    payload: DownloadRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start downloading chat history for specified date range.

    Returns immediately with download_id. Use /download/{id} to check status.
    The actual download happens in the background via BackgroundTasks.
    """
    try:
        # Check for active session
        telegram_session = db.query(TelegramSession).filter(
            TelegramSession.user_id == current_user.id,
            TelegramSession.is_active == True
        ).first()

        if not telegram_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active Telegram session. Please connect first."
            )

        # Parse datetime strings
        try:
            start_date = datetime.fromisoformat(payload.start_date.replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(payload.end_date.replace('Z', '+00:00'))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format. Use ISO 8601 format: {e}"
            )

        # Validate date range
        if start_date >= end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be before end_date"
            )

        # Create download record (status='pending')
        download = TelegramDownload(
            user_id=current_user.id,
            session_id=telegram_session.id,
            chat_id=payload.chat_id,
            start_date=start_date,
            end_date=end_date,
            status="pending"
        )
        db.add(download)
        db.commit()
        db.refresh(download)

        # Schedule background task
        # Note: We need to create a new db session for the background task
        # to avoid session conflicts
        from ..db import SessionLocal

        async def download_wrapper():
            bg_db = SessionLocal()
            try:
                await background_download_task(
                    encrypted_session=telegram_session.encrypted_session,
                    chat_id=payload.chat_id,
                    start_date=start_date,
                    end_date=end_date,
                    db=bg_db,
                    user_id=current_user.id,
                    session_id=telegram_session.id,
                    download_id=download.id  # Pass existing download ID
                )
            finally:
                bg_db.close()

        background_tasks.add_task(download_wrapper)

        # Update download status to processing
        download.status = "processing"
        db.commit()

        return DownloadResponse(
            success=True,
            download_id=download.id,
            status="processing"
        )

    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /download: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start download"
        )


@router.get("/download/{download_id}", response_model=DownloadStatusResponse)
async def get_download_status(
    download_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check status of a chat download.

    Returns download progress including status, message count, and chat name.
    Authorization: Only the user who initiated the download can check its status.
    """
    try:
        # Query download with authorization check
        download = db.query(TelegramDownload).filter(
            TelegramDownload.id == download_id,
            TelegramDownload.user_id == current_user.id
        ).first()

        if not download:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Download not found"
            )

        return DownloadStatusResponse(
            id=download.id,
            status=download.status,
            message_count=download.message_count,
            chat_name=download.chat_name
        )

    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /download/{download_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch download status"
        )


@router.get("/downloads", response_model=DownloadHistoryResponse)
async def get_download_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all download history for the current user.

    Returns list of all downloads with their status, message counts, and date ranges.
    Authorization: Only returns downloads for the authenticated user.
    """
    try:
        # Query all downloads for this user, ordered by most recent first
        downloads = db.query(TelegramDownload).filter(
            TelegramDownload.user_id == current_user.id
        ).order_by(TelegramDownload.created_at.desc()).all()

        # Convert to response format
        download_items = [
            DownloadHistoryItem(
                id=d.id,
                chat_name=d.chat_name,
                chat_type=d.chat_type,
                start_date=d.start_date.isoformat(),
                end_date=d.end_date.isoformat(),
                message_count=d.message_count,
                media_count=d.media_count,
                status=d.status,
                created_at=d.created_at.isoformat(),
                error_message=d.error_message
            )
            for d in downloads
        ]

        return DownloadHistoryResponse(downloads=download_items)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /downloads: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch download history"
        )


@router.get("/session-status", response_model=SessionStatusResponse)
async def get_session_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if user has an active Telegram session.

    Returns whether user is already connected and their phone number.
    Frontend can use this to skip authentication steps if session exists.
    """
    try:
        telegram_session = db.query(TelegramSession).filter(
            TelegramSession.user_id == current_user.id,
            TelegramSession.is_active == True
        ).first()

        if telegram_session:
            return SessionStatusResponse(
                is_connected=True,
                phone_number=telegram_session.phone_number
            )
        else:
            return SessionStatusResponse(
                is_connected=False,
                phone_number=None
            )

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error checking session status: {e}")
        # Return disconnected on error to be safe
        return SessionStatusResponse(
            is_connected=False,
            phone_number=None
        )


@router.get("/messages/preview/{chat_id}", response_model=MessagesPreviewResponse)
async def preview_messages(
    chat_id: int,
    limit: int = 44,
    offset_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Preview messages from a chat without downloading them.

    Used for visual date range selection - user can browse messages
    and click to select start/end dates based on actual message content.

    Query Parameters:
        limit: Number of messages to fetch (default 44)
        offset_id: Message ID to start from (for pagination, loads older messages)

    Returns messages in reverse chronological order (newest first).
    """
    try:
        # Check for active session
        telegram_session = db.query(TelegramSession).filter(
            TelegramSession.user_id == current_user.id,
            TelegramSession.is_active == True
        ).first()

        if not telegram_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active Telegram session. Please connect first."
            )

        # Get message previews from Telegram
        messages, has_more = await TelegramService.preview_chat_messages(
            encrypted_session=telegram_session.encrypted_session,
            chat_id=chat_id,
            limit=limit,
            offset_id=offset_id
        )

        # Update last_used_at timestamp
        telegram_session.last_used_at = datetime.utcnow()
        db.commit()

        # Convert to response format
        message_items = [
            MessagePreviewItem(
                id=msg["id"],
                date=msg["date"],
                sender_name=msg["sender_name"],
                text_preview=msg["text_preview"],
                is_outgoing=msg["is_outgoing"]
            )
            for msg in messages
        ]

        return MessagesPreviewResponse(
            messages=message_items,
            has_more=has_more
        )

    except HTTPException:
        raise
    except ValueError as e:
        # ValueError now contains user-friendly messages from the service layer
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /messages/preview/{chat_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch message preview: {str(e)}"
        )


@router.delete("/disconnect", response_model=DisconnectResponse)
async def disconnect_telegram(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect and revoke Telegram session.

    Marks the user's TelegramSession as inactive. The encrypted session
    string remains in the database for audit purposes but cannot be used.
    """
    try:
        await TelegramService.disconnect_session(db=db, user_id=current_user.id)

        return DisconnectResponse(
            success=True,
            message="Disconnected"
        )

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in /disconnect: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect"
        )
