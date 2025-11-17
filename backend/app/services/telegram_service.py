"""
Telegram Integration Service

Handles Telegram Client API authentication, session management, and chat history downloads.
Uses Telethon library for interacting with Telegram's MTProto API.
"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from cryptography.fernet import Fernet
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import User as TelegramUser, Chat, Channel, Message
from telethon.tl.types import DialogFilter, DialogFilterDefault, DialogFilterChatlist
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PhoneNumberInvalidError
from sqlalchemy.orm import Session

from ..models.telegram import TelegramSession, TelegramDownload, TelegramMessage
from ..models.user import User

logger = logging.getLogger(__name__)

# Environment variables
TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_SESSION_ENCRYPTION_KEY = os.getenv("TELEGRAM_SESSION_ENCRYPTION_KEY")

# Initialize Fernet cipher for session encryption
if TELEGRAM_SESSION_ENCRYPTION_KEY:
    cipher = Fernet(TELEGRAM_SESSION_ENCRYPTION_KEY.encode())
else:
    logger.warning("TELEGRAM_SESSION_ENCRYPTION_KEY not set - session encryption disabled")
    cipher = None


class TelegramService:
    """Service for managing Telegram client connections and data downloads."""

    @staticmethod
    def encrypt_session(session_string: str) -> str:
        """Encrypt a Telethon session string for secure storage."""
        if not cipher:
            raise ValueError("Encryption key not configured")
        return cipher.encrypt(session_string.encode()).decode()

    @staticmethod
    def decrypt_session(encrypted_session: str) -> str:
        """Decrypt a stored session string."""
        if not cipher:
            raise ValueError("Encryption key not configured")
        return cipher.decrypt(encrypted_session.encode()).decode()

    @staticmethod
    async def send_verification_code(phone_number: str) -> Tuple[TelegramClient, str]:
        """
        Send verification code to phone number and return client instance.

        Returns:
            Tuple of (TelegramClient instance, phone_code_hash)
        """
        if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
            raise ValueError("Telegram API credentials not configured")

        # Create client with empty StringSession
        client = TelegramClient(StringSession(), int(TELEGRAM_API_ID), TELEGRAM_API_HASH)

        try:
            await client.connect()

            # Send code request
            result = await client.send_code_request(phone_number)
            phone_code_hash = result.phone_code_hash

            logger.info(f"Verification code sent to {phone_number}")
            return client, phone_code_hash

        except PhoneNumberInvalidError:
            await client.disconnect()
            raise ValueError("Invalid phone number format")
        except Exception as e:
            await client.disconnect()
            logger.error(f"Error sending verification code: {e}")
            raise

    @staticmethod
    async def verify_code_and_create_session(
        client: TelegramClient,
        phone_number: str,
        code: str,
        phone_code_hash: str,
        password: Optional[str] = None,
        db: Session = None,
        user_id: int = None
    ) -> str:
        """
        Verify phone code and create authenticated session.

        Args:
            client: TelegramClient instance from send_verification_code
            phone_number: User's phone number
            code: Verification code received via SMS
            phone_code_hash: Hash from send_code_request
            password: 2FA password if enabled (optional)
            db: Database session (optional, for storing session)
            user_id: User ID to associate session with (optional)

        Returns:
            Encrypted session string
        """
        try:
            # Sign in with code
            await client.sign_in(phone_number, code, phone_code_hash=phone_code_hash)

        except SessionPasswordNeededError:
            # 2FA is enabled
            if not password:
                raise ValueError("Two-factor authentication is enabled. Password required.")
            await client.sign_in(password=password)

        except PhoneCodeInvalidError:
            await client.disconnect()
            raise ValueError("Invalid verification code")

        # Get session string
        session_string = client.session.save()

        # Encrypt session
        encrypted_session = TelegramService.encrypt_session(session_string)

        # Store in database if provided
        if db and user_id:
            existing_session = db.query(TelegramSession).filter(
                TelegramSession.user_id == user_id
            ).first()

            if existing_session:
                # Update existing
                existing_session.encrypted_session = encrypted_session
                existing_session.phone_number = phone_number
                existing_session.is_active = True
                existing_session.updated_at = datetime.utcnow()
                existing_session.last_used_at = datetime.utcnow()
            else:
                # Create new
                telegram_session = TelegramSession(
                    user_id=user_id,
                    encrypted_session=encrypted_session,
                    phone_number=phone_number,
                    is_active=True
                )
                db.add(telegram_session)

            db.commit()
            logger.info(f"Session stored for user {user_id}")

        await client.disconnect()
        return encrypted_session

    @staticmethod
    async def get_client_from_session(encrypted_session: str) -> TelegramClient:
        """
        Create authenticated TelegramClient from encrypted session string.

        Args:
            encrypted_session: Encrypted session string from database

        Returns:
            Connected and authenticated TelegramClient instance
        """
        if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
            raise ValueError("Telegram API credentials not configured")

        # Decrypt session
        session_string = TelegramService.decrypt_session(encrypted_session)

        # Create client with session
        client = TelegramClient(
            StringSession(session_string),
            int(TELEGRAM_API_ID),
            TELEGRAM_API_HASH
        )

        await client.connect()

        # Verify session is still valid
        if not await client.is_user_authorized():
            await client.disconnect()
            raise ValueError("Session expired or invalid")

        return client

    @staticmethod
    async def get_dialogs(encrypted_session: str, limit: int = 10, folder_id: Optional[int] = None) -> Tuple[List[Dict], Dict[int, str]]:
        """
        Get user's recent chats/dialogs including pinned, folders, and archived.

        Args:
            encrypted_session: Encrypted session string
            limit: Maximum number of dialogs to fetch (default 10 for fast initial load)
            folder_id: Filter by folder ID (optional). None = all contacts, -1 = no folder

        Returns:
            Tuple of (dialogs list, folder_names dictionary)
            - dialogs: List of dialog dictionaries with id, name, type, unread_count, folder, archived, pinned
            - folder_names: Dict mapping folder IDs to folder names {3: 'Top G', 42: 'Safeguard', ...}
        """
        client = await TelegramService.get_client_from_session(encrypted_session)

        try:
            dialogs = []

            logger.info(f"Starting dialog fetch targeting {limit} users (will iterate until we find enough)")

            # Fetch custom folder names from Telegram
            from telethon import functions
            from telethon.tl.types import InputPeerUser, InputPeerChat, InputPeerChannel

            folder_names = {}
            peer_to_folder = {}  # Map peer_id → folder_id

            try:
                # GetDialogFiltersRequest returns a DialogFilters object with a 'filters' attribute
                dialog_filters_result = await client(functions.messages.GetDialogFiltersRequest())

                # Access the 'filters' attribute from the DialogFilters object
                filters_list = dialog_filters_result.filters if hasattr(dialog_filters_result, 'filters') else []
                print(f"📊 Processing {len(filters_list)} filters")
                logger.info(f"📊 Processing {len(filters_list)} filters")

                # Build folder_names and peer_to_folder mapping
                # Also track folder order for proper sorting
                folder_order = {}  # folder_id → order/position

                for idx, folder_filter in enumerate(filters_list):
                    # Only include custom folders (DialogFilter) created by user
                    if isinstance(folder_filter, DialogFilter):
                        # Extract text from TextWithEntities object
                        title_text = folder_filter.title.text if hasattr(folder_filter.title, 'text') else str(folder_filter.title)
                        folder_names[folder_filter.id] = title_text

                        # Store the order (use index from filters_list as fallback)
                        order = getattr(folder_filter, 'order', idx)
                        folder_order[folder_filter.id] = order
                        print(f"📁 Folder '{title_text}' (id={folder_filter.id}) order={order}")
                        logger.info(f"📁 Folder '{title_text}' (id={folder_filter.id}) order={order}")

                        # Build peer → folder mapping from include_peers
                        if hasattr(folder_filter, 'include_peers') and folder_filter.include_peers:
                            print(f"📁 Folder '{title_text}' (id={folder_filter.id}) has {len(folder_filter.include_peers)} include_peers")
                            logger.info(f"📁 Folder '{title_text}' (id={folder_filter.id}) has {len(folder_filter.include_peers)} include_peers")

                            for peer in folder_filter.include_peers:
                                # Extract the actual peer ID from InputPeer objects
                                peer_id = None
                                if isinstance(peer, InputPeerUser):
                                    peer_id = peer.user_id
                                elif isinstance(peer, InputPeerChat):
                                    peer_id = peer.chat_id
                                elif isinstance(peer, InputPeerChannel):
                                    peer_id = peer.channel_id

                                if peer_id:
                                    # A peer can be in multiple folders, store as list
                                    if peer_id not in peer_to_folder:
                                        peer_to_folder[peer_id] = []
                                    peer_to_folder[peer_id].append(folder_filter.id)
                                    print(f"  📌 Peer {peer_id} → folder {folder_filter.id}")
                                    logger.info(f"  📌 Peer {peer_id} → folder {folder_filter.id}")
                        else:
                            print(f"📁 Folder '{title_text}' (id={folder_filter.id}) uses generic filters (no specific peers)")
                            logger.info(f"📁 Folder '{title_text}' (id={folder_filter.id}) uses generic filters")

                print(f"📁 FINAL: {len(folder_names)} folders, {len(peer_to_folder)} peers mapped")
                logger.info(f"📁 FINAL: {len(folder_names)} folders, {len(peer_to_folder)} peers mapped")
            except Exception as e:
                logger.warning(f"❌ Could not fetch folder names: {e}")
                logger.exception("Full traceback:")
                # Continue without custom folder names

            # Fetch dialogs - include users, groups, and channels
            dialog_count = 0
            item_count = 0
            async for dialog in client.iter_dialogs():
                dialog_count += 1
                entity = dialog.entity

                # Determine chat type and name
                if isinstance(entity, TelegramUser):
                    chat_type = "user"
                    chat_name = entity.first_name or ""
                    if entity.last_name:
                        chat_name += f" {entity.last_name}"
                    # Add username if available
                    if hasattr(entity, 'username') and entity.username:
                        chat_name += f" (@{entity.username})"
                elif isinstance(entity, Chat):
                    chat_type = "group"
                    chat_name = entity.title or "Unnamed Group"
                elif isinstance(entity, Channel):
                    # Channels can be broadcast channels or supergroups
                    if entity.megagroup:
                        chat_type = "supergroup"
                    else:
                        chat_type = "channel"
                    chat_name = entity.title or "Unnamed Channel"
                else:
                    # Unknown type - skip
                    continue

                # Get folder information from peer_to_folder mapping
                peer_id = entity.id
                dialog_folder_ids = peer_to_folder.get(peer_id, [])  # List of folder IDs this peer belongs to

                # Use the first folder for display purposes (peers can be in multiple folders)
                dialog_folder_id = dialog_folder_ids[0] if dialog_folder_ids else None
                folder_name = None
                if dialog_folder_id:
                    folder_name = folder_names.get(dialog_folder_id, f"Folder {dialog_folder_id}")

                print(f"🔍 Dialog '{chat_name}' (peer_id={peer_id}): folders={dialog_folder_ids}, using folder_id={dialog_folder_id}")
                logger.info(f"🔍 Dialog '{chat_name}' (peer_id={peer_id}): folders={dialog_folder_ids}")

                # Skip this dialog if filtering by folder and it doesn't match
                if folder_id is not None:  # None means no filter, show all
                    if folder_id == -1:  # -1 means "no folder"
                        if dialog_folder_id is not None:
                            print(f"⏭️  SKIPPING '{chat_name}' - has folder, but we want no folder")
                            continue  # Skip this dialog, it has a folder
                        else:
                            print(f"✅ KEEPING '{chat_name}' - has no folder (matches filter)")
                    elif folder_id not in dialog_folder_ids:
                        print(f"⏭️  SKIPPING '{chat_name}' - not in folder {folder_id}")
                        continue  # Skip this dialog, not in requested folder
                    else:
                        print(f"✅ KEEPING '{chat_name}' - in folder {folder_id}")
                else:
                    print(f"✅ KEEPING '{chat_name}' - no filter (showing all)")

                # Check if archived
                is_archived = dialog.archived if hasattr(dialog, 'archived') else False

                # Check if pinned (favorite)
                is_pinned = dialog.pinned if hasattr(dialog, 'pinned') else False

                dialogs.append({
                    "id": entity.id,
                    "name": chat_name,
                    "type": chat_type,
                    "unread_count": dialog.unread_count,
                    "last_message_date": dialog.date.isoformat() if dialog.date else None,
                    "folder_id": dialog_folder_id,
                    "folder_name": folder_name,
                    "archived": is_archived,
                    "pinned": is_pinned,
                    "profile_picture_url": None  # Lazy-loaded when chat is downloaded
                })

                item_count += 1

                # Stop once we have enough items
                if item_count >= limit:
                    logger.info(f"Reached target of {limit} items, stopping iteration")
                    break

                # Log progress every 10 dialogs for debugging
                if dialog_count % 10 == 0:
                    logger.info(f"Processed {dialog_count} dialogs, found {item_count} items so far...")

            logger.info(f"Successfully fetched {len(dialogs)} dialogs from Telegram (iterated through {dialog_count} total)")

            # Log detailed dialog info to debug folder display
            logger.info(f"📤 RETURNING {len(dialogs)} dialogs to API")
            for idx, dialog in enumerate(dialogs):
                logger.info(f"📤 Dialog #{idx}: name='{dialog['name']}', folder_id={dialog.get('folder_id')}, folder_name='{dialog.get('folder_name')}'")

            if len(dialogs) == 0:
                logger.warning("No dialogs found! This could indicate:")
                logger.warning("  1. Account has no chats (unlikely)")
                logger.warning("  2. Session permissions issue")
                logger.warning("  3. Telegram API rate limiting")
                logger.warning("  4. iter_dialogs filtering issue")

            print(f"📤 RETURNING: {len(dialogs)} dialogs + {len(folder_names)} folders")
            return dialogs, folder_names

        except Exception as e:
            logger.error(f"Error fetching dialogs: {e}", exc_info=True)
            raise
        finally:
            await client.disconnect()

    @staticmethod
    async def download_chat_history(
        encrypted_session: str,
        chat_id: int,
        start_date: datetime,
        end_date: datetime,
        db: Session,
        user_id: int,
        session_id: int
    ) -> int:
        """
        Download chat history for specified date range.

        Args:
            encrypted_session: Encrypted session string
            chat_id: Telegram chat ID to download from
            start_date: Start of date range (inclusive)
            end_date: End of date range (inclusive)
            db: Database session
            user_id: User ID for tracking
            session_id: TelegramSession ID

        Returns:
            TelegramDownload ID
        """
        client = await TelegramService.get_client_from_session(encrypted_session)

        # Create download record
        download = TelegramDownload(
            user_id=user_id,
            session_id=session_id,
            chat_id=chat_id,
            start_date=start_date,
            end_date=end_date,
            status="processing"
        )
        db.add(download)
        db.commit()
        db.refresh(download)

        try:
            # Get chat entity
            entity = await client.get_entity(chat_id)

            # Update chat info
            if isinstance(entity, TelegramUser):
                chat_name = entity.first_name or ""
                if entity.last_name:
                    chat_name += f" {entity.last_name}"
                download.chat_type = "user"
            elif isinstance(entity, Chat):
                chat_name = entity.title
                download.chat_type = "group"
            elif isinstance(entity, Channel):
                chat_name = entity.title
                download.chat_type = "channel" if entity.broadcast else "supergroup"
            else:
                chat_name = str(chat_id)
                download.chat_type = "unknown"

            download.chat_name = chat_name
            db.commit()

            # Download messages
            message_count = 0
            media_count = 0

            async for message in client.iter_messages(
                entity,
                offset_date=end_date,
                reverse=False
            ):
                # Stop if before start date
                if message.date < start_date:
                    break

                # Skip service messages
                if not message.text and not message.media:
                    continue

                # Get sender info
                sender_id = message.sender_id or 0
                sender_name = "Unknown"

                if message.sender:
                    if isinstance(message.sender, TelegramUser):
                        sender_name = message.sender.first_name or "Unknown"
                        if message.sender.last_name:
                            sender_name += f" {message.sender.last_name}"

                # Check for media
                has_media = message.media is not None
                media_type = None

                if has_media:
                    media_count += 1
                    media_type = type(message.media).__name__

                # Create message record
                telegram_message = TelegramMessage(
                    download_id=download.id,
                    message_id=message.id,
                    sender_id=sender_id,
                    sender_name=sender_name,
                    date=message.date,
                    text=message.text or "",
                    reply_to_message_id=message.reply_to_msg_id,
                    has_media=has_media,
                    media_type=media_type
                )
                db.add(telegram_message)
                message_count += 1

                # Commit in batches and update progress
                if message_count % 100 == 0:
                    # Update progress in download record
                    download.message_count = message_count
                    download.media_count = media_count
                    db.commit()
                    logger.info(f"Downloaded {message_count} messages from chat {chat_id}")

            # Final commit
            db.commit()

            # Update download record
            download.message_count = message_count
            download.media_count = media_count
            download.status = "completed"
            download.completed_at = datetime.utcnow()
            db.commit()

            logger.info(f"Completed download: {message_count} messages, {media_count} media from chat {chat_id}")

            return download.id

        except Exception as e:
            download.status = "failed"
            download.error_message = str(e)
            db.commit()
            logger.error(f"Error downloading chat {chat_id}: {e}")
            raise

        finally:
            await client.disconnect()

    @staticmethod
    async def disconnect_session(db: Session, user_id: int):
        """
        Disconnect and delete user's Telegram session.

        Args:
            db: Database session
            user_id: User ID to disconnect
        """
        telegram_session = db.query(TelegramSession).filter(
            TelegramSession.user_id == user_id
        ).first()

        if telegram_session:
            telegram_session.is_active = False
            db.commit()
            logger.info(f"Disconnected Telegram session for user {user_id}")

    @staticmethod
    async def preview_chat_messages(
        encrypted_session: str,
        chat_id: int,
        limit: int = 44,
        offset_id: Optional[int] = None
    ) -> Tuple[List[Dict], bool]:
        """
        Preview messages from a chat without storing them.

        Used for visual date range selection interface.

        Args:
            encrypted_session: Encrypted session string
            chat_id: Telegram chat/user ID to fetch messages from
            limit: Number of messages to fetch (default 44)
            offset_id: Message ID to start from (for pagination)

        Returns:
            Tuple of (messages list, has_more bool)
            - messages: List of dicts with id, date, sender_name, text_preview, is_outgoing
            - has_more: True if there are older messages available
        """
        client = await TelegramService.get_client_from_session(encrypted_session)

        try:
            logger.info(f"Fetching {limit} message previews from chat {chat_id}, offset_id={offset_id}")

            # Populate entity cache by calling get_dialogs() once
            # This caches all recent contacts' access_hashes
            try:
                logger.info("Populating entity cache with get_dialogs()")
                await client.get_dialogs(limit=1)  # Just need to call it once to populate cache
                logger.info("Entity cache populated successfully")
            except Exception as e:
                logger.warning(f"Could not populate entity cache: {e}")
                # Continue anyway - get_entity will try to fetch

            # Get the entity - should use cached data from get_dialogs()
            try:
                entity = await client.get_entity(chat_id)
                logger.info(f"Resolved entity for chat {chat_id}: {entity}")
            except Exception as e:
                logger.error(f"Failed to get entity for chat {chat_id}: {e}")
                raise ValueError(f"Could not find chat with ID {chat_id}")

            messages = []
            message_count = 0

            # Fetch messages in reverse chronological order (newest first)
            # Use limit+1 to check if there are more messages
            # Use the resolved entity instead of raw chat_id
            async for message in client.iter_messages(
                entity,
                limit=limit + 1,
                offset_id=offset_id
            ):
                message_count += 1

                # If we got one more than limit, there are more messages
                if message_count > limit:
                    has_more = True
                    break

                # Get sender name
                if message.out:
                    # Message sent by the user
                    sender_name = "You"
                elif message.sender:
                    # Try to get sender's name
                    if hasattr(message.sender, 'first_name'):
                        sender_name = message.sender.first_name or "Unknown"
                        if hasattr(message.sender, 'last_name') and message.sender.last_name:
                            sender_name += f" {message.sender.last_name}"
                    elif hasattr(message.sender, 'title'):
                        sender_name = message.sender.title or "Unknown"
                    else:
                        sender_name = "Unknown"
                else:
                    sender_name = "Unknown"

                # Get text preview (first 100 chars)
                text_preview = ""
                if message.text:
                    text_preview = message.text[:100]
                elif message.media:
                    # For media messages, show media type
                    if hasattr(message.media, '__class__'):
                        media_type = message.media.__class__.__name__.replace('MessageMedia', '')
                        text_preview = f"[{media_type}]"
                    else:
                        text_preview = "[Media]"
                else:
                    text_preview = "[No content]"

                messages.append({
                    "id": message.id,
                    "date": message.date.isoformat(),
                    "sender_name": sender_name,
                    "text_preview": text_preview,
                    "is_outgoing": message.out
                })

            else:
                # Loop completed without break - no more messages
                has_more = False

            logger.info(f"Fetched {len(messages)} message previews, has_more={has_more}")
            return messages, has_more

        except Exception as e:
            logger.error(f"Error fetching message preview from chat {chat_id}: {e}")
            raise
        finally:
            await client.disconnect()
