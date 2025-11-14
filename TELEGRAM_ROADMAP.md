# Telegram Integration Roadmap

## Current Status (2025-11-14)

✅ **Phase 1: Standalone Implementation - COMPLETE**
- Separate `/telegram` page for connecting and downloading chats
- Phone verification with SMS code
- 2FA password support
- Chat list with 100 most recent chats
- Pinned/favorite chats (⭐ badge)
- Folder organization (📁 Personal, Work)
- Archived chats (📦 badge)
- Username display (@username)
- Date range selector (defaults to last 30 days)
- Background download with status polling
- Message storage in database

**Database Tables:**
- `telegram_sessions` - Encrypted session storage
- `telegram_downloads` - Download tracking
- `telegram_messages` - Message history

**Access:** https://meedi8.com/telegram

---

## Phase 2: Chat Interface Integration (TODO)

### Goal
Integrate Telegram import directly into coaching/main room chat interface so users can seamlessly add chat context to their mediation session.

### User Flow
1. User is in CoachingChat or MainRoom
2. Clicks "+" button next to message input
3. Dropdown appears with options:
   - 📎 Upload File
   - 💬 Import Telegram Chat
4. Clicks "Import Telegram Chat" → Modal popup opens
5. **Modal contains the 3-step TelegramConnect flow:**
   - Step 1: Enter phone number
   - Step 2: Verify SMS code
   - Step 3: Select chat & date range
6. User selects chat and clicks "Import"
7. **Backend downloads and analyzes:**
   - Downloads messages in background
   - Formats as readable transcript
   - AI analyzes the chat
   - Creates a Turn with transcript as context
8. **AI responds with:**
   - "I've reviewed your Telegram conversation with [Name]"
   - "[X] messages over [timeframe]"
   - Initial contextual questions about the conflict

### Technical Implementation

#### Frontend Changes Needed

**1. Create TelegramImportModal Component**
```javascript
// frontend/src/components/TelegramImportModal.jsx
// - Wraps TelegramConnect in a modal overlay
// - Props: isOpen, onClose, onImportComplete, roomId, token
// - After import, calls onImportComplete(downloadId)
```

**2. Update MainRoom.jsx**
```javascript
// Add "+" button with dropdown
// Options: Upload File, Import Telegram Chat
// Show TelegramImportModal when selected
// After import, show loading state while AI analyzes
```

**3. Update CoachingChat.jsx**
```javascript
// Same pattern as MainRoom
// Add TelegramImportModal integration
```

#### Backend Changes Needed

**1. New Endpoint: Import Telegram to Room**
```python
# POST /rooms/{room_id}/import-telegram
# Body: { chat_id, start_date, end_date }
# Returns: { download_id, status }
```

**2. AI Analysis Function**
```python
# backend/app/services/telegram_analysis.py
async def analyze_telegram_transcript(
    download_id: int,
    room_id: int,
    db: Session
) -> str:
    """
    1. Fetch messages from telegram_messages
    2. Format as readable transcript
    3. Send to Claude API for analysis
    4. Return summary and initial questions
    """
```

**3. Update Mediator Prompts**
```python
# Add telegram transcript to conversation context
# System prompt: "User has provided a Telegram conversation..."
# Include formatted transcript in context
```

#### Database Changes Needed

**1. Link Downloads to Rooms**
```python
# Add column to telegram_downloads table:
# room_id (nullable, foreign key to rooms.id)
# When import is triggered from chat, set room_id
```

**2. Track Import Status in Turn**
```python
# Use existing attachment_url field
# Format: "telegram_import:{download_id}"
# AI can reference this in conversation
```

### UI/UX Considerations

1. **Modal Size:** Large modal (~80% viewport) to accommodate chat list
2. **Loading States:**
   - "Connecting to Telegram..."
   - "Loading chats..."
   - "Downloading messages..."
   - "Analyzing conversation..." (with AI icon)
3. **Error Handling:**
   - "Failed to connect - please try again"
   - "No messages found in date range"
4. **Success State:**
   - Brief confirmation: "✓ Imported [X] messages"
   - Modal closes automatically
   - AI starts conversation

### Example AI Response After Import

```
"Thanks for sharing that Telegram conversation with Sarah. I've reviewed
the 47 messages you exchanged between Nov 1-10.

I can see there's tension around household responsibilities and communication
patterns. Before we dive deeper, I want to understand:

When Sarah said 'you never help with dishes' on Nov 5th, what were you
feeling in that moment? And what do you think she was really needing
from you?"
```

---

## Phase 3: Advanced Features (Future)

### Search & Filter
- Search messages within imported chats
- Filter by sender
- Highlight key moments

### Multi-Chat Import
- Import multiple chats for context
- Compare communication patterns across relationships

### Real-Time Sync (Optional)
- Live monitoring during mediation
- Alert if new conflict messages appear
- Privacy-first: user must explicitly enable

### Analytics
- Communication pattern analysis
- Sentiment tracking over time
- Conflict escalation detection

---

## Privacy & Security Notes

- ✅ Encrypted session storage (Fernet)
- ✅ One-time downloads (not real-time monitoring)
- ✅ Separate session from main Telegram
- ✅ User can disconnect anytime
- ❓ Future: Add explicit consent flow before AI analysis
- ❓ Future: Allow user to redact specific messages

---

## Migration Plan (Phase 1 → Phase 2)

1. **Keep existing `/telegram` page functional**
   - Don't break current implementation
   - Users can still access standalone version

2. **Add modal integration gradually**
   - Start with MainRoom only
   - Test thoroughly before adding to CoachingChat
   - Feature flag to enable/disable

3. **Deprecate standalone page later**
   - Once modal version is stable
   - Redirect `/telegram` to help page
   - Or keep both for user preference

---

## Estimated Implementation Time

- **TelegramImportModal Component:** 2-3 hours
- **Backend import endpoint:** 2 hours
- **AI analysis integration:** 3-4 hours
- **Testing & refinement:** 2-3 hours
- **Total:** ~10-12 hours

---

## Questions to Resolve

1. Should we show a preview of the transcript to the user before AI analyzes it?
2. How much of the transcript should we include in AI context? (all messages vs summary)
3. Should users be able to edit/redact messages before import?
4. Do we need message-level privacy controls (e.g., "don't include messages with photos")?
5. Should we support importing multiple chats in one session?
