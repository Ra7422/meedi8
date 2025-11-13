# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Meedi8** is an AI-powered mediation platform that guides users through conflict resolution using Nonviolent Communication (NVC) principles. The system consists of a React frontend and FastAPI backend that orchestrates a multi-phase mediation flow.

## Recent Updates (Last Updated: 2025-11-13)

**✅ LATEST STABLE STATE** - Commit `ff3df8d` (2025-11-13) includes Phase 1 paywall implementation with room creation limits, email notification system (disabled by default), PAYWALL.md strategy doc, and SENDGRID_SETUP.md guide.

**Previous Stable**: Commit `f9825c3` (2025-11-13) - Email notifications and paywall strategy documentation.

**Previous Stable**: Commit `c5cfd7b` (2025-11-12) - Professional PDF report generation, homepage image fixes, and strict turn-by-turn mediation with harsh language intervention.

**Critical Changes** - Read these first when working on the codebase:

0. **Subscription Paywall System - Phase 1 (2025-11-13) - DEPLOYED** - Comprehensive tiered subscription system with usage limits and automatic monthly resets. **Commits**: `bfe9adc` (database migration), `f544ca6` (service functions), `ff3df8d` (room creation enforcement). **Files**: Migration `20251113_add_usage_counters.py`, Service `backend/app/services/subscription_service.py` (lines 162-386), Routes `backend/app/routes/rooms.py` (lines 21, 72, 95). **Features**: Room creation limits (FREE: 1/month, PLUS/PRO: unlimited), file upload size limits (FREE: disabled, PLUS: 10MB, PRO: 50MB), professional report limits (PRO only: 3/month), automatic monthly counter resets, 402 Payment Required responses with upgrade prompts. **Error Format**: Returns detailed JSON with `error`, `message`, `tier`, `limit`, `current_count`, `upgrade_url`. **Next Steps**: File upload validation, frontend 402 handling, professional report limits. See PAYWALL.md for complete implementation guide.

1. **Email Notification System (2025-11-13) - DEPLOYED** - Full SendGrid integration for turn-taking notifications. Files modified: `backend/app/services/email_service.py` (NEW), `backend/app/routes/rooms.py` (lines 23, 1299-1311, 1499-1511), `backend/requirements.txt` (added sendgrid>=6.10.0), `SENDGRID_SETUP.md` (NEW - comprehensive setup guide), `backend/test_email.py` (NEW - testing script). Features: HTML emails with brand styling, turn notifications, break notifications, graceful error handling. Disabled by default via `EMAIL_NOTIFICATIONS_ENABLED=false` env var. **STATUS**: Waiting on domain DNS configuration to verify sender domain. See `SENDGRID_SETUP.md` for full setup instructions.

1. **Professional PDF Report Generation (2025-11-12)** - Resolution page now includes "Generate Report" button that creates therapist-style PDF reports using Claude API. Reports include: Presenting Issues, Conversation Summary, Observations, Assessment, and Recommendations. Generated on-demand (button press) to save tokens, stored in S3 bucket. Button transitions: "Generate Report" → "Generating..." → "Download Report (PDF)". Backend: `POST /rooms/{id}/generate-report`, Service: `backend/app/services/report_generator.py` (uses ReportLab + Claude Sonnet 4.5), Frontend: ResolutionComplete.jsx lines 14-15, 55-68, 180-248. Migration: `20251112_add_professional_report_url.py`. Cost: ~$0.03-0.05 per report.

1. **PostgreSQL JSON Query Fix (CRITICAL)** - `Turn.tags` column must use `cast(Turn.tags, String).like('%pattern%')` instead of `.contains()` for PostgreSQL compatibility. The `.contains()` method generates `LIKE` operator on JSON which fails with "operator does not exist: json ~~ text". See commit `246b6c4` for implementation. This fix is required for any JSON column queries.

2. **File Attachment Feature (2025-11-11)** - Main room now supports file uploads (images, PDFs, documents) visible to both users. Files stored in S3 with automatic AI image analysis using Claude Vision API. Images display as thumbnails with 1pt colored border (teal/purple). Backend: `POST /rooms/{id}/main-room/upload-file`, Frontend: MainRoom.jsx lines 906-929 (upload button) and 846-898 (display). Migration: `20251111_add_attachment_fields_to_turns.py`

3. **AI Image Analysis** - Uploaded images automatically analyzed by Claude 3.5 Sonnet Vision API. AI provides 2-3 sentence contextual description shown above thumbnail. Service: `backend/app/services/image_analysis.py`. Cost tracking integrated (~$0.01-0.03 per image). Fallback to placeholder text if analysis fails.

4. **Screening Bypass Fix** - Added `has_completed_screening` field to `/auth/me` endpoint response (UserOut schema). Without this, users stuck in screening loop after completion. Backend: `app/routes/auth.py` lines 53, 284. This field MUST be included in auth responses.

5. **Trailing Slash CORS Fix (Safari/Firefox)** - Safari 16.3+ and Firefox 112+ strip Authorization headers on cross-origin redirects per 2024 Fetch Standard. ALL frontend API calls must match backend route definitions EXACTLY (including trailing slashes) to avoid 308 redirects that strip auth headers. Chrome hasn't adopted this standard yet. See "Trailing Slash Pattern" section below.

6. **User1/User2 Identification Fix** - Fixed bug where User1/User2 were determined by participant database ID order instead of chronological coaching start time. Now correctly identifies User1 as whoever has the earliest `pre_mediation` turn. Applied to `/main-room/summaries`, `/main-room/start`, and `/main-room/messages` endpoints.

7. **SSR Safety Required** - All components must guard browser APIs (`window`, `document`, `localStorage`) with `typeof window !== 'undefined'` checks. Vercel build WILL crash without this. See "SSR Safety" section below.

8. **Strict Turn-by-Turn with Harsh Language Intervention (2025-11-12)** - Main room mediator enforces strict turn-taking where AI ALWAYS switches speakers after each response. When harsh language detected ("lazy", "selfish", "never", "always"), AI directly pauses and names the behavior: "{Name}, I need to pause here. Calling someone 'lazy' shifts us away from solving this together." Then reframes and switches to other person to hear impact: "When you hear yourself being called lazy, how does that land?" Later circles back with context. This replaces the previous "deep exploration mode" with simpler, more effective intervention. Updated: `main_room_mediator.py` lines 44-62 (prompt), 180-224 (logic). **CRITICAL**: Users MUST have distinct names for AI to properly address them - duplicate names (e.g., "Adam"/"Adam") will confuse the AI's turn-taking.

9. **Break/Pause Feature** - Users can request breathing breaks that sync in real-time to both participants via polling. Uses `Room.break_requested_by_id` and `break_requested_at` fields.

10. **Invite Link Redirect** - Unauthenticated users clicking invite links are redirected back after login/signup via `sessionStorage.pendingInvite` pattern.

11. **OAuth Conditional Rendering** - OAuth components only render if valid credentials exist to prevent crashes. Check main.jsx and LoginNew.jsx for pattern.

## Development Commands

### Backend (FastAPI)
```bash
# Run backend server (from backend/)
./run.sh                                    # Auto-creates venv, installs deps, runs uvicorn

# Or manually
source .venv/bin/activate                   # Activate virtual environment
python -m uvicorn app.main:app --reload    # Run with hot reload

# Database migrations (Alembic)
cd backend
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                              # Apply migrations
alembic downgrade -1                              # Rollback one migration
alembic current                                   # Show current revision
alembic stamp <revision>                          # Set revision without running migration
```

### Frontend (React + Vite)
```bash
# Run frontend dev server (from frontend/)
npm run dev                     # Start Vite dev server on :5173

# Build and production
npm run build                   # Production build
npm run preview                 # Preview production build
npm run lint                    # ESLint

# Figma export utilities
npm run export-figma            # Export Figma designs
npm run export-figma:browser    # Browser-based export
npm run export-figma:debug      # Debug mode with visible browser
npm run test:visual             # Visual comparison tests
```

### Local Development with Docker (Optional)
```bash
# Run full stack with PostgreSQL (from project root)
docker-compose up -d            # Start PostgreSQL + Redis + Backend
docker-compose down             # Stop all services
docker-compose logs -f backend  # View backend logs

# Run migrations inside Docker
docker exec -it cleanair_backend alembic revision --autogenerate -m "add feature"
docker exec -it cleanair_backend alembic upgrade head

# Access PostgreSQL
docker exec -it cleanair_postgres psql -U postgres -d meedi
```

**Note**: Most developers use SQLite for local dev (simpler, no Docker needed). Docker setup mainly for testing PostgreSQL-specific features.

## Architecture Overview

### Mediation Flow Phases

The system implements a **sequential multi-phase flow** tracked by `Room.phase`:

1. **user1_intake** → User 1 describes the situation
2. **user1_coaching** → AI coach guides User 1 through NVC framework
3. **user2_lobby** → User 1 gets invite link, User 2 receives it
4. **user2_coaching** → AI coach guides User 2 (shown User 1's summary as context)
5. **main_room** → Both users in joint mediation with AI mediator
6. **resolved** → Mediation complete with agreement

Each phase transition is critical - backend routes check current phase before allowing actions.

### Data Model Core Concepts

**Room**: Container for entire mediation session
- `phase`: Current stage in mediation flow
- `invite_token`: Unique token for User 2 to join
- `user1_summary` / `user2_summary`: NVC-formatted summaries after coaching
- `participants`: Many-to-many relationship with User
- `break_requested_by_id`: User who requested break (nullable)
- `break_requested_at`: Timestamp of break request (nullable)
- `last_speaker_id`: Track who spoke last for deep exploration mode (nullable)
- `consecutive_questions_to_same`: Count of consecutive questions to same person (default 0)

**Turn**: Individual messages/exchanges within a room
- `context`: Either "pre_mediation" (coaching) or "main" (joint mediation)
- `kind`: Message type (intake, ai_question, user_response, etc.)
- `tags`: Auto-extracted tags (fact, feeling, request, opinion)
- `audio_url`: S3 URL if message was voice input
- Cost tracking fields: `input_tokens`, `output_tokens`, `cost_usd`, `model`

**User**: Authentication and subscription
- `profile_picture_url`: OAuth profile picture from Google/Facebook/Telegram
- Relationship to Subscription for tiered access (FREE/PLUS/PRO)

### AI Service Architecture

**Two Distinct AI Agents with Different Prompts:**

1. **Pre-Mediation Coach** (`app/services/pre_mediation_coach.py`)
   - Uses `PRE_MEDIATION_COACH_PROMPT`
   - Guides individual users through NVC: Observations → Feelings → Needs → Empathy
   - Produces `READY: [summary]` when user has complete NVC perspective
   - Summary written in first person for direct communication with other user
   - User 2 sees User 1's summary as context before their coaching begins

2. **Main Room Mediator** (`app/services/main_room_mediator.py`)
   - Uses `MAIN_ROOM_MEDIATOR_PROMPT`
   - Facilitates joint conversation between both users
   - Manages turn-taking (enforced by `current_speaker_id`)
   - Phases: Shared Understanding → Common Ground → Solutions → Concrete Agreements
   - Detects "Four Horsemen" (Gottman method) to prevent escalation
   - Produces `AGREEMENT: [text]` when resolution reached
   - **Deep Exploration Mode**: When harsh language detected ("lazy", "selfish", "never", "always"), AI stays with same speaker for up to 2 additional questions before switching to other person

**Key Pattern**: Both services maintain conversation history in memory during session, stored in `Turn` records with `context` field to separate coaching from mediation.

### Harsh Language Intervention (Strict Turn-by-Turn)

**Purpose**: When users express harsh language ("lazy", "selfish", "never", "always"), the AI should directly confront the behavior, explain its impact, and facilitate understanding between participants. This uses strict turn-by-turn switching (no consecutive questions to same person).

**How It Works**:
1. **Detection**: AI detects harsh language patterns in system prompt
2. **Direct Intervention**: AI immediately pauses and names the behavior:
   - Example: "{Name}, I need to pause here. Calling someone 'lazy' shifts us away from solving this together."
3. **Reframe**: AI reframes the situation with context:
   - Example: "What you're both describing sounds like a cycle where good intentions get lost."
4. **Switch to Other Person**: AI immediately switches to the other participant to hear their reaction:
   - Example: "{OtherName}, when you hear yourself being called lazy, how does that land?"
5. **Circle Back Later**: After hearing the other person's impact, AI circles back to original speaker:
   - Example: "You heard them say it hurts. What do they need from you?"

**Example Flow** (from production transcript):
```
User 1: "They are just lazy, it's an excuse"
AI: "Adam, I need to pause here. Calling someone 'lazy' shifts us away from solving this together.
     What you're both describing sounds like a cycle where good intentions get lost.
     User2, when you hear yourself being called lazy, how does that land?"
User 2: "It hurts because I'm trying my best..."
AI: "Adam, you heard them say it hurts. What do they need from you?"
```

**Why Strict Turn-by-Turn**: Previous "deep exploration mode" (multiple consecutive questions) was complex and created input locking issues. The new approach is simpler, more effective, and works within existing turn-taking infrastructure.

**Implementation Files**:
- `backend/app/services/main_room_mediator.py:44-62` - System prompt with intervention pattern
- `backend/app/services/main_room_mediator.py:180-224` - Simplified turn-switching logic (always "OTHER")
- Commit `ee70883` (2025-11-12) - Implementation

**CRITICAL Requirement**: Users MUST have distinct names (e.g., "Dave"/"Ads", not "Adam"/"Adam"). Duplicate names confuse the AI's ability to address the correct person during turn-taking.

### Break/Pause Feature

**Purpose**: Allow either user to request a breathing break during main room mediation, visible to both participants in real-time.

**How It Works**:
1. **Request Break**: User clicks "Need a break" button in MainRoom
2. **Database Update**: Sets `room.break_requested_by_id` and `room.break_requested_at`
3. **Real-time Sync**: Frontend polls `/rooms/{id}/main-room/messages` every 3 seconds
4. **Modal Display**: Both users see breathing exercise modal with correct requester's name
5. **Clear Break**: Either user can click "Ready to Continue" to clear break state

**API Endpoints** (`app/routes/rooms.py:1191-1234`):
- `POST /rooms/{id}/request-break` - Sets break_requested_by_id to current user
- `POST /rooms/{id}/clear-break` - Clears both break fields
- `GET /rooms/{id}/main-room/messages` - Returns `break_info` with requester name

**Frontend Integration** (`frontend/src/pages/MainRoom.jsx:92-113, 544-729`):
- Polling effect checks for break_info in response
- Shows modal with SimpleBreathing component when break_info exists
- Displays correct person's name: `{breakInfo?.requested_by_name} needs a moment`

**Implementation Files**:
- `backend/app/models/room.py:37-39, 48` - Database fields and relationship
- `backend/app/routes/rooms.py:1172-1188, 1191-1234` - API endpoints
- `frontend/src/pages/MainRoom.jsx:92-113, 544-729` - UI and polling
- `backend/migrations/versions/20251107_add_break_tracking.py` - Migration

### Invite Link Redirect Flow

**Purpose**: When User 2 clicks an invite link but isn't logged in, they should be redirected back to the invite after logging in or signing up.

**How It Works**:
1. **Lobby Detection** (`Lobby.jsx:44-48`): If user not authenticated, saves invite token to `sessionStorage.setItem('pendingInvite', inviteToken)`
2. **Login/Signup Handlers**: After successful authentication, checks for `sessionStorage.getItem('pendingInvite')`
3. **Redirect**: If pendingInvite exists, navigates to `/join/{token}` instead of default destination
4. **Cleanup**: Removes pendingInvite from sessionStorage after redirect

**Implementation Files**:
- `frontend/src/pages/Lobby.jsx:44-48` - Saves invite token
- `frontend/src/pages/LoginNew.jsx:85-93, 120-128, 142-150, 167-175` - Checks and redirects (all auth methods)
- `frontend/src/pages/Signup.jsx:98-106` - Checks and redirects after signup

### Frontend Page Flow

**Critical Frontend Pages:**
- `LoginNew.jsx`: OAuth login with Google/Facebook/Telegram/X (color-coded UI: teal brand)
- `RoomsList.jsx`: User's mediation rooms dashboard
- `CoachingChat.jsx`: Individual pre-mediation coaching
  - User 2 sees popup with their summary (editable) before entering main room
  - Color-coded bubbles: purple (#F5EFFF, #CCB2FF) for User 2
- `MainRoom.jsx`: Joint mediation session
  - Opens with opposite user's summary as first message
  - Color-coded: teal for User 1, purple for User 2
  - Enforces turn-taking based on `current_speaker_id`

**UI Pattern**: Profile pictures displayed from `user.profile_picture_url` (OAuth) with fallback to 👤 emoji.

### OAuth Implementation

**Multi-Platform OAuth** with profile picture extraction:
- Google: Uses `@react-oauth/google`, verifies token via Google API
- Facebook: Uses `@greatsumini/react-facebook-login`, fetches Graph API for profile
- Telegram: Uses `react-telegram-login` widget, HMAC signature verification
- X/Twitter: Placeholder implementation (needs developer account)

**Backend Pattern** (`app/routes/auth.py`):
- Each OAuth provider has dedicated endpoint: `/auth/google`, `/auth/facebook`, `/auth/telegram`
- Verifies token with provider's API using `httpx`
- Creates or updates User with `profile_picture_url`
- Returns JWT `access_token` for frontend

**Synthetic Emails**: Platforms without email use generated addresses:
- Twitter: `{username}@twitter.meedi8.com`
- Telegram: `telegram_{id}@telegram.meedi8.com`

**SSR Safety**: OAuth providers are conditionally rendered to prevent SSR crashes:
```javascript
// main.jsx - Only wrap app if valid OAuth credentials exist
const hasValidGoogleOAuth = GOOGLE_CLIENT_ID &&
                             GOOGLE_CLIENT_ID.length > 20 &&
                             !GOOGLE_CLIENT_ID.includes('YOUR_')

// LoginNew.jsx - Conditionally render OAuth components
const hasGoogleOAuth = typeof window !== 'undefined' && GOOGLE_CLIENT_ID &&
                       GOOGLE_CLIENT_ID.length > 20 && !GOOGLE_CLIENT_ID.includes('YOUR_')
{hasGoogleOAuth && <GoogleLogin onSuccess={handleGoogleSuccess} />}
```

### Subscription & Rate Limiting

**Three Tiers** (Stripe integration):
- FREE: 1 room/month, text only
- PLUS: 5 rooms/month, 30 voice messages
- PRO: Unlimited rooms, 300 voice messages, priority support

**Enforcement**: `app/middleware/rate_limit.py` checks limits before room creation and voice message processing.

**Voice Transcription**:
- Whisper API via `app/services/whisper_service.py`
- Audio stored in S3 via `app/services/s3_service.py`
- Cost tracked per Turn

### Environment Configuration

**Backend** (`backend/.env`):
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # For Whisper
STRIPE_SECRET_KEY=
TELEGRAM_BOT_TOKEN=      # OAuth only
DATABASE_URL=            # PostgreSQL in prod, SQLite in dev
```

**Frontend** (`frontend/.env.local`):
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=
VITE_FACEBOOK_APP_ID=
VITE_TELEGRAM_BOT_NAME=
```

**Deployment**:
- Frontend: Vercel (set env vars there)
- Backend: Railway (set env vars there)
- Production URL: `https://clean-air-med.vercel.app` (will migrate to custom domain)

## Important Patterns & Conventions

### SSR Safety (Critical for Vercel Deployment)
**ALWAYS guard browser APIs with SSR checks** to prevent crashes during build:

```javascript
// ❌ WRONG - Crashes on Vercel build
const isMobile = window.innerWidth < 768;

// ✅ CORRECT - SSR-safe
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// ❌ WRONG - Crashes with window.location
const path = window.location.pathname;

// ✅ CORRECT - Use React Router's useLocation hook
import { useLocation } from 'react-router-dom';
const location = useLocation();
const path = location.pathname;
```

**Files that require SSR safety checks:**
- Any component accessing `window`, `document`, `localStorage`, `sessionStorage`
- OAuth components (must be conditionally rendered)
- Any code using browser-only APIs during initialization

### Phase Transitions
Always check and update `Room.phase` when moving between stages. Use the service layer functions (`start_coaching_session`, `finalize_coaching`, `start_main_room`) rather than manually changing phase.

### Turn Context
When querying turns, always filter by `context`:
- `context='pre_mediation'` for coaching messages
- `context='main'` for mediation messages

This prevents coaching history from leaking into main room or vice versa.

### Summary Display Logic
- **User 2 in CoachingChat**: Shows User 1's summary as intro message with `role='intro'`
- **Both users in MainRoom**: First message has `role='summary'` showing the **opposite** user's perspective
- Summaries are color-coded with gradient backgrounds and special formatting

### Color Coding
- **User 1**: Teal (#7DD3C0, #E8F9F5)
- **User 2**: Purple (#CCB2FF, #F5EFFF)
- **Brand**: Teal (#7DD3C0)
- Consistent across chat bubbles, buttons, and profile picture borders

### Database Migrations
When adding/modifying models:
1. Make changes to model in `backend/app/models/`
2. Create migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration in `backend/migrations/versions/`
4. Apply: `alembic upgrade head`
5. If multiple heads exist, update `down_revision` to point to correct parent

### Inline Styling Pattern
Frontend uses JavaScript style objects (not CSS files) for component styling. This allows dynamic theming and keeps styles colocated with components. Example:
```javascript
const styles = {
  container: {
    background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
    fontFamily: "'Nunito', sans-serif",
  }
}
```

### SessionStorage Persistence Pattern
For cross-page state that needs to survive redirects (like invite links through auth flow):

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

**Why sessionStorage not localStorage**: Session-specific data that shouldn't persist across browser sessions. Automatically cleared when tab closes.

### API Request Pattern
Frontend uses `apiRequest` helper (`api/client.js`) that automatically includes JWT token from AuthContext and `credentials: 'include'` for CORS. Don't use fetch/axios directly - use this wrapper for consistent error handling.

### Trailing Slash Pattern (CRITICAL for Safari/Firefox)

**The Problem**: Safari 16.3+ and Firefox 112+ implement the 2024 Fetch Standard which **strips Authorization headers on cross-origin redirects** for security. Chrome hasn't adopted this yet, causing Chrome vs Safari/Firefox inconsistencies.

**How It Breaks**:
1. Frontend calls: `/rooms` (no trailing slash)
2. Backend route: `@router.get("/")` → registered as `/rooms/` (with slash)
3. FastAPI sends **308 Permanent Redirect**: `/rooms` → `/rooms/`
4. Safari/Firefox **strip the Authorization header** on the redirect
5. Second request arrives without auth → **401 Unauthorized**
6. Chrome: Doesn't strip header (not yet spec-compliant) → works fine

**The Solution**: Frontend API calls MUST match backend route definitions EXACTLY:

```javascript
// ❌ WRONG - Missing trailing slash when backend has one
await apiRequest('/rooms', 'GET', null, token);  // Backend: @router.get("/")

// ✅ CORRECT - Matches backend route exactly
await apiRequest('/rooms/', 'GET', null, token);  // Backend: @router.get("/")
```

**How to Check**:
1. Look at backend route: `@router.get("/")` under `router = APIRouter(prefix="/rooms")`
   - This creates route: `/rooms/` (WITH trailing slash)
2. Frontend call MUST use: `/rooms/` (with slash)

**Common Patterns**:
- List endpoint: `/rooms/` (with slash because route is `@router.get("/")`)
- Detail endpoint: `/rooms/{id}` (no slash because route is `@router.get("/{id}")`)
- Nested endpoint: `/rooms/{id}/coach/turns` (no trailing slash)

**Debugging**:
- Check browser Network tab for 308 redirects
- Safari/Firefox will show two requests: 308 then 401
- Chrome will show single 200 (masks the redirect)

**Prevention**:
- When adding new routes, decide on trailing slash convention and be consistent
- Or configure FastAPI with `redirect_slashes=False` to fail fast instead of silent redirects

### User1/User2 Identification Pattern (CRITICAL)

**The Problem**: Participants array is ordered by database ID, not by who initiated the room. This caused bugs where User1/User2 were misidentified.

**The Solution**: Always determine User1 by finding the **earliest** `pre_mediation` turn:

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

**Where This Matters**:
- `/main-room/summaries` - Must return correct user1_summary and user2_summary
- `/main-room/start` - Must address User1 by name in opening message
- `/main-room/messages` - Must correctly determine next_speaker_id
- `/coach/finalize` - Must save summary to correct field (user1_summary or user2_summary)

**Critical Insight**: User1 = room initiator (has invite link), User2 = invitee (joins via invite). This is determined by chronological coaching start time, NOT database ID order.

### Context Separation Pattern (CRITICAL)

**The Turn.context Field**: Every turn has `context` set to either `"pre_mediation"` or `"main"`.

**Why This Matters**:
- Coaching AI questions/responses must NOT appear in main room conversation
- Main room only sees the polished summaries, not the raw coaching dialogue
- Prevents sensitive coaching details from leaking to the other participant

**Example**:
```python
# Get coaching history for User 1 only
coaching_turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.user_id == user1.id,
    Turn.context == "pre_mediation"  # CRITICAL - prevents main room turns
).all()

# Get main room messages for both users
main_turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.context == "main"  # CRITICAL - excludes coaching
).all()
```

**Always Remember**: When querying turns, always filter by `context` unless you specifically need all turns.

### Polling Architecture Pattern

**Why No WebSockets?** Trade-off decision: simpler deployment vs. real-time latency.

**How It Works**:
- Frontend polls `/rooms/{id}/main-room/messages` every 3 seconds
- Backend returns: new messages, current_speaker_id, break_info, user presence
- ~3 second lag for message delivery (acceptable for mediation use case)

**Benefits**:
- No WebSocket infrastructure needed
- Works behind corporate firewalls
- Simpler to deploy (Vercel + Railway)
- No connection state to manage

**Trade-offs**:
- Slight delay in message delivery
- More HTTP requests (but manageable at expected scale)

**Polling Locations**:
- `MainRoom.jsx` - Main room messages (every 3s)
- `WaitingRoom.jsx` - Phase changes for User1 waiting (every 3s)
- `SessionsDashboard.jsx` - Room status updates (every 5s)

### Voice Message Flow

**Complete Flow**:
```
1. Frontend: VoiceRecorder captures audio (webm format)
2. POST /rooms/{id}/coach/respond with FormData (multipart/form-data)
3. Backend: Check subscription.voice_conversations_used < limit
4. Whisper API: Transcribe audio → text
   - Cost: $0.006 per minute
   - Tracked in api_costs table
5. S3 Upload: Store audio file → audio_url
   - Path: voice-recordings/{room_id}/{turn_id}.webm
6. Save Turn: summary=transcribed_text, audio_url=s3_url, cost_usd
7. AI Processing: Continue with transcribed text as if typed
8. Return: transcribed_text in response (shown in gray subtitle)
```

**Key Files**:
- `frontend/src/components/VoiceRecorder.jsx` - Audio capture
- `backend/app/services/whisper_service.py` - Transcription
- `backend/app/services/s3_service.py` - File storage
- `backend/app/routes/rooms.py:respond_coaching` - Integration

**Cost Tracking**: Every Whisper call tracked in `api_costs` table with service_type="openai_whisper", audio_seconds, cost_usd.

### Subscription Enforcement Pattern

**Tier Limits**:
```python
TIER_LIMITS = {
    "FREE": {"rooms_per_month": 1, "voice_limit": 0},
    "PLUS": {"rooms_per_month": 5, "voice_limit": 30},
    "PRO": {"rooms_per_month": -1, "voice_limit": 300}  # -1 = unlimited
}
```

**Where Limits Are Checked**:
1. **Room Creation** (`POST /rooms/`):
   ```python
   active_rooms_this_month = count_user_rooms(user_id, current_month)
   if active_rooms_this_month >= tier_limit:
       raise HTTPException(402, "Upgrade required")
   ```

2. **Voice Messages** (`respond_coaching` with audio):
   ```python
   if subscription.voice_conversations_used >= subscription.voice_conversations_limit:
       raise HTTPException(402, "Voice limit reached")
   ```

**Stripe Integration**:
- Webhook at `/subscriptions/webhook` handles payment events
- Updates `subscription.tier`, `subscription.status`
- Increments limits on tier upgrade

### Cost Tracking Architecture

**Dual Tracking System**:
1. **Turn.input_tokens, output_tokens, cost_usd** - Per-message costs for UX
2. **ApiCost table** - Separate analytics table for profitability

**Why Both?**
- Turn data = show user their conversation cost
- ApiCost data = admin analytics, profitability reports

**Cost Calculation**:
```python
# Anthropic pricing (as of 2024)
INPUT_COST = 0.003 / 1000   # $0.003 per 1K input tokens
OUTPUT_COST = 0.015 / 1000  # $0.015 per 1K output tokens

cost_usd = (input_tokens * INPUT_COST) + (output_tokens * OUTPUT_COST)
```

**Admin Endpoint**: `GET /rooms/admin/costs` - Total costs by user, room, date range.

### Professional PDF Report Generation

**Purpose**: Generate therapist-style professional reports for completed mediations, suitable for case documentation or therapy review.

**How It Works**:
1. **User Action**: On ResolutionComplete page, user clicks "Generate Report" button
2. **API Call**: Frontend calls `POST /rooms/{id}/generate-report`
3. **Content Generation**: Backend uses Claude Sonnet 4.5 API to generate report sections from transcript
4. **PDF Creation**: ReportLab library formats content into professional PDF with Meedi8 logo
5. **S3 Upload**: PDF stored in S3 bucket at `reports/{room_id}/professional-report-{timestamp}.pdf`
6. **Database Update**: `room.professional_report_url` saved with S3 URL
7. **Caching**: If report already exists, returns existing URL (avoids regenerating and wasting tokens)
8. **Button Transition**: Frontend button changes to "Download Report (PDF)" link

**Report Sections**:
1. **Header**: Meedi8 logo, mediation details (date, category, participants)
2. **Presenting Issues**: Initial conflict description (2-3 paragraphs)
3. **Conversation Summary**: Key moments and progression (3-4 paragraphs)
4. **Observations**: Mediator insights on communication patterns (2-3 paragraphs)
5. **Assessment**: Analysis of conflict dynamics and resolution process (2-3 paragraphs)
6. **Recommendations**: Suggestions for ongoing support, link to https://meedi8.vercel.app/therapy (2-3 paragraphs)
7. **Final Agreement**: Full text of mediation agreement

**Cost Analysis**:
- Claude API call: ~$0.03-0.05 per report (depends on transcript length)
- Input tokens: ~10,000-15,000 (full transcript + prompt)
- Output tokens: ~2,000-3,000 (comprehensive report)
- S3 storage: Negligible (~$0.01/GB/month)
- Total per report: ~$0.03-0.05

**Implementation Files**:
- `backend/app/services/report_generator.py` - Complete report generation service (353 lines)
  - `generate_report_content_with_claude()`: Claude API integration
  - `create_pdf_report()`: ReportLab PDF formatting
  - Uses PNG logo from `public/meedi8-logo.png`
- `backend/app/routes/rooms.py:2638-2779` - API endpoint
  - Authorization check (only participants)
  - Phase validation (only resolved rooms)
  - Caching logic (returns existing report if present)
- `backend/app/models/room.py:57-58` - Database field: `professional_report_url`
- `backend/app/services/s3_service.py:136-180` - S3 upload function
- `backend/migrations/versions/20251112_add_professional_report_url.py` - Migration
- `frontend/src/pages/ResolutionComplete.jsx:14-15, 55-68, 180-248` - UI components
  - State management: `generatingReport`, `reportUrl`
  - Button states: Generate → Generating... → Download
- `backend/requirements.txt:18-19` - Dependencies: `reportlab>=4.0.0`, `Pillow>=9.0.0`

**Frontend Button States**:
```javascript
// State 1: Report not generated yet
<button onClick={generateReport}>
  📄 Generate Report
</button>

// State 2: API call in progress
<button disabled>
  ⏳ Generating...
</button>

// State 3: Report ready
<a href={reportUrl} target="_blank">
  📥 Download Report (PDF)
</a>
```

**Backend Response Format**:
```json
{
  "success": true,
  "report_url": "https://bucket.s3.region.amazonaws.com/reports/123/professional-report-20251112_143022.pdf",
  "message": "Report generated successfully",
  "cost_usd": 0.0342,
  "input_tokens": 12456,
  "output_tokens": 2341
}
```

**Logo Handling**:
- Logo file: `public/meedi8-logo.png` (PNG format)
- Dimensions: 300x100 pixels (approximate)
- Positioned at top center of PDF
- Alternative text-only fallback if logo missing

**Error Handling**:
- Missing transcript: Returns 400 error
- Unauthorized user: Returns 403 error
- Wrong phase: Returns 400 "Report can only be generated for resolved rooms"
- Claude API failure: Returns 500 with error message
- S3 upload failure: Returns 500 with error message
- Frontend shows alert: "Failed to generate report. Please try again."

**Production Notes**:
- ReportLab library compatible with Railway deployment
- PNG logo preferred over SVG (no pycairo dependency issues)
- Reports cached in database to avoid regeneration costs
- S3 ContentDisposition set to 'inline' for browser viewing

### Homepage Image Assets

**Purpose**: Display branded Meedi8 illustrations on homepage instead of placeholder SVG data.

**The Fix** (2025-11-12):
Homepage was showing inline SVG placeholders instead of actual Meedi8 branded illustrations. Three images needed to be replaced with correct asset paths.

**Files Changed**:
- `frontend/src/pages/Home.jsx:188-192` - Hero image (Meedi standing)
- `frontend/src/pages/Home.jsx:213-217` - Mediation card image (family)
- `frontend/src/pages/Home.jsx:253-257` - Solo session card image (Meedi sitting with bubble)

**Before** (inline SVG data URIs):
```javascript
src="data:image/svg+xml,%3Csvg width='300' height='300'..."
```

**After** (proper asset paths):
```javascript
// Hero section
src="/assets/illustrations/meedi standing.svg"
alt="Meedi - Your AI Mediator"

// Mediation card
src="/assets/illustrations/family.svg"
alt="Two People in Mediation"

// Solo session card
src="/assets/illustrations/Meedi_sit_bubble.svg"
alt="Talk to Meedi Solo"
```

**Asset Locations**:
All illustrations stored in `frontend/public/assets/illustrations/`:
- `meedi standing.svg` - Main hero character
- `family.svg` - Two people for mediation card
- `Meedi_sit_bubble.svg` - Meedi with speech bubble for solo mode

**Visual Consistency**:
- Illustrations use brand colors (teal #7DD3C0, purple #D3C1FF)
- Maintain consistent character design across all pages
- SVG format for crisp scaling at any resolution

**Debugging Homepage Image Issues**:
1. Check browser console for 404 errors on image paths
2. Verify files exist in `frontend/public/assets/illustrations/`
3. Check asset paths don't include `/public/` prefix (Vite handles this automatically)
4. Ensure SVG files are valid (not corrupted)
5. Use browser dev tools to inspect actual `src` attribute values

## Testing & Debugging

### Local Development Setup
1. Backend: `cd backend && ./run.sh` (runs on :8000)
2. Frontend: `cd frontend && npm run dev` (runs on :5173)
3. Ensure `.env` files are configured with API keys

### Common Issues

**Pages showing blank on Vercel (green background only)**:
- **Cause**: SSR crash due to accessing browser APIs like `window`, `document`, `localStorage` during build
- **Solution**: Add `typeof window !== 'undefined'` checks before accessing browser APIs
- **Common culprits**:
  - `window.innerWidth` → Check if window exists first
  - `window.location` → Use React Router's `useLocation()` hook instead
  - OAuth components → Make them conditional based on valid credentials
  - PageHeader component → Was crashing on ALL pages due to window.location access
- **Files commonly affected**: LoginNew.jsx, Signup.jsx, PageHeader.jsx, Onboarding.jsx, WaitingRoom.jsx, FAQ.jsx, EmailVerification.jsx
- **Debug**: Check Vercel deployment logs for build errors, look for "window is not defined" or "ReferenceError"

**OAuth components crashing**:
- **Error**: "Google OAuth components must be used within GoogleOAuthProvider"
- **Cause**: OAuth provider not wrapping app OR placeholder credentials causing validation mismatch
- **Solution**: Ensure main.jsx has valid OAuth credentials check and matches component-level checks:
  ```javascript
  // Must match in both main.jsx AND component files
  const hasValidGoogleOAuth = GOOGLE_CLIENT_ID &&
                               GOOGLE_CLIENT_ID.length > 20 &&
                               !GOOGLE_CLIENT_ID.includes('YOUR_')
  ```

**Alembic "multiple heads"**:
- Check current heads: `alembic heads`
- Update migration's `down_revision` to point to correct parent
- Or stamp to specific revision: `alembic stamp <revision>`

**Alembic "duplicate column" error**:
- **Cause**: Previous migration partially applied before failing
- **Solution**: Use `alembic stamp head` to mark as applied if columns already exist
- **Prevention**: Test migrations locally with SQLite before deploying to PostgreSQL

**OAuth not working**:
- Check authorized domains in OAuth provider console match deployment URL
- Verify environment variables are set in Vercel/Railway (not just local .env)
- Check browser console for CORS errors

**Phase transition errors**:
- Verify current room phase before making request
- Check backend logs for which phase gate is failing
- Use `/rooms/{id}` endpoint to inspect current phase

**Turn-taking issues in MainRoom**:
- Check `current_speaker_id` matches requesting user
- Mediator assigns next speaker after each message
- Frontend polls for message updates every 3 seconds
- **CRITICAL**: Verify users have DISTINCT names - duplicate names (e.g., "Adam"/"Adam") will confuse the AI's ability to address the correct person. Test with clearly different names (e.g., "Dave"/"Sarah") to rule out name confusion before debugging code.

**Break not syncing between users**:
- Verify polling is working (check Network tab for `/main-room/messages` calls every 3s)
- Check `break_info` field in API response
- Ensure both break database fields exist (run migration if needed)

**Summaries showing for wrong users** (e.g., "Dave's Perspective" shows Ads's content):
- **Root Cause**: User1/User2 determined incorrectly, or summaries saved to wrong database fields
- **Debug Steps**:
  1. Check who started coaching first:
     ```sql
     SELECT t.user_id, u.name, t.created_at
     FROM turns t JOIN users u ON t.user_id = u.id
     WHERE t.room_id = X AND t.context = 'pre_mediation'
     ORDER BY t.created_at ASC LIMIT 5;
     ```
  2. Verify summaries in database:
     ```sql
     SELECT id, user1_summary, user2_summary FROM rooms WHERE id = X;
     ```
  3. Check if User1/User2 determination logic is using chronological order (earliest turn), not participant array order
- **Fix**: If summaries are backwards in database, can swap with:
  ```sql
  UPDATE rooms
  SET user1_summary = (SELECT user2_summary FROM rooms WHERE id = X),
      user2_summary = (SELECT user1_summary FROM rooms WHERE id = X)
  WHERE id = X;
  ```

**Safari/Firefox 401 errors but Chrome works**:
- **Error**: `/auth/me` succeeds but other endpoints return 401 in Safari/Firefox
- **Root Cause**: Trailing slash mismatch causing 308 redirect that strips Authorization header (Safari/Firefox follow 2024 Fetch Standard, Chrome doesn't)
- **Debug**:
  - Check Network tab for 308 redirects before the 401
  - Look for mismatched URLs: frontend `/rooms` vs backend `/rooms/`
- **Solution**: Match frontend API calls to backend route definitions exactly (including trailing slashes)
  ```javascript
  // If backend has: @router.get("/")  → use '/rooms/' (with slash)
  await apiRequest('/rooms/', 'GET', null, token);
  ```
- **Prevention**: See "Trailing Slash Pattern" section for full details

## Key Files Reference

**Backend Core**:
- `app/main.py` - FastAPI app entry point, CORS, route registration
- `app/routes/rooms.py` - Room CRUD, coaching/mediation endpoints
- `app/routes/auth.py` - OAuth endpoints for all providers
- `app/services/pre_mediation_coach.py` - NVC coaching AI
- `app/services/main_room_mediator.py` - Joint mediation AI
- `app/models/room.py` - Room and Turn models with phase tracking

**Frontend Core**:
- `src/pages/CoachingChat.jsx` - Individual coaching with summary popup
- `src/pages/MainRoom.jsx` - Joint mediation with turn-taking
- `src/pages/LoginNew.jsx` - Multi-provider OAuth login
- `src/context/AuthContext.jsx` - JWT token and user state management
- `src/api/client.js` - Authenticated API request wrapper

**Database**:
- `backend/migrations/versions/` - Alembic migration files
- `backend/alembic.ini` - Alembic configuration

## Rollback Reference Points

### Latest Stable State: Commit `c5cfd7b` (2025-11-12)

**Git Rollback Command**:
```bash
git revert HEAD~2..HEAD  # Revert to previous stable if needed
# Or specific rollback:
git checkout c5cfd7b     # Check out latest stable commit
git checkout -b rollback-to-c5cfd7b
git push origin rollback-to-c5cfd7b
```

**Deployment URLs**:
- Frontend: https://meedi8.vercel.app (Vercel auto-deploys from `main`)
- Backend: https://meedi8-production.up.railway.app (Railway auto-deploys from `main`)

**What's Working at This State**:
✅ User authentication (Google, Facebook, Telegram OAuth)
✅ Screening flow with bypass for returning users
✅ Individual coaching (pre-mediation) for both users
✅ Main room mediation with strict turn-by-turn
✅ Harsh language intervention (direct confrontation pattern)
✅ File attachments (images + documents) with AI analysis
✅ Voice messages with Whisper transcription
✅ Break/pause feature synchronized between users
✅ Resolution tracking and agreements
✅ Professional PDF report generation (Claude API + ReportLab)
✅ Homepage branded illustrations (correct asset paths)
✅ PostgreSQL compatibility (Railway) + SQLite (local dev)

**Recent Commits Included** (2025-11-12):
1. `ee70883` - Enforce strict turn-by-turn with direct harsh language intervention
2. `c5cfd7b` - Add professional PDF report generation and fix homepage images

### Previous Stable State: Commit `246b6c4` (2025-11-12)

**What's Working at This State**:
✅ User authentication (Google, Facebook, Telegram OAuth)
✅ Screening flow with bypass for returning users
✅ Individual coaching (pre-mediation) for both users
✅ Main room mediation with turn-taking
✅ File attachments (images + documents) with AI analysis
✅ Voice messages with Whisper transcription
✅ Break/pause feature synchronized between users
✅ Deep exploration mode for harsh language
✅ Resolution tracking and agreements
✅ PostgreSQL compatibility (Railway) + SQLite (local dev)

**Recent Commits Included** (2025-11-11 to 2025-11-12):
1. `5a825ba` - Add file attachment feature to main room chat
2. `47db28a` - Fix image attachments displaying placeholder text
3. `c35082b` - Fix screening bypass: Add has_completed_screening to /auth/me response
4. `6774563` - Add AI image analysis and fix image thumbnail display
5. `80709e6` - Add comprehensive error handling and debugging for Railway 500 errors
6. `246b6c4` - Fix PostgreSQL JSON query: Replace tags.contains() with cast to text

**Database Migrations Included**:
- `20251111_add_solo_mode_columns.py` - Solo mode fields (room_type, clarity_summary, etc.)
- `20251111_add_attachment_fields_to_turns.py` - File attachment fields (attachment_url, attachment_filename)

**Critical Files Modified**:
- `backend/app/routes/rooms.py` (lines 1002, 1961-2061) - PostgreSQL fix + file upload endpoint
- `backend/app/routes/auth.py` (lines 53, 284) - Screening bypass fix
- `backend/app/models/room.py` (lines 24, 44-56, 101-103) - Solo mode + attachment fields
- `backend/app/services/image_analysis.py` (NEW) - Claude Vision integration
- `frontend/src/pages/MainRoom.jsx` (lines 827-898, 906-929) - File upload UI + attachment display
- `frontend/src/pages/CreateRoom.jsx` (lines 31-43) - User data refresh for screening

**Environment Variables Required on Railway**:
```
ANTHROPIC_API_KEY=sk-ant-...        # For AI mediation + image analysis
OPENAI_API_KEY=sk-...               # For Whisper voice transcription
AWS_ACCESS_KEY_ID=...               # For S3 file storage
AWS_SECRET_ACCESS_KEY=...           # For S3 file storage
AWS_S3_BUCKET=...                   # S3 bucket name
AWS_REGION=us-east-1                # S3 region
DATABASE_URL=postgresql://...       # Railway PostgreSQL
CORS_ORIGINS=https://meedi8.vercel.app,...  # Frontend origins
```

**Known Issues Fixed**:
- ✅ PostgreSQL JSON query compatibility (`tags.contains()` → `cast().like()`)
- ✅ CORS errors on Safari/Firefox (trailing slash matching)
- ✅ Screening loop bug (missing `has_completed_screening` field)
- ✅ Image placeholder text showing above thumbnails
- ✅ User1/User2 misidentification (now uses chronological order)

**How to Verify Deployment is Working**:
1. Check health: `curl https://meedi8-production.up.railway.app/health`
2. Check environment: `curl https://meedi8-production.up.railway.app/debug/env`
3. Check database: `curl https://meedi8-production.up.railway.app/debug/database`
4. Test full flow:
   - Create room → Complete screening → Coaching → Main room
   - Upload image → Verify AI analysis appears
   - Test file download works
   - Test break button syncs between users

**If Issues Occur After This Point**:
1. Check Railway deployment logs for migration errors
2. Verify environment variables are set correctly
3. Test `/debug/database` endpoint to confirm schema is correct
4. Compare working commit `246b6c4` with current HEAD to see what changed
5. Consider rolling back to this commit and re-applying changes incrementally

---

## Current Work Session Status (2025-11-13)

### Latest Commit: `f9825c3` (2025-11-13)

**Email Notification System - COMMITTED AND DEPLOYED**

Files committed and pushed to production:
```
PAYWALL.md                              # NEW - Comprehensive paywall strategy doc
SENDGRID_SETUP.md                       # NEW - SendGrid setup guide (500+ lines)
backend/app/routes/rooms.py             # Modified - Added email imports and calls
backend/app/services/email_service.py   # NEW - SendGrid integration service
backend/requirements.txt                # Modified - Added sendgrid>=6.10.0
backend/test_email.py                   # NEW - Interactive testing script
CLAUDE.md                               # Modified - Added session status documentation
```

**Status**: Code deployed to Railway/Vercel. Email system disabled by default (`EMAIL_NOTIFICATIONS_ENABLED=false`). Safe to run in production. Ready to enable once domain DNS and SendGrid are configured.

### Next Steps (When Resuming)

**Immediate (Domain Setup Required)**:
1. Configure custom domain `meedi8.com` DNS in Namecheap:
   - Add Vercel DNS records for frontend (meedi8.com, www.meedi8.com)
   - Add Railway CNAME for backend (api.meedi8.com)
   - Add SendGrid CNAME records for email verification (3-5 records)

2. After DNS configured, complete SendGrid setup:
   - Create SendGrid account at https://sendgrid.com
   - Generate API key (Settings → API Keys)
   - Verify domain in SendGrid dashboard (wait for DNS propagation)
   - Add environment variables to Railway:
     ```
     SENDGRID_API_KEY=SG.xxxxxx
     FROM_EMAIL=notifications@meedi8.com
     FROM_NAME=Meedi8
     EMAIL_NOTIFICATIONS_ENABLED=false
     FRONTEND_URL=https://meedi8.com
     ```

3. Test email delivery:
   - Run `python backend/test_email.py` locally
   - Send test to personal email
   - Verify HTML rendering and links work
   - Check SendGrid Activity Feed for delivery status

4. Enable and commit:
   - Set `EMAIL_NOTIFICATIONS_ENABLED=true` in Railway
   - Commit all staged changes with message from session notes
   - Push to GitHub (auto-deploys to Railway + Vercel)
   - Test full mediation flow with real users

**Future Tasks (From Todo List)**:
- Add browser push notifications (FCM/OneSignal) - for real-time alerts
- Add SMS notifications as premium feature (Twilio) - optional enhancement
- Implement paywall strategy from PAYWALL.md (Phase 1: room limits, file size)

### Email Notification Features Implemented

**Turn Notifications**:
- Triggered when other user responds in main room
- Subject: "{Name} has responded - Your turn in Meedi8"
- HTML email with teal gradient header, branded styling
- CTA button: "Continue Mediation →" linking to room
- Plain text fallback for email clients without HTML
- Gracefully handles errors (logs but doesn't fail request)

**Break Notifications**:
- Triggered when other user requests breathing break
- Subject: "{Name} requested a break - Meedi8"
- Purple gradient header (break theme)
- Links to room with explanation of break feature

**Integration Points**:
- `backend/app/routes/rooms.py:1299-1311` - Turn notification in respond_main_room
- `backend/app/routes/rooms.py:1499-1511` - Break notification in request_break
- Both use try/except to prevent email failures from breaking API responses

**Cost Analysis**:
- SendGrid free tier: 100 emails/day = 3,000/month
- Average mediation: 25-45 emails (turn notifications)
- Free tier supports: 65-120 mediations/month
- Paid tier: $19.95/month for 50,000 emails if needed
- Cost per mediation: ~$0.01-0.02 (negligible vs AI costs)

### DNS Configuration Reference

**For Namecheap → Vercel (Frontend)**:
```
Type: A
Host: @
Value: 76.76.21.21

Type: CNAME
Host: www
Value: cname.vercel-dns.com
```

**For Namecheap → Railway (Backend)**:
```
Type: CNAME
Host: api
Value: [provided by Railway].up.railway.app
```

**For Namecheap → SendGrid (Email)**:
```
Type: CNAME
Host: em[####]
Value: u[####].wl[###].sendgrid.net

Type: CNAME
Host: s1._domainkey
Value: s1.domainkey.u[####].wl[###].sendgrid.net

Type: CNAME
Host: s2._domainkey
Value: s2.domainkey.u[####].wl[###].sendgrid.net
```
(Exact values provided by SendGrid during domain verification)

### Important Notes for Morning

1. **✅ ALREADY COMMITTED AND DEPLOYED** - Commit `f9825c3` pushed to GitHub
2. **Email system is disabled** - `EMAIL_NOTIFICATIONS_ENABLED=false` by default, safe in production
3. **Railway/Vercel auto-deployed** - Both services picked up the changes automatically
4. **No action needed until domain DNS ready** - System waiting for configuration
5. **SendGrid dependency added** - `sendgrid>=6.10.0` in requirements.txt (Railway installed it)
6. **Test script ready** - Use `python backend/test_email.py` after SendGrid setup
7. **PAYWALL.md available** - Comprehensive strategy for future implementation
