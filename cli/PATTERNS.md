# Critical Coding Patterns

Essential patterns and conventions that MUST be followed to avoid bugs.

## SSR Safety (Critical for Vercel)

**Problem:** Vercel builds crash when accessing browser APIs during server-side rendering.

**Solution:** Always guard browser APIs with checks:

```javascript
// ❌ WRONG - Crashes on Vercel build
const isMobile = window.innerWidth < 768;
const path = window.location.pathname;
const token = localStorage.getItem('token');

// ✅ CORRECT - SSR-safe
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// For location, use React Router instead
import { useLocation } from 'react-router-dom';
const location = useLocation();
const path = location.pathname;

// For localStorage, check first
const token = typeof window !== 'undefined'
  ? localStorage.getItem('token')
  : null;
```

**Files Requiring SSR Safety:**
- Any component accessing `window`, `document`, `localStorage`, `sessionStorage`
- OAuth components (conditionally render)
- Components using browser-only APIs during initialization

**Common Culprits:**
- `window.innerWidth` / `window.innerHeight`
- `window.location` (use `useLocation()` hook instead)
- `document.getElementById()`
- `localStorage` / `sessionStorage`
- PageHeader component (was crashing ALL pages)

## Trailing Slash Pattern (Safari/Firefox)

**Problem:** Safari 16.3+ and Firefox 112+ strip Authorization headers on cross-origin redirects per 2024 Fetch Standard. Chrome hasn't adopted this yet.

**How It Breaks:**
1. Frontend calls: `/rooms` (no trailing slash)
2. Backend route: `@router.get("/")` → registered as `/rooms/` (with slash)
3. FastAPI sends 308 Permanent Redirect: `/rooms` → `/rooms/`
4. Safari/Firefox strip the Authorization header on the redirect
5. Second request arrives without auth → 401 Unauthorized
6. Chrome: Doesn't strip header (not yet spec-compliant) → works fine

**Solution:** Frontend API calls MUST match backend route definitions EXACTLY:

```javascript
// ❌ WRONG - Missing trailing slash when backend has one
await apiRequest('/rooms', 'GET', null, token);

// ✅ CORRECT - Matches backend @router.get("/")
await apiRequest('/rooms/', 'GET', null, token);
```

**How to Check:**
```python
# Backend route definition
router = APIRouter(prefix="/rooms")

@router.get("/")  # Creates route: /rooms/ (WITH slash)
async def list_rooms():
    pass

@router.get("/{id}")  # Creates route: /rooms/{id} (NO trailing slash)
async def get_room(id: int):
    pass
```

**Common Patterns:**
- List endpoint: `/rooms/` (with slash)
- Detail endpoint: `/rooms/{id}` (no slash)
- Nested endpoint: `/rooms/{id}/coach/turns` (no trailing slash)

**Debugging:**
- Check Network tab for 308 redirects
- Safari/Firefox show two requests: 308 then 401
- Chrome shows single 200 (masks the redirect)

## User1/User2 Identification (Critical)

**Problem:** Participants array is ordered by database ID, not by who initiated the room.

**Solution:** Always determine User1 by finding the **earliest** `pre_mediation` turn:

```python
# ❌ WRONG - Uses participant array order (by database ID)
user1 = participants[0]
user2 = participants[1]

# ✅ CORRECT - Finds who started coaching first chronologically
first_turn = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.context == "pre_mediation"
).order_by(Turn.created_at.asc()).first()

user1_id = first_turn.user_id
user1 = next((p for p in participants if p.id == user1_id), participants[0])
user2 = next((p for p in participants if p.id != user1_id), participants[1])
```

**Where This Matters:**
- `/main-room/summaries` - Must return correct user1_summary and user2_summary
- `/main-room/start` - Must address User1 by name in opening message
- `/main-room/messages` - Must correctly determine next_speaker_id
- `/coach/finalize` - Must save summary to correct field

**Critical Insight:** User1 = room initiator (has invite link), User2 = invitee (joins via invite).

## Context Separation (Critical)

**Problem:** Coaching history leaking into main room, or vice versa.

**Solution:** Always filter turns by `context`:

```python
# ❌ WRONG - Gets all turns (coaching + main room)
all_turns = db.query(Turn).filter(Turn.room_id == room_id).all()

# ✅ CORRECT - Separate coaching from main room
coaching_turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.user_id == user1.id,
    Turn.context == "pre_mediation"  # CRITICAL
).all()

main_turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.context == "main"  # CRITICAL
).all()
```

**Context Values:**
- `"pre_mediation"` - Coaching messages (private to each user)
- `"main"` - Main room messages (visible to both users)

**Why This Matters:**
- Prevents sensitive coaching details from leaking
- Main room only sees polished summaries, not raw dialogue
- Each user's coaching is private until they're ready

## Phase Transitions

**Pattern:** Always check and update `Room.phase` through service layer functions:

```python
# ❌ WRONG - Manually changing phase
room.phase = "main_room"
db.commit()

# ✅ CORRECT - Use service functions
from app.services.room_service import start_main_room
start_main_room(db, room_id, user_id)
```

**Service Functions:**
- `start_coaching_session()` - user1_intake → user1_coaching
- `finalize_coaching()` - user1_coaching → user2_lobby or user2_coaching → main_room
- `start_main_room()` - Validates both summaries exist before starting

**Frontend Pattern:**
Components render based on phase:
```javascript
if (room.phase === 'user1_coaching') {
  return <CoachingChat />
} else if (room.phase === 'main_room') {
  return <MainRoom />
}
```

## SessionStorage Persistence

**Pattern:** For cross-page state that needs to survive redirects:

```javascript
// Step 1: Save state before redirect (Lobby.jsx)
if (!token) {
  sessionStorage.setItem('pendingInvite', inviteToken);
  navigate('/login');
}

// Step 2: Check after auth and redirect back (LoginNew.jsx, Signup.jsx)
const pendingInvite = sessionStorage.getItem('pendingInvite');
if (pendingInvite) {
  sessionStorage.removeItem('pendingInvite'); // Clean up
  navigate(`/join/${pendingInvite}`);
} else {
  navigate('/rooms'); // Default destination
}
```

**Why sessionStorage not localStorage:**
- Session-specific data that shouldn't persist across browser sessions
- Automatically cleared when tab closes

## API Request Pattern

**Pattern:** Use `apiRequest` helper, not fetch/axios directly:

```javascript
// ❌ WRONG - Using fetch directly
const response = await fetch('/rooms/', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ CORRECT - Use apiRequest wrapper
import { apiRequest } from '../api/client';
const data = await apiRequest('/rooms/', 'GET', null, token);
```

**Why:**
- Automatically includes JWT token from AuthContext
- Sets `credentials: 'include'` for CORS
- Consistent error handling
- Handles 401 (redirects to login)

## PostgreSQL JSON Queries

**Problem:** PostgreSQL doesn't support `contains()` on JSON columns.

**Solution:** Use `cast()` and `like()`:

```python
# ❌ WRONG - Fails with "operator does not exist: json ~~ text"
Turn.tags.contains("feeling")

# ✅ CORRECT - Cast to String first
from sqlalchemy import cast, String
cast(Turn.tags, String).like('%feeling%')
```

**Where This Applies:**
- Any JSON column queries (Turn.tags, Room metadata, etc.)
- Required for PostgreSQL compatibility
- SQLite is more forgiving (but don't rely on it)

## OAuth Conditional Rendering

**Pattern:** Only render OAuth components if valid credentials exist:

```javascript
// main.jsx - Only wrap app if valid credentials
const hasValidGoogleOAuth = GOOGLE_CLIENT_ID &&
                             GOOGLE_CLIENT_ID.length > 20 &&
                             !GOOGLE_CLIENT_ID.includes('YOUR_')

{hasValidGoogleOAuth && (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)}

// LoginNew.jsx - Conditionally render OAuth components
const hasGoogleOAuth = typeof window !== 'undefined' &&
                       GOOGLE_CLIENT_ID &&
                       GOOGLE_CLIENT_ID.length > 20 &&
                       !GOOGLE_CLIENT_ID.includes('YOUR_')

{hasGoogleOAuth && <GoogleLogin onSuccess={handleGoogleSuccess} />}
```

**Why:**
- Prevents crashes when OAuth credentials not configured
- Safe for development without all OAuth providers
- SSR-safe (checks window exists)

## Database Migrations

**Pattern:** Always review auto-generated migrations:

```bash
# Step 1: Create migration
alembic revision --autogenerate -m "add new field"

# Step 2: Review generated file
cat backend/migrations/versions/YYYYMMDD_add_new_field.py

# Step 3: Apply migration
alembic upgrade head
```

**Common Issues:**
- **Multiple heads:** Update `down_revision` to point to correct parent
- **Duplicate columns:** Use `alembic stamp head` if columns already exist
- **Missing foreign keys:** Add manually if autogenerate missed them

**Best Practice:** Test migrations locally with SQLite before deploying to PostgreSQL.

## Subscription Enforcement

**Pattern:** Check limits before expensive operations:

```python
# Room creation
from app.services.subscription_service import check_room_creation_limit
check_room_creation_limit(db, user_id)
# Raises HTTPException(402) if limit exceeded

# Voice messages
if subscription.voice_conversations_used >= subscription.voice_conversations_limit:
    raise HTTPException(
        status_code=402,
        detail={
            "error": "voice_limit_reached",
            "message": "Upgrade to send more voice messages",
            "tier": subscription.tier,
            "limit": subscription.voice_conversations_limit,
            "current_count": subscription.voice_conversations_used,
            "upgrade_url": "/subscription"
        }
    )
```

**Response Format:** Always return detailed 402 with upgrade info.

## Inline Styling

**Pattern:** Use JavaScript style objects, not CSS files:

```javascript
const styles = {
  container: {
    background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
    fontFamily: "'Nunito', sans-serif",
    padding: '20px',
  },
  button: {
    backgroundColor: '#7DD3C0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
  }
}

return <div style={styles.container}>Content</div>
```

**Why:**
- Dynamic theming (user-based colors)
- Styles colocated with components
- No CSS class name conflicts
- Easy to pass props into styles

## Color Coding

**Pattern:** Consistent colors across all components:

```javascript
// User 1 (room initiator)
const user1Colors = {
  primary: '#7DD3C0',      // Teal
  light: '#E8F9F5',
  gradient: 'linear-gradient(135deg, #7DD3C0 0%, #5FBCA8 100%)'
}

// User 2 (invitee)
const user2Colors = {
  primary: '#CCB2FF',      // Purple
  light: '#F5EFFF',
  gradient: 'linear-gradient(135deg, #CCB2FF 0%, #B89EFF 100%)'
}

// Brand
const brandColors = {
  primary: '#7DD3C0',      // Teal (same as User 1)
  secondary: '#D3C1FF',    // Light purple
}

// Telegram
const telegramColors = {
  primary: '#0088CC',      // Telegram blue
  hover: '#0077B3',
  active: '#E3F2FD',
  secondary: '#8A8A8F'
}
```

## Polling Architecture

**Pattern:** Frontend polls for updates instead of WebSockets:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await apiRequest(`/rooms/${roomId}/main-room/messages`, 'GET');
    setMessages(data.messages);
    setCurrentSpeaker(data.current_speaker_id);
    setBreakInfo(data.break_info);
  }, 3000); // 3 second interval

  return () => clearInterval(interval); // Cleanup
}, [roomId]);
```

**Polling Locations:**
- MainRoom: Messages every 3s
- WaitingRoom: Phase changes every 3s
- SessionsDashboard: Room status every 5s

**Trade-offs:**
- ✅ Simpler deployment (no WebSocket server)
- ✅ Works behind firewalls
- ❌ ~3 second lag for updates (acceptable for mediation)

## Voice Message Flow

**Pattern:** Complete integration with Whisper, S3, and AI:

```python
# 1. Receive audio file (multipart/form-data)
audio_file = await audio.read()

# 2. Check subscription limit
if subscription.voice_conversations_used >= subscription.voice_conversations_limit:
    raise HTTPException(402, "Voice limit reached")

# 3. Transcribe with Whisper
from app.services.whisper_service import transcribe_audio
transcribed_text = transcribe_audio(audio_file)

# 4. Upload to S3
from app.services.s3_service import upload_file
audio_url = upload_file(audio_file, f"voice-recordings/{room_id}/{turn_id}.webm")

# 5. Save Turn with transcription
turn = Turn(
    summary=transcribed_text,  # Show as text
    audio_url=audio_url,       # Link to audio
    cost_usd=whisper_cost
)

# 6. Process with AI (same as text message)
ai_response = coach.get_response(transcribed_text)
```

## Cost Tracking

**Pattern:** Dual tracking system for UX and analytics:

```python
# Turn-level (for user visibility)
turn.input_tokens = usage.input_tokens
turn.output_tokens = usage.output_tokens
turn.cost_usd = (input_tokens * INPUT_COST) + (output_tokens * OUTPUT_COST)
turn.model = "claude-sonnet-4-5"

# ApiCost table (for analytics)
api_cost = ApiCost(
    service_type="anthropic",
    endpoint="messages",
    input_tokens=usage.input_tokens,
    output_tokens=usage.output_tokens,
    cost_usd=turn.cost_usd
)
db.add(api_cost)
```

**Why Both:**
- Turn data = show user conversation cost
- ApiCost data = admin analytics, profitability

## Summary Display Logic

**Pattern:** Different rendering based on context and role:

```javascript
// User 2 in CoachingChat - sees User 1's summary as intro
{messages[0]?.role === 'intro' && (
  <div style={styles.introMessage}>
    <h3>Context from {otherUser.name}</h3>
    <p>{messages[0].summary}</p>
  </div>
)}

// Both users in MainRoom - first message shows opposite summary
{messages[0]?.role === 'summary' && (
  <div style={styles.summaryMessage}>
    <h3>{otherUser.name}'s Perspective</h3>
    <p>{messages[0].summary}</p>
  </div>
)}
```

**Color Coding:**
- Summaries have gradient backgrounds
- Special formatting with icons
- Editable in coaching (popup before main room)

## Harsh Language Intervention

**Pattern:** Strict turn-by-turn with direct confrontation:

```python
# AI detects harsh language in system prompt
# Immediately pauses and names behavior
"{Name}, I need to pause here. Calling someone 'lazy' shifts us away from solving this together."

# Reframes with context
"What you're both describing sounds like a cycle where good intentions get lost."

# Switches to other person
"{OtherName}, when you hear yourself being called lazy, how does that land?"

# Always switches after intervention (no consecutive questions)
next_speaker = "OTHER"  # Simple, not complex logic
```

**Critical Requirement:** Users MUST have distinct names (e.g., "Dave"/"Sarah", not "Adam"/"Adam").

## Break/Pause Feature

**Pattern:** Database-backed real-time sync via polling:

```python
# Request break
room.break_requested_by_id = current_user.id
room.break_requested_at = datetime.utcnow()
db.commit()

# Check in polling endpoint
break_info = None
if room.break_requested_by_id:
    requester = db.query(User).get(room.break_requested_by_id)
    break_info = {
        "requested_by_name": requester.name,
        "requested_at": room.break_requested_at
    }

# Frontend shows modal when break_info exists
{breakInfo && (
  <BreakModal
    requesterName={breakInfo.requested_by_name}
    onContinue={clearBreak}
  />
)}
```

## File Attachment Flow

**Pattern:** Upload, analyze (if image), store metadata:

```python
# 1. Receive file
file = await request.form()["file"]

# 2. Upload to S3
from app.services.s3_service import upload_file
attachment_url = upload_file(file, f"attachments/{room_id}/{turn_id}-{filename}")

# 3. Analyze if image
attachment_analysis = None
if file.content_type.startswith('image/'):
    from app.services.image_analysis import analyze_image
    attachment_analysis = analyze_image(file)

# 4. Save Turn
turn = Turn(
    attachment_url=attachment_url,
    attachment_filename=filename,
    attachment_type=file.content_type,
    attachment_analysis=attachment_analysis
)
```
