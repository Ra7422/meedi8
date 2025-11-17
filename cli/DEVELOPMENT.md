# Development Guide

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### First-Time Setup

**Backend:**
```bash
cd backend
./run.sh  # Auto-creates venv, installs deps, runs uvicorn
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

**Environment Files:**
- Copy `backend/.env.example` to `backend/.env` (add API keys)
- Copy `frontend/.env.example` to `frontend/.env.local` (add OAuth IDs)

## Development Commands

### Backend (FastAPI)

**Run Server:**
```bash
cd backend
source .venv/bin/activate       # Activate virtual environment
python -m uvicorn app.main:app --reload  # Run with hot reload on :8000
```

**Database Migrations (Alembic):**
```bash
cd backend
source .venv/bin/activate

# Create migration
alembic revision --autogenerate -m "description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history

# Manually set revision (if migration partially applied)
alembic stamp <revision_hash>
```

**Testing:**
```bash
# Run email test
python backend/test_email.py

# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/debug/database
```

### Frontend (React + Vite)

**Development Server:**
```bash
cd frontend
npm run dev         # Start Vite dev server on :5173
```

**Build & Production:**
```bash
npm run build       # Production build (outputs to dist/)
npm run preview     # Preview production build locally
npm run lint        # Run ESLint
```

**Figma Export (Design Assets):**
```bash
npm run export-figma            # Export Figma designs to assets/
npm run export-figma:browser    # Browser-based export
npm run export-figma:debug      # Debug mode with visible browser
npm run test:visual             # Visual comparison tests
```

### Docker (Optional)

**Full Stack with PostgreSQL:**
```bash
# From project root
docker-compose up -d            # Start PostgreSQL + Redis + Backend
docker-compose down             # Stop all services
docker-compose logs -f backend  # View backend logs

# Run migrations inside Docker
docker exec -it cleanair_backend alembic revision --autogenerate -m "add feature"
docker exec -it cleanair_backend alembic upgrade head

# Access PostgreSQL
docker exec -it cleanair_postgres psql -U postgres -d meedi
```

**Note:** Most developers use SQLite for local dev (simpler, no Docker needed). Docker setup mainly for testing PostgreSQL-specific features.

## Development Workflow

### Making Changes

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/description
   ```

2. **Make Changes:**
   - Backend: Edit files in `backend/app/`
   - Frontend: Edit files in `frontend/src/`
   - Test locally (backend on :8000, frontend on :5173)

3. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin feature/description
   ```

5. **Deploy:**
   - Merge to `main` branch
   - Vercel auto-deploys frontend
   - Railway auto-deploys backend

### Database Schema Changes

1. **Update Model:**
   ```python
   # backend/app/models/room.py
   class Room(Base):
       new_field = Column(String, nullable=True)
   ```

2. **Create Migration:**
   ```bash
   cd backend
   alembic revision --autogenerate -m "add new_field to room"
   ```

3. **Review Generated Migration:**
   ```bash
   # Check backend/migrations/versions/YYYYMMDD_add_new_field.py
   # Verify upgrade() and downgrade() functions
   ```

4. **Apply Locally:**
   ```bash
   alembic upgrade head
   ```

5. **Test:**
   - Restart backend server
   - Verify field appears in database
   - Test API endpoints

6. **Deploy:**
   - Commit migration file
   - Push to GitHub
   - Railway auto-applies migration on deploy

## Code Organization

### Backend Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── models/              # SQLAlchemy models
│   │   ├── room.py          # Room, Turn models
│   │   └── user.py          # User, Subscription models
│   ├── routes/              # API endpoints
│   │   ├── rooms.py         # Room CRUD, mediation endpoints
│   │   ├── auth.py          # OAuth endpoints
│   │   └── subscriptions.py # Stripe integration
│   ├── services/            # Business logic
│   │   ├── pre_mediation_coach.py  # Individual coaching AI
│   │   ├── main_room_mediator.py   # Joint mediation AI
│   │   ├── email_service.py        # SendGrid integration
│   │   ├── whisper_service.py      # Voice transcription
│   │   └── s3_service.py           # File storage
│   └── middleware/          # Request interceptors
│       └── rate_limit.py    # Subscription enforcement
├── migrations/              # Alembic migrations
│   └── versions/            # Migration files
├── .env                     # Environment variables (not committed)
└── requirements.txt         # Python dependencies
```

### Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx             # React app entry point
│   ├── App.jsx              # Router and providers
│   ├── pages/               # Route components
│   │   ├── LoginNew.jsx     # OAuth login
│   │   ├── CoachingChat.jsx # Individual coaching
│   │   ├── MainRoom.jsx     # Joint mediation
│   │   ├── Subscription.jsx # Stripe checkout
│   │   └── TelegramConnect.jsx  # Telegram integration
│   ├── components/          # Reusable components
│   │   ├── FloatingMenu.jsx # Navigation menu
│   │   └── VoiceRecorder.jsx    # Audio capture
│   ├── context/             # React Context
│   │   └── AuthContext.jsx  # User state management
│   └── api/                 # API clients
│       └── client.js        # Authenticated request wrapper
├── public/                  # Static assets
│   └── assets/
│       └── illustrations/   # Meedi8 branded images
└── .env.local               # Environment variables (not committed)
```

## Testing Locally

### Full Mediation Flow

1. **Start Services:**
   ```bash
   # Terminal 1: Backend
   cd backend && ./run.sh

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Create Room:**
   - Navigate to http://localhost:5173
   - Login with OAuth (Google/Facebook/Telegram)
   - Click "Start Mediation"
   - Complete screening questions

3. **User 1 Coaching:**
   - Answer AI coach questions
   - Build NVC perspective
   - Submit when ready

4. **User 2 Join:**
   - Copy invite link
   - Open in incognito window
   - Login with different OAuth account
   - Complete coaching

5. **Main Room:**
   - Both users enter joint mediation
   - Test turn-taking
   - Test file upload
   - Test voice messages (if configured)
   - Test break feature

6. **Resolution:**
   - Reach agreement
   - Generate PDF report
   - Verify report downloads

### Testing Individual Features

**OAuth Login:**
```bash
# Visit login page
open http://localhost:5173/login

# Check browser console for errors
# Verify token stored in AuthContext
```

**API Endpoints:**
```bash
# Health check
curl http://localhost:8000/health

# Get user data (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/auth/me

# List rooms
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/rooms/
```

**Database Inspection:**
```bash
# SQLite (local dev)
sqlite3 backend/meedi.db
.tables
SELECT * FROM users;

# PostgreSQL (Docker)
docker exec -it cleanair_postgres psql -U postgres -d meedi
\dt
SELECT * FROM users;
```

## Common Development Tasks

### Adding a New Route

1. **Define Route:**
   ```python
   # backend/app/routes/rooms.py
   @router.get("/my-endpoint")
   async def my_endpoint(db: Session = Depends(get_db)):
       return {"message": "Hello"}
   ```

2. **Register Route:**
   ```python
   # backend/app/main.py (already registered)
   app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
   ```

3. **Test Locally:**
   ```bash
   curl http://localhost:8000/rooms/my-endpoint
   ```

### Adding a New Page

1. **Create Component:**
   ```jsx
   // frontend/src/pages/MyPage.jsx
   export default function MyPage() {
     return <div>My Page</div>
   }
   ```

2. **Add Route:**
   ```jsx
   // frontend/src/App.jsx
   import MyPage from './pages/MyPage'

   <Route path="/my-page" element={<MyPage />} />
   ```

3. **Test:**
   ```bash
   open http://localhost:5173/my-page
   ```

### Adding Environment Variable

1. **Backend:**
   ```bash
   # backend/.env
   MY_API_KEY=secret_value
   ```

2. **Use in Code:**
   ```python
   import os
   api_key = os.getenv("MY_API_KEY")
   ```

3. **Deploy:**
   - Add to Railway environment variables
   - Restart service

4. **Frontend:**
   ```bash
   # frontend/.env.local
   VITE_MY_CONFIG=value
   ```

5. **Use in Code:**
   ```javascript
   const config = import.meta.env.VITE_MY_CONFIG
   ```

6. **Deploy:**
   - Add to Vercel environment variables
   - Trigger redeploy

## Hot Reload & Auto-Refresh

**Backend:**
- Uvicorn watches `app/` directory
- Auto-reloads on `.py` file changes
- Database migrations require manual `alembic upgrade head`

**Frontend:**
- Vite watches `src/` directory
- Hot Module Replacement (HMR) for instant updates
- No page refresh needed for most changes

## Debugging Tips

**Backend Errors:**
```bash
# Check server logs
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --log-level debug

# Use Python debugger
import pdb; pdb.set_trace()  # Add to code
```

**Frontend Errors:**
```javascript
// Browser console
console.log('Debug:', data)

// React DevTools (Chrome extension)
// Inspect component state and props
```

**Database Issues:**
```bash
# Check migration status
alembic current

# Show pending migrations
alembic history

# Force stamp to specific revision
alembic stamp <revision>
```

## Performance Optimization

**Backend:**
- Use database indexes for frequent queries
- Implement caching (Redis) for expensive operations
- Profile slow endpoints with `cProfile`

**Frontend:**
- Use React.memo() for expensive components
- Implement code splitting with React.lazy()
- Optimize images (WebP format, lazy loading)

## Code Quality

**Python (Backend):**
```bash
# Format code
black backend/app/

# Lint
flake8 backend/app/

# Type checking
mypy backend/app/
```

**JavaScript (Frontend):**
```bash
# Lint
npm run lint

# Format
npx prettier --write src/
```

## Resources

- FastAPI Docs: https://fastapi.tiangolo.com
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
- Alembic Docs: https://alembic.sqlalchemy.org
