# System Architecture

## Overview

Meedi8 is an AI-powered mediation platform using Nonviolent Communication (NVC) principles. The system guides two users through individual coaching, then facilitates a joint mediation session.

**Tech Stack:**
- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL (prod) / SQLite (dev)
- AI: Claude Sonnet 4.5 (Anthropic)
- Storage: AWS S3
- Payments: Stripe
- Email: SendGrid

## Mediation Flow Phases

The system implements a **sequential multi-phase flow** tracked by `Room.phase`:

### Phase 1: user1_intake
- User 1 describes the conflict situation
- Creates room and becomes "User 1"
- Provides basic context for mediation

### Phase 2: user1_coaching
- AI coach guides User 1 through NVC framework
- Structure: Observations → Feelings → Needs → Empathy
- Produces summary written in first person
- Phase ends when AI detects readiness: `READY: [summary]`

### Phase 3: user2_lobby
- User 1 receives invite link
- Waiting room while User 2 hasn't joined yet
- Frontend polls for phase change every 3 seconds

### Phase 4: user2_coaching
- User 2 receives invite link, logs in
- Sees User 1's summary as context (editable popup)
- AI coach guides through same NVC framework
- Produces own summary in first person
- Phase ends when ready

### Phase 5: main_room
- Both users enter joint mediation session
- Each sees opposite user's summary as first message
- AI mediator facilitates conversation
- Strict turn-taking enforced (one speaker at a time)
- Phases: Shared Understanding → Common Ground → Solutions → Agreements
- Phase ends when agreement reached: `AGREEMENT: [text]`

### Phase 6: resolved
- Mediation complete with documented agreement
- Both users can view resolution
- Optional: Generate professional PDF report

**Critical Pattern:** Backend routes check `room.phase` before allowing actions. Frontend components render based on phase state.

## Data Models

### Room (Container for Mediation Session)

**Core Fields:**
- `id` (Integer) - Primary key
- `phase` (String) - Current phase (see above)
- `invite_token` (String) - Unique token for User 2 to join
- `category` (String) - Conflict type (family, workplace, etc.)
- `room_type` (String) - "mediation" or "solo"

**Summaries:**
- `user1_summary` (Text) - NVC summary from User 1's coaching
- `user2_summary` (Text) - NVC summary from User 2's coaching

**Turn-Taking:**
- `current_speaker_id` (Integer, nullable) - Who can speak in main room
- `last_speaker_id` (Integer, nullable) - Previous speaker
- `consecutive_questions_to_same` (Integer) - Counter for deep exploration

**Break Feature:**
- `break_requested_by_id` (Integer, nullable) - User who requested break
- `break_requested_at` (DateTime, nullable) - When break requested

**Agreement & Reports:**
- `agreement_text` (Text, nullable) - Final mediation agreement
- `professional_report_url` (String, nullable) - S3 URL of PDF report

**Relationships:**
- `participants` (Many-to-Many with User) - Both participants
- `turns` (One-to-Many with Turn) - All messages/exchanges

### Turn (Individual Message/Exchange)

**Core Fields:**
- `id` (Integer) - Primary key
- `room_id` (Integer) - Foreign key to Room
- `user_id` (Integer, nullable) - Speaker (null for AI messages)
- `summary` (Text) - Message content or transcribed text
- `created_at` (DateTime) - Timestamp

**Message Classification:**
- `context` (String) - "pre_mediation" or "main"
- `kind` (String) - Message type (intake, ai_question, user_response, etc.)
- `tags` (JSON) - Auto-extracted tags (fact, feeling, request, opinion)
- `role` (String, nullable) - Special roles (intro, summary, agreement)

**Media:**
- `audio_url` (String, nullable) - S3 URL if voice message
- `attachment_url` (String, nullable) - S3 URL for file uploads
- `attachment_filename` (String, nullable) - Original filename
- `attachment_type` (String, nullable) - MIME type
- `attachment_analysis` (Text, nullable) - AI image analysis

**Cost Tracking:**
- `input_tokens` (Integer) - AI input tokens used
- `output_tokens` (Integer) - AI output tokens used
- `cost_usd` (Decimal) - Cost of this turn
- `model` (String) - AI model used

**Critical Pattern:** Always filter turns by `context` to separate coaching from mediation. This prevents coaching history from leaking into main room.

### User (Authentication & Profile)

**Core Fields:**
- `id` (Integer) - Primary key
- `email` (String, unique) - User email (or synthetic)
- `name` (String) - Display name
- `profile_picture_url` (String, nullable) - OAuth profile picture
- `has_completed_screening` (Boolean) - Bypass screening on return

**Authentication:**
- `hashed_password` (String) - Bcrypt hash (for Stripe-created users)
- `is_active` (Boolean) - Account status

**OAuth:**
- Google: Real email + profile picture
- Facebook: Real email + profile picture
- Telegram: Synthetic email (telegram_{id}@telegram.meedi8.com) + photo
- Twitter: Synthetic email ({username}@twitter.meedi8.com)

**Relationships:**
- `subscription` (One-to-One with Subscription)
- `rooms` (Many-to-Many with Room) - Participated mediations

### Subscription (Tiered Access)

**Core Fields:**
- `id` (Integer) - Primary key
- `user_id` (Integer) - Foreign key to User
- `tier` (String) - "FREE", "PLUS", or "PRO"
- `status` (String) - "active", "canceled", "past_due"
- `stripe_customer_id` (String, nullable)
- `stripe_subscription_id` (String, nullable)

**Usage Tracking:**
- `rooms_created_this_month` (Integer) - Counter for room limit
- `voice_conversations_used` (Integer) - Voice message counter
- `voice_conversations_limit` (Integer) - Voice message limit
- `reports_generated_this_month` (Integer) - PDF report counter

**Tier Limits:**
```python
TIER_LIMITS = {
    "FREE": {
        "rooms_per_month": 1,
        "voice_limit": 0,
        "file_upload_size_mb": 0,  # Disabled
        "reports_per_month": 0
    },
    "PLUS": {
        "rooms_per_month": 5,
        "voice_limit": 30,
        "file_upload_size_mb": 10,
        "reports_per_month": 0
    },
    "PRO": {
        "rooms_per_month": -1,  # Unlimited
        "voice_limit": 300,
        "file_upload_size_mb": 50,
        "reports_per_month": 3
    }
}
```

**Counter Resets:** Automatic monthly reset on 1st of each month.

## Frontend Architecture

### Page Flow

**Unauthenticated:**
1. `Home.jsx` - Landing page with illustrations
2. `LoginNew.jsx` - Multi-provider OAuth login
3. `Signup.jsx` - Alternative signup flow

**Authenticated:**
1. `CreateRoom.jsx` - Start new mediation (with screening)
2. `CoachingChat.jsx` - Individual NVC coaching
3. `WaitingRoom.jsx` - User 1 waits for User 2 (phase: user2_lobby)
4. `Lobby.jsx` - User 2 joins via invite link
5. `MainRoom.jsx` - Joint mediation session
6. `ResolutionComplete.jsx` - View agreement + generate report

**Additional Pages:**
- `RoomsList.jsx` - User's mediation rooms dashboard
- `Subscription.jsx` - Stripe checkout (payment-first flow)
- `TelegramConnect.jsx` - Telegram folder integration
- `FloatingMenu.jsx` - Persistent navigation menu

### Component Patterns

**Color Coding:**
- User 1: Teal (#7DD3C0, #E8F9F5)
- User 2: Purple (#CCB2FF, #F5EFFF)
- Brand: Teal (#7DD3C0)
- Telegram: Blue (#0088CC)

**Inline Styling:**
Frontend uses JavaScript style objects (not CSS files):
```javascript
const styles = {
  container: {
    background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
    fontFamily: "'Nunito', sans-serif",
  }
}
```

**SSR Safety:**
All browser APIs guarded with checks:
```javascript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

**API Requests:**
Use `apiRequest` helper (not fetch/axios directly):
```javascript
import { apiRequest } from '../api/client';
const data = await apiRequest('/rooms/', 'GET', null, token);
```

### State Management

**AuthContext:**
- JWT token storage
- User profile data
- Login/logout handlers
- Token refresh logic

**SessionStorage:**
- `pendingInvite` - Invite token for redirect after auth
- Short-lived, session-specific data

**Polling:**
- MainRoom: Poll `/main-room/messages` every 3s
- WaitingRoom: Poll for phase changes every 3s
- SessionsDashboard: Poll room status every 5s

**Why No WebSockets?**
Trade-off: Simpler deployment vs real-time latency. Polling acceptable for mediation use case (~3 second lag).

## Backend Architecture

### Service Layer

**AI Services:**
- `pre_mediation_coach.py` - Individual NVC coaching
- `main_room_mediator.py` - Joint mediation facilitation

**External Services:**
- `whisper_service.py` - Voice transcription (OpenAI)
- `email_service.py` - Email notifications (SendGrid)
- `s3_service.py` - File storage (AWS S3)
- `stripe_service.py` - Payment processing
- `telegram_service.py` - Telegram integration (Telethon)
- `report_generator.py` - PDF report generation (ReportLab + Claude)
- `image_analysis.py` - Image analysis (Claude Vision)

**Business Logic:**
- `subscription_service.py` - Tier limits and enforcement

### Middleware

**Rate Limiting:**
- `rate_limit.py` - Subscription enforcement
- Checks limits before room creation
- Checks limits before voice message processing

**CORS:**
- Configured in `main.py`
- Allows frontend origins (Vercel + localhost)
- Credentials enabled for cookie auth

### API Routes

**Core Endpoints:**
- `/auth/*` - OAuth login, user profile
- `/rooms/*` - Room CRUD, coaching, mediation
- `/subscriptions/*` - Stripe checkout, webhooks
- `/telegram/*` - Telegram contacts, folders

**Room Endpoints:**
- `POST /rooms/` - Create room
- `GET /rooms/{id}` - Get room details
- `POST /rooms/{id}/coach/respond` - Send coaching message
- `POST /rooms/{id}/coach/finalize` - Complete coaching
- `POST /rooms/{id}/main-room/start` - Start main room
- `POST /rooms/{id}/main-room/respond` - Send main room message
- `GET /rooms/{id}/main-room/messages` - Get messages (polling)
- `POST /rooms/{id}/request-break` - Request break
- `POST /rooms/{id}/clear-break` - Clear break
- `POST /rooms/{id}/generate-report` - Generate PDF report

## Database Patterns

### User1/User2 Identification

**CRITICAL:** Determine User1 by earliest `pre_mediation` turn, NOT by participant array order:

```python
first_turn = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.context == "pre_mediation"
).order_by(Turn.created_at.asc()).first()

user1_id = first_turn.user_id
user1 = next((p for p in participants if p.id == user1_id))
user2 = next((p for p in participants if p.id != user1_id))
```

### Context Separation

**CRITICAL:** Always filter turns by `context`:

```python
# Coaching history (User 1 only)
coaching_turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.user_id == user1.id,
    Turn.context == "pre_mediation"
).all()

# Main room messages (both users)
main_turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.context == "main"
).all()
```

### PostgreSQL Compatibility

**JSON Queries:**
Use `cast()` instead of `.contains()`:

```python
# ❌ WRONG - Fails on PostgreSQL
Turn.tags.contains("feeling")

# ✅ CORRECT
cast(Turn.tags, String).like('%feeling%')
```

## Integration Points

### Stripe (Payments)

**Payment-First Flow:**
1. User clicks "Get Plus/Pro" (no account required)
2. Stripe embedded checkout collects email + payment
3. Webhook creates User account on success
4. Success page prompts OAuth sign-in

**Webhook:** `/subscriptions/webhook`
- Event: `checkout.session.completed`
- Creates user with temporary password
- Creates subscription record
- Updates tier limits

### SendGrid (Email)

**Notifications:**
- Turn notifications: "{Name} has responded"
- Break notifications: "{Name} requested a break"

**Status:** Disabled by default (`EMAIL_NOTIFICATIONS_ENABLED=false`)

**Graceful Failure:** Try/except prevents email errors from breaking API

### Telegram (Integration)

**OAuth Login:**
- Widget-based login (react-telegram-login)
- HMAC signature verification
- Synthetic email: `telegram_{id}@telegram.meedi8.com`

**Contacts & Folders:**
- Telethon library for Telegram Client API
- Lazy loading: Folders load on-demand
- Server-side filtering by `folder_id`

### S3 (File Storage)

**Paths:**
- Voice: `voice-recordings/{room_id}/{turn_id}.webm`
- Attachments: `attachments/{room_id}/{turn_id}-{filename}`
- Reports: `reports/{room_id}/professional-report-{timestamp}.pdf`

**Permissions:** Pre-signed URLs for download (1 hour expiry)

## Deployment Architecture

**Frontend (Vercel):**
- Auto-deploys from `main` branch
- Environment variables set in dashboard
- CDN distribution globally
- Automatic SSL certificates

**Backend (Railway):**
- Auto-deploys from `main` branch
- Dockerfile-based build
- PostgreSQL database included
- Environment variables in dashboard
- Health check: `/health` endpoint

**Database Migrations:**
- Alembic auto-applies on Railway deploy
- Migration files in `backend/migrations/versions/`
- Rollback via `alembic downgrade -1`

## Performance Characteristics

**AI Response Times:**
- Coaching messages: 3-8 seconds
- Main room messages: 3-8 seconds
- Image analysis: 2-4 seconds
- PDF report generation: 10-15 seconds

**Polling Overhead:**
- Main room: ~1 request per user per 3 seconds
- Acceptable for expected scale (100-1000 concurrent users)

**Cost Per Mediation:**
- AI tokens: ~$0.50-$1.50 (Claude API)
- Voice transcription: ~$0.10-$0.30 (Whisper API)
- Image analysis: ~$0.01-$0.03 per image (Claude Vision)
- PDF report: ~$0.03-$0.05 (Claude API)
- Email notifications: ~$0.01-$0.02 (SendGrid)
- Total: ~$0.65-$2.00 per mediation

## Security Considerations

**Authentication:**
- JWT tokens (24 hour expiry)
- OAuth-only (no password auth except Stripe-created users)
- HMAC signature verification (Telegram)

**Authorization:**
- Room access restricted to participants only
- Phase-based access control
- Subscription tier enforcement (402 Payment Required)

**Data Privacy:**
- Coaching history never exposed to other participant
- Context separation prevents leaks
- Turn-by-turn ensures controlled disclosure

**CORS:**
- Whitelist specific origins (Vercel + localhost)
- Credentials enabled for cookies
- Trailing slash matching (Safari/Firefox compatibility)
