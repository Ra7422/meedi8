# Meedi8 Architecture

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (prod) / SQLite (dev)
- **ORM:** SQLAlchemy + Alembic
- **Hosting:** Railway
- **AI:** Claude Sonnet 4.5 + Gemini File Search

### Frontend
- **Framework:** React + Vite
- **Hosting:** Vercel
- **State:** React Context (Auth, Gamification)

### Services
- **Payments:** Stripe
- **Email:** SendGrid
- **Storage:** AWS S3
- **Auth:** Google, Facebook, Telegram OAuth

---

## Database Schema

### Core Tables
- `users` - User accounts
- `rooms` - Mediation sessions
- `turns` - Conversation messages
- `subscriptions` - Payment/tier info

### Gamification Tables
- `user_progress` - Health score, streaks, stats
- `score_events` - Score change history
- `gratitude_entries` - Journal entries
- `breathing_sessions` - Exercise logs
- `emotional_checkins` - Mood tracking
- `achievements` - Badge definitions
- `user_achievements` - Earned badges
- `daily_challenges` - Challenge definitions
- `user_daily_challenges` - User progress
- `conversion_events` - PRO conversion tracking

---

## API Structure

### Auth Routes (`/auth`)
- POST `/login`, `/register`, `/google`, `/facebook`, `/telegram`
- GET `/me`

### Room Routes (`/rooms`)
- GET `/my-sessions`
- POST `/create`, `/join`
- GET `/{id}`, DELETE `/{id}`

### Gamification Routes (`/gamification`)
- GET `/health-score`, `/health-score/history`
- GET `/streaks`, POST `/streaks/protect`
- GET/POST/DELETE `/journal`
- POST `/breathing/complete`, GET `/breathing/history`
- POST `/mood`, GET `/mood/history`
- POST `/daily-checkin`

---

## Mediation Flow

```
user1_intake → user1_coaching → user2_lobby → user2_coaching → main_room → resolved
```

1. **user1_intake** - User 1 describes conflict
2. **user1_coaching** - AI coaches User 1 (NVC)
3. **user2_lobby** - Waiting for User 2
4. **user2_coaching** - AI coaches User 2
5. **main_room** - Joint mediation
6. **resolved** - Agreement reached

---

## Frontend Structure

```
src/
├── api/          # API client
├── components/   # Reusable UI
│   └── gamification/
├── context/      # State providers
├── pages/        # Route components
├── styles/       # CSS
└── utils/        # Helpers
```

---

## Key Patterns

### SSR Safety (Vercel)
```javascript
// Always check window exists
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

### Trailing Slash (Safari/Firefox)
```javascript
// Include trailing slash for POST/PUT/DELETE
fetch(`${API_URL}/endpoint/`, { method: 'POST' })
```

### Context Separation
```python
# Always filter by context
turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.context == "pre_mediation"  # or "main_room"
).all()
```
