# Meedi8 - AI-Powered Conflict Mediation Platform

Transform conflict into understanding with **Meedi**, your friendly, unbiased AI mediator.

## Project Overview

Meedi8 is a platform that helps people resolve conflicts through:
- **Mediation Sessions**: Two-person mediation with Meedi as your AI mediator
- **Solo Sessions**: Individual coaching to process thoughts and feelings

Built with React (frontend) and FastAPI (backend), using Nonviolent Communication (NVC) principles.

## Quick Start

### Backend Setup

```bash
cd backend
./run.sh  # Auto-creates venv, installs deps, runs server
```

Backend runs on: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Project Structure

```
Meedi8/
├── backend/          # FastAPI backend
│   ├── app/         # Application code
│   ├── migrations/  # Database migrations
│   └── run.sh       # Quick start script
├── frontend/        # React + Vite frontend
│   ├── src/        # Source code
│   └── public/     # Static assets
├── CLAUDE.md       # Development guide for Claude Code
└── docker-compose.yml  # Optional Docker setup
```

## Key Features

- OAuth authentication (Google, Facebook, Telegram)
- Multi-phase mediation flow with NVC coaching
- Voice message support with Whisper transcription
- Subscription tiers (Free, Plus, Pro)
- Clinical screening for safety
- Real-time session management

## Environment Variables

### Backend `.env`
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
TELEGRAM_BOT_TOKEN=
DATABASE_URL=  # Optional (defaults to SQLite)
```

### Frontend `.env.local`
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=
VITE_FACEBOOK_APP_ID=
VITE_TELEGRAM_BOT_NAME=
```

## Tech Stack

**Frontend:**
- React 18
- React Router v6
- Vite
- Inline CSS-in-JS styling

**Backend:**
- FastAPI
- SQLAlchemy
- Alembic (migrations)
- Anthropic Claude API
- OpenAI Whisper API
- Stripe payments

**Design:**
- Color scheme: Teal (#7DD3C0) & Purple (#6750A4, #D3C1FF)
- Font: Nunito
- Purple/teal themed throughout

## Documentation

- `CLAUDE.md` - Comprehensive development guide
- `SCREENING_IMPLEMENTATION.md` - Clinical screening system docs

## License

Proprietary
