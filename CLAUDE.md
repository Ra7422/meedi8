# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Documentation Structure

**All detailed documentation has been moved to the `/cli/` directory** for better organization and AI context management. Each file is under 400 lines for optimal AI processing.

### Start Here
- **[cli/README.md](cli/README.md)** - Documentation index and quick reference
- **[cli/STATUS.md](cli/STATUS.md)** - Current project status and recent updates
- **[cli/TODO.md](cli/TODO.md)** - Active tasks, blockers, and priorities
- **[cli/ADMIN_DASHBOARD_TODO.md](cli/ADMIN_DASHBOARD_TODO.md)** - Admin dashboard enhancement tasks

### Development Guides
- **[cli/DEVELOPMENT.md](cli/DEVELOPMENT.md)** - Local setup, commands, and workflows
- **[cli/CLI_TOOLS.md](cli/CLI_TOOLS.md)** - External CLI tools (Railway, Vercel, etc.)
- **[cli/ARCHITECTURE.md](cli/ARCHITECTURE.md)** - System architecture and data models
- **[cli/PATTERNS.md](cli/PATTERNS.md)** - Critical coding patterns (MUST READ)
- **[cli/TROUBLESHOOTING.md](cli/TROUBLESHOOTING.md)** - Common issues and debugging

## Quick Reference

**What's Meedi8?**
An AI-powered mediation platform that guides users through conflict resolution using Nonviolent Communication (NVC) principles.

**Tech Stack:**
- Frontend: React + Vite (Vercel)
- Backend: FastAPI (Railway)
- Database: PostgreSQL (prod) / SQLite (dev)
- AI: Claude Sonnet 4.5 (Anthropic) + Gemini File Search (Google)

**Production URLs:**
- Frontend: https://meedi8.vercel.app
- Backend: https://meedi8-production.up.railway.app

**Current Status:** See [cli/STATUS.md](cli/STATUS.md)

## Most Important Files (Read These First)

1. **[cli/PATTERNS.md](cli/PATTERNS.md)** - Critical patterns that prevent bugs:
   - SSR Safety (Vercel crashes)
   - Trailing Slash (Safari/Firefox 401 errors)
   - User1/User2 Identification
   - Context Separation
   - PostgreSQL JSON queries

2. **[cli/STATUS.md](cli/STATUS.md)** - Current project state:
   - Latest stable commit
   - Active issues (Telegram folders)
   - Recent updates
   - Deployment status

3. **[cli/TODO.md](cli/TODO.md)** - What needs to be done:
   - Urgent blockers
   - High priority tasks
   - Future enhancements

## Project Overview

### Mediation Flow Phases

The system guides two users through a sequential multi-phase flow:

1. **user1_intake** → User 1 describes the conflict
2. **user1_coaching** → AI coaches User 1 through NVC framework
3. **user2_lobby** → User 1 waits for User 2 to join
4. **user2_coaching** → AI coaches User 2 (sees User 1's summary)
5. **main_room** → Both users in joint mediation with turn-taking
6. **resolved** → Mediation complete with agreement

See [cli/ARCHITECTURE.md](cli/ARCHITECTURE.md) for full details.

### Key Features

✅ Multi-provider OAuth (Google, Facebook, Telegram)
✅ Individual NVC coaching for both participants
✅ Joint mediation with AI moderator
✅ Strict turn-by-turn conversation flow
✅ Harsh language intervention (direct confrontation)
✅ File attachments with AI image analysis
✅ Voice messages with Whisper transcription
✅ Break/pause feature with real-time sync
✅ Stripe payment-first checkout
✅ Tiered subscriptions (FREE/PLUS/PRO)
✅ Professional PDF report generation
✅ Email notifications (SendGrid)
✅ Telegram integration with folder filtering

See [cli/STATUS.md](cli/STATUS.md) for deployment status.

## Development Commands

### Quick Start
```bash
# Backend (from backend/)
./run.sh  # Auto-setup and run on :8000

# Frontend (from frontend/)
npm run dev  # Run on :5173
```

See [cli/DEVELOPMENT.md](cli/DEVELOPMENT.md) for complete guide.

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Deployment
```bash
# Push to main branch → auto-deploys to Railway + Vercel
git push origin main
```

See [cli/CLI_TOOLS.md](cli/CLI_TOOLS.md) for all CLI commands.

## Critical Patterns (Must Follow)

### SSR Safety
```javascript
// ❌ WRONG - Crashes Vercel
const isMobile = window.innerWidth < 768;

// ✅ CORRECT
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

### User1/User2 Identification
```python
# ❌ WRONG - Uses database ID order
user1 = participants[0]

# ✅ CORRECT - Uses chronological coaching start
first_turn = db.query(Turn).filter(
    Turn.context == "pre_mediation"
).order_by(Turn.created_at.asc()).first()
user1_id = first_turn.user_id
```

### Context Separation
```python
# ❌ WRONG - Gets all turns
all_turns = db.query(Turn).filter(Turn.room_id == room_id).all()

# ✅ CORRECT - Separate coaching from main room
coaching_turns = db.query(Turn).filter(
    Turn.room_id == room_id,
    Turn.context == "pre_mediation"  # CRITICAL
).all()
```

See [cli/PATTERNS.md](cli/PATTERNS.md) for all critical patterns.

## Troubleshooting

**Common Issues:**
- Pages blank on Vercel → SSR crash (add window checks)
- Safari/Firefox 401 errors → Trailing slash mismatch
- Wrong user summaries → User1/User2 identification bug
- OAuth crashes → Conditional rendering needed

See [cli/TROUBLESHOOTING.md](cli/TROUBLESHOOTING.md) for complete guide.

## Environment Variables

**Backend (.env):**
```
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
DATABASE_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SENDGRID_API_KEY=
```

**Frontend (.env.local):**
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=
VITE_FACEBOOK_APP_ID=
VITE_TELEGRAM_BOT_NAME=
```

All environment variables documented with examples in `/cli/` directory.

## File Organization

**Backend:**
```
backend/
├── app/
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic & AI
│   ├── models/       # Database models
│   └── middleware/   # Request interceptors
├── migrations/       # Alembic migrations
└── requirements.txt  # Python dependencies
```

**Frontend:**
```
frontend/
├── src/
│   ├── pages/        # Route components
│   ├── components/   # Reusable UI
│   ├── context/      # State management
│   └── api/          # API client
└── public/assets/    # Static files
```

See [cli/ARCHITECTURE.md](cli/ARCHITECTURE.md) for details.

## Key Files Reference

**Backend Core:**
- `app/main.py` - FastAPI app entry
- `app/routes/rooms.py` - Mediation endpoints
- `app/services/pre_mediation_coach.py` - NVC coaching AI
- `app/services/main_room_mediator.py` - Joint mediation AI

**Frontend Core:**
- `src/pages/CoachingChat.jsx` - Individual coaching
- `src/pages/MainRoom.jsx` - Joint mediation
- `src/pages/LoginNew.jsx` - OAuth login
- `src/context/AuthContext.jsx` - User state

**Database:**
- `backend/migrations/versions/` - Migration files
- `backend/alembic.ini` - Alembic config

## Getting Help

**Documentation:** Check `/cli/` directory first

**External Resources:**
- FastAPI Docs: https://fastapi.tiangolo.com
- React Docs: https://react.dev
- Anthropic Docs: https://docs.anthropic.com

**Issues:**
- Claude Code: https://github.com/anthropics/claude-code/issues
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support

## Recent Updates

See [cli/STATUS.md](cli/STATUS.md) for detailed changelog.

**Latest (2025-11-17):**
- ✅ Fixed 402 paywall error (active room counting)
- ✅ Telegram import modal with compact UI
- ✅ Message preview with eye icon
- 🚧 **IN PROGRESS:** Gemini File Search integration for RAG
  - Hybrid AI: Gemini for document analysis, Claude for mediation
  - Free persistent storage, automatic chunking/indexing
  - Cost: ~$0.004 per Telegram analysis

**Stable Deployment:** d00acb6d-9db0-4e57-a6f9-f78a0d5d9173

**Previous:**
- Telegram lazy loading for folder tabs (2025-11-15)
- Stripe payment-first checkout (2025-11-13)
- Email notifications with SendGrid (2025-11-13)
- Professional PDF reports (2025-11-12)
- File attachments with AI analysis (2025-11-11)

## Contributing

1. Create feature branch: `git checkout -b feature/description`
2. Make changes and test locally
3. Commit: `git commit -m "Description"`
4. Push: `git push origin feature/description`
5. Merge to `main` → auto-deploys to production

## Hybrid AI Architecture (Gemini + Claude)

### Overview
Meedi8 uses a **hybrid AI approach** to optimize cost and quality:
- **Gemini File Search**: Document analysis, chunking, indexing (cheap, fast)
- **Claude Sonnet 4.5**: Emotional mediation, coaching (expensive, high-quality)

### Data Flow
```
User uploads Telegram/files
  ↓
Gemini File Search (upload, chunk, index, store)
  ↓
Gemini analyzes (themes, patterns, triggers)
  ↓
Store insights in PostgreSQL Turn.metadata
  ↓
Claude receives context from PostgreSQL
  ↓
Claude generates mediation with enriched context
```

### Why Hybrid?
- **Cost**: Gemini analysis = $0.004, Claude mediation = $0.10
- **Storage**: Gemini File Search = FREE (up to 1 TB)
- **Quality**: Claude superior for emotional intelligence
- **Efficiency**: Gemini handles large files, Claude handles conversation

### Implementation Details
See [GEMINI_RAG_API.md](GEMINI_RAG_API.md) for complete architecture guide.

**Key Services:**
- `backend/app/services/gemini_rag_service.py` - File Search integration
- `backend/app/services/pre_mediation_coach.py` - Claude with Gemini context
- `backend/app/services/main_room_mediator.py` - Claude with Gemini context

## Notes for AI Assistants

- **Start with [cli/STATUS.md](cli/STATUS.md)** to understand current state
- **Check [cli/TODO.md](cli/TODO.md)** for pending work
- **Reference [cli/PATTERNS.md](cli/PATTERNS.md)** for critical conventions
- **Use [cli/TROUBLESHOOTING.md](cli/TROUBLESHOOTING.md)** for debugging
- **Review [GEMINI_RAG_API.md](GEMINI_RAG_API.md)** for hybrid AI architecture
- All files under 400 lines for optimal context management
- Each file is self-contained with cross-references
