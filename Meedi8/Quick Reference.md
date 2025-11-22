# Quick Reference

## Commands

### Local Development
```bash
# Backend
cd backend && ./run.sh

# Frontend
cd frontend && npm run dev
```

### Database
```bash
# Create migration
cd backend && .venv/bin/alembic revision --autogenerate -m "description"

# Run migrations
cd backend && .venv/bin/alembic upgrade head

# Rollback
cd backend && .venv/bin/alembic downgrade -1
```

### Deployment
```bash
# Auto-deploys on push to main
git add . && git commit -m "message" && git push origin main

# Check Railway logs
railway logs
```

---

## URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | https://meedi8.vercel.app | https://meedi8-production.up.railway.app |
| Local | http://localhost:5173 | http://localhost:8000 |

---

## API Endpoints

### Gamification
```
GET  /gamification/health-score
GET  /gamification/health-score/history
GET  /gamification/streaks
POST /gamification/streaks/protect
GET  /gamification/journal
POST /gamification/journal
DELETE /gamification/journal/{id}
POST /gamification/breathing/complete
GET  /gamification/breathing/history
POST /gamification/mood
GET  /gamification/mood/history
POST /gamification/daily-checkin
```

---

## Key Files

### Backend
- `app/main.py` - FastAPI entry
- `app/routes/gamification.py` - Gamification API
- `app/models/gamification.py` - Database models
- `app/services/` - Business logic

### Frontend
- `src/App.jsx` - Routes and providers
- `src/context/GamificationContext.jsx` - Gamification state
- `src/components/gamification/` - UI components
- `src/pages/SessionsDashboard.jsx` - Main dashboard

---

## Scoring

| Action | Points |
|--------|--------|
| Breathing exercise | +5 |
| Gratitude entry | +3 |
| Mood check-in | +2 |
| Daily check-in | +2 |
| Mediation resolution | +15 |
| 7-day streak | +10 |
| 14-day streak | +15 |
| 30-day streak | +25 |
| 60-day streak | +40 |
| 90-day streak | +60 |
| Inactivity (7 days) | -5 |

---

## Tiers

| Tier | Score Range | Color |
|------|-------------|-------|
| Bronze | 0-39 | #CD7F32 |
| Silver | 40-69 | #C0C0C0 |
| Gold | 70-89 | #FFD700 |
| Platinum | 90-100 | #E5E4E2 |
