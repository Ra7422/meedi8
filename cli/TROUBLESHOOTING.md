# Troubleshooting Guide

Common issues and debugging strategies for Meedi8.

## Frontend Issues

### Pages Showing Blank on Vercel (Green Background Only)

**Symptoms:**
- Pages load but show only background color
- No content visible
- Works fine locally

**Cause:** SSR crash due to accessing browser APIs during build.

**Solution:**
Add `typeof window !== 'undefined'` checks before browser APIs:

```javascript
// Before
const isMobile = window.innerWidth < 768;

// After
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
```

**Common Culprits:**
- `window.innerWidth` / `window.innerHeight`
- `window.location` (use `useLocation()` hook instead)
- `localStorage` / `sessionStorage`
- PageHeader component accessing window.location

**Files Affected:** LoginNew.jsx, Signup.jsx, PageHeader.jsx, Onboarding.jsx, WaitingRoom.jsx, FAQ.jsx

**Debug:** Check Vercel deployment logs for "window is not defined" or "ReferenceError"

### OAuth Components Crashing

**Error:** "Google OAuth components must be used within GoogleOAuthProvider"

**Cause:** OAuth provider not wrapping app OR placeholder credentials causing validation mismatch.

**Solution:**
Ensure credentials check matches in both `main.jsx` AND component files:

```javascript
// Must match in BOTH places
const hasValidGoogleOAuth = GOOGLE_CLIENT_ID &&
                             GOOGLE_CLIENT_ID.length > 20 &&
                             !GOOGLE_CLIENT_ID.includes('YOUR_')
```

**Files to Check:**
- `frontend/src/main.jsx` - Provider wrapper
- `frontend/src/pages/LoginNew.jsx` - Component rendering

### OAuth Not Working

**Symptoms:**
- Login button doesn't work
- No response from OAuth provider
- CORS errors in console

**Debug Steps:**
1. Check authorized domains in OAuth provider console match deployment URL
2. Verify environment variables set in Vercel (not just local .env)
3. Check browser console for CORS errors
4. Test with different OAuth provider (Google vs Facebook)

**Common Issues:**
- `http://` vs `https://` mismatch
- `localhost:5173` not in authorized domains
- Missing redirect URI in provider console

## Backend Issues

### Safari/Firefox 401 Errors (Chrome Works Fine)

**Symptoms:**
- `/auth/me` succeeds
- Other endpoints return 401 Unauthorized
- Only happens in Safari 16.3+ or Firefox 112+
- Chrome works perfectly

**Cause:** Trailing slash mismatch causing 308 redirect that strips Authorization header (Safari/Firefox follow 2024 Fetch Standard).

**Debug:**
1. Check Network tab for 308 redirects before 401
2. Look for mismatched URLs: frontend `/rooms` vs backend `/rooms/`

**Solution:**
Match frontend API calls to backend route definitions exactly:

```javascript
// If backend has: @router.get("/")
await apiRequest('/rooms/', 'GET', null, token);  // WITH slash
```

**Prevention:** See PATTERNS.md "Trailing Slash Pattern" for details.

### Turn-Taking Issues in MainRoom

**Symptoms:**
- User can't send message ("Not your turn")
- Wrong person able to speak
- AI addressing wrong person

**Debug Steps:**
1. Check `current_speaker_id` matches requesting user
2. Verify AI assigns `next_speaker_id` after each message
3. Check frontend polling (Network tab for `/main-room/messages` every 3s)
4. **CRITICAL:** Verify users have DISTINCT names

**Common Issue:** Duplicate names (e.g., "Adam"/"Adam") confuse AI's turn-taking. Test with clearly different names (e.g., "Dave"/"Sarah").

**Files:**
- Backend: `main_room_mediator.py:180-224` - Turn-switching logic
- Frontend: `MainRoom.jsx` - Polling and speaker state

### Summaries Showing for Wrong Users

**Symptoms:**
- "Dave's Perspective" shows Ads's content
- User 1 and User 2 switched in main room

**Cause:** User1/User2 determined incorrectly (by database ID instead of chronological order).

**Debug:**
```sql
-- Check who started coaching first
SELECT t.user_id, u.name, t.created_at
FROM turns t JOIN users u ON t.user_id = u.id
WHERE t.room_id = X AND t.context = 'pre_mediation'
ORDER BY t.created_at ASC LIMIT 5;

-- Verify summaries
SELECT id, user1_summary, user2_summary FROM rooms WHERE id = X;
```

**Fix (if summaries backwards):**
```sql
UPDATE rooms
SET user1_summary = (SELECT user2_summary FROM rooms WHERE id = X),
    user2_summary = (SELECT user1_summary FROM rooms WHERE id = X)
WHERE id = X;
```

**Prevention:** Use chronological order pattern from PATTERNS.md.

### Break Not Syncing Between Users

**Symptoms:**
- One user requests break, other doesn't see modal
- Break modal doesn't appear

**Debug:**
1. Verify polling working (Network tab for `/main-room/messages` every 3s)
2. Check `break_info` field in API response
3. Ensure break database fields exist (run migration if needed)

**Files:**
- Backend: `rooms.py:1191-1234` - Break endpoints
- Frontend: `MainRoom.jsx:92-113, 544-729` - Break modal

**Migration:** `20251107_add_break_tracking.py`

## Database Issues

### Alembic "Multiple Heads" Error

**Error:** "Multiple head revisions are present"

**Cause:** Migration created while another branch had different migration.

**Solution:**
```bash
# Check current heads
alembic heads

# Update down_revision in new migration to point to correct parent
# Edit: backend/migrations/versions/YYYYMMDD_filename.py
down_revision = 'correct_parent_hash'

# Or stamp to specific revision
alembic stamp <revision>
```

### Alembic "Duplicate Column" Error

**Error:** "column already exists"

**Cause:** Previous migration partially applied before failing.

**Solution:**
```bash
# If columns already exist in database
alembic stamp head  # Mark migration as applied without running it

# Check database schema matches migration
sqlite3 backend/meedi.db
.schema table_name
```

**Prevention:** Test migrations locally with SQLite before deploying to PostgreSQL.

### PostgreSQL JSON Query Failing

**Error:** "operator does not exist: json ~~ text"

**Cause:** Using `.contains()` on JSON column (SQLite allows this, PostgreSQL doesn't).

**Solution:**
```python
# Before
Turn.tags.contains("feeling")

# After
from sqlalchemy import cast, String
cast(Turn.tags, String).like('%feeling%')
```

**Files Affected:** Any JSON column queries in `backend/app/routes/`

## Deployment Issues

### Railway Deployment Not Picking Up Changes

**Symptoms:**
- Code committed and pushed
- Railway shows successful build
- Changes not appearing in production

**Debug:**
1. Check Railway logs for new code evidence:
   ```bash
   railway logs | grep "YOUR_LOG_MESSAGE"
   ```
2. Verify deployment SHA matches GitHub commit
3. Check Railway dashboard → Deployments → Latest

**Solutions:**
- **Option 1:** Disconnect/reconnect GitHub integration in Railway dashboard
- **Option 2:** Empty commit to trigger rebuild:
  ```bash
  git commit --allow-empty -m "Trigger Railway deployment"
  git push origin main
  ```

**Known Issue:** `railway redeploy` only restarts container, doesn't rebuild from GitHub.

### Railway CLI Docker Socket Error

**Error:** `/Users/[user]/.docker/mutagen/daemon/daemon.sock: socket can not be archived`

**Cause:** Railway CLI trying to include Docker socket file in upload archive.

**Workaround:**
1. Use GitHub integration instead (push to main)
2. Or use Railway dashboard to trigger manual deploy
3. Don't use `railway up --detach` command

### Vercel Build Failing

**Common Errors:**
- "window is not defined"
- "ReferenceError: document is not defined"
- OAuth provider errors

**Debug:**
1. Check Vercel deployment logs
2. Look for SSR-related errors
3. Test build locally: `npm run build`

**Solutions:**
- Add SSR safety checks (see PATTERNS.md)
- Conditionally render OAuth components
- Use `useLocation()` instead of `window.location`

### Environment Variables Not Working

**Symptoms:**
- Features work locally but not in production
- API keys missing errors

**Debug:**
```bash
# Check Railway env vars
railway variables

# Check Vercel env vars
vercel env ls

# Test locally with production env vars
cp backend/.env backend/.env.backup
# Add production values to backend/.env
# Test
```

**Common Issues:**
- Typo in variable name
- Missing `VITE_` prefix (frontend)
- Not redeployed after adding env var

## API Issues

### 402 Payment Required Responses

**Symptoms:**
- User can't create room
- Voice messages rejected
- "Upgrade required" messages

**Expected Behavior:** This is correct enforcement of subscription limits.

**Debug:**
```bash
# Check user's subscription
curl -H "Authorization: Bearer TOKEN" \
     https://meedi8-production.up.railway.app/auth/me

# Check limits
# FREE: 1 room/month, 0 voice
# PLUS: 5 rooms/month, 30 voice
# PRO: unlimited rooms, 300 voice
```

**Solution:** User needs to upgrade subscription at `/subscription` page.

### Phase Transition Errors

**Symptoms:**
- Can't move to next phase
- "Invalid phase" errors
- Stuck in coaching

**Debug:**
```bash
# Check current room phase
curl -H "Authorization: Bearer TOKEN" \
     https://api.example.com/rooms/{id}

# Expected phases:
# user1_intake → user1_coaching → user2_lobby → user2_coaching → main_room → resolved
```

**Common Issues:**
- Summary not finalized before moving to main room
- User 2 hasn't completed coaching yet
- Room not in correct phase for action

**Files:**
- Backend: `rooms.py` - Phase validation logic
- Frontend: Components render based on `room.phase`

## Email Issues (SendGrid)

### Emails Not Sending

**Debug Steps:**
1. Check `EMAIL_NOTIFICATIONS_ENABLED` env var (must be "true")
2. Verify `SENDGRID_API_KEY` set in Railway
3. Check SendGrid dashboard → Activity Feed
4. Look for errors in Railway logs

**Common Issues:**
- Domain not verified in SendGrid
- API key invalid or expired
- Email disabled by default (expected)

**Files:**
- `backend/app/services/email_service.py`
- `backend/test_email.py` - Testing script

### Domain Verification Pending

**Symptoms:**
- SendGrid shows "Pending Verification"
- Emails not delivered

**Solution:**
1. Add DNS records from SendGrid to Namecheap
2. Wait 24-48 hours for DNS propagation
3. Check verification status in SendGrid dashboard

**DNS Records Needed:** 3-5 CNAME records (see ENVIRONMENT.md)

## Telegram Integration Issues

### Folders Not Displaying (CURRENT ISSUE)

**Symptoms:**
- Only "All" and "No folder" tabs appear
- User has 5-6 custom folders in Telegram app

**Debug Steps:**
1. Check Railway logs for folder extraction logging:
   ```bash
   railway logs | grep -E "(folder|DialogFilters|Fetched)"
   ```
2. Test `/telegram/contacts` endpoint directly:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
        "https://meedi8-production.up.railway.app/telegram/contacts?limit=10"
   ```
3. Check if `folder_name` field present in response
4. Test locally with uvicorn to isolate deployment issue

**Possible Causes:**
- Fix didn't deploy (check logs)
- Telegram session expired (re-authenticate)
- Frontend extraction logic issue
- Backend not returning `folder_name` field

**Files:**
- Backend: `telegram_service.py:194-319` - get_dialogs method
- Frontend: `TelegramConnect.jsx:159-168` - extractFolders function

**Commits:**
- `bc4dab1` - DialogFilters fix
- `9eceea2` - Trigger deployment

## Local Development Issues

### Backend Won't Start

**Error:** "Module not found" or "Import error"

**Solution:**
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**Common Issues:**
- Virtual environment not activated
- Dependencies not installed
- Wrong Python version (need 3.10+)

### Frontend Won't Start

**Error:** "Cannot find module" or "React not defined"

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Common Issues:**
- Node modules corrupted
- Wrong Node version (need 18+)
- Port 5173 already in use

### Database Connection Errors

**SQLite (Local):**
```bash
# Check if database file exists
ls backend/meedi.db

# If missing, run migrations
cd backend
alembic upgrade head
```

**PostgreSQL (Docker):**
```bash
# Check if container running
docker ps | grep postgres

# Start containers
docker-compose up -d

# Check logs
docker-compose logs postgres
```

## Debugging Techniques

### Backend Debugging

**Add Logging:**
```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"Debug: {variable}")
logger.error(f"Error occurred: {error}")
```

**Use Python Debugger:**
```python
import pdb; pdb.set_trace()  # Add to code
# Run backend, execution will pause
# Commands: n (next), s (step), c (continue), p variable (print)
```

**Check Database State:**
```bash
# SQLite
sqlite3 backend/meedi.db
SELECT * FROM rooms WHERE id = X;

# PostgreSQL (Railway)
railway run psql $DATABASE_URL
SELECT * FROM rooms WHERE id = X;
```

### Frontend Debugging

**Browser Console:**
```javascript
console.log('Debug:', data);
console.table(array);  // Pretty table
console.trace();       // Stack trace
```

**React DevTools:**
- Install Chrome extension
- Inspect component state and props
- View component tree

**Network Tab:**
- Check API requests/responses
- Look for 308 redirects (trailing slash issue)
- Verify auth headers present

### Production Debugging

**Railway Logs:**
```bash
# View live logs
railway logs

# Filter for errors
railway logs | grep ERROR

# Save to file
railway logs > logs.txt
```

**Vercel Logs:**
```bash
# View logs
vercel logs meedi8.vercel.app

# Filter by time
vercel logs --since 1h
```

**Health Checks:**
```bash
# Backend health
curl https://meedi8-production.up.railway.app/health

# Database check
curl https://meedi8-production.up.railway.app/debug/database

# Environment check
curl https://meedi8-production.up.railway.app/debug/env
```

## When All Else Fails

### Rollback to Stable Commit

```bash
# Check recent commits
git log --oneline -10

# Rollback to specific commit
git revert HEAD~2..HEAD

# Or checkout stable commit
git checkout bfd9e59
git checkout -b rollback-to-bfd9e59
git push origin rollback-to-bfd9e59
```

**Stable Commits:**
- `bfd9e59` (2025-11-15) - Telegram design system
- `25fe58c` (2025-11-14) - Telegram foundation
- `c5cfd7b` (2025-11-12) - PDF reports + harsh language

### Fresh Database

**SQLite (Local):**
```bash
rm backend/meedi.db
alembic upgrade head
```

**PostgreSQL (Railway):**
- Provision new database in Railway dashboard
- Update `DATABASE_URL` env var
- Migrations auto-apply on next deploy

### Contact Support

**Railway:** https://railway.app/help
**Vercel:** https://vercel.com/support
**Stripe:** https://support.stripe.com
**SendGrid:** https://support.sendgrid.com

**GitHub Issues:** https://github.com/anthropics/claude-code/issues (for Claude Code)
