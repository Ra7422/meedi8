# Current Development Status

**Last Updated:** 2025-11-16

## Latest Stable State

**Commit:** `bfd9e59` (2025-11-15)

**Deployed:**
- Frontend: Vercel (auto-deploy from `main`)
- Backend: Railway (auto-deploy from `main`)

**What's Working:**
✅ User authentication (Google, Facebook, Telegram OAuth)
✅ Screening flow with bypass for returning users
✅ Individual coaching (pre-mediation) for both users
✅ Main room mediation with strict turn-by-turn
✅ Harsh language intervention (direct confrontation pattern)
✅ File attachments (images + documents) with AI analysis
✅ Voice messages with Whisper transcription
✅ Break/pause feature synchronized between users
✅ Stripe payment-first checkout (no account required)
✅ Subscription tiers (FREE/PLUS/PRO) with usage limits
✅ Email notifications (SendGrid - disabled by default)
✅ Professional PDF report generation
✅ Telegram integration with lazy loading folders
✅ PostgreSQL compatibility (Railway) + SQLite (local dev)

## Current Issues

### ⚠️ PAUSED - Telegram Folders Not Displaying (2025-11-15)

**Problem:** User's custom Telegram folders (Top G, Safeguard, House, Depin, etc.) are NOT showing on TelegramConnect page. Only "All" and "No folder" tabs appear.

**What We Know:**
- Backend bug fixed in commit `bc4dab1` (DialogFilters iteration bug)
- Fix deployed to Railway via disconnect/reconnect GitHub integration
- Service health check passing
- Frontend still only showing 2 tabs instead of 7-8

**Next Steps When Resuming:**
1. Verify Railway logs contain new folder extraction logging
2. Test `/telegram/contacts` endpoint directly with auth token
3. Check if `folder_name` field is present in API response
4. Test locally with `uvicorn` to isolate issue
5. Consider re-authenticating Telegram session

See `TROUBLESHOOTING.md` for full debugging context.

## Recent Updates (Last 30 Days)

### 2025-11-15 - Telegram UX Improvements
- **Lazy Loading:** Folder tabs load contacts on-demand (commit `76dcf1c`)
- **Bug Fix:** Fixed folder_id backend bug (commit `8439d85`)
- **Design System:** Applied official Telegram blue colors and fonts (commit `bfd9e59`)

### 2025-11-14 - Telegram Foundation & Subscription UX
- **Telethon Library:** Installed for future group chat monitoring (commit `25fe58c`)
- **Profile Pictures:** Added to FloatingMenu Profile button (commit `0f17eb2`)
- **Stripe Loading Spinner:** Better payment flow UX (commit `e858e27`)

### 2025-11-13 - Paywall & Email System
- **Payment-First Checkout:** Users can pay before creating account (commit `ec84a73`)
- **Usage Limits:** Room creation limits by tier (commit `ff3df8d`)
- **Email Notifications:** SendGrid integration (disabled by default) (commit `f9825c3`)

### 2025-11-12 - Reports & Interventions
- **PDF Reports:** Professional therapist-style reports (commit `c5cfd7b`)
- **Harsh Language:** Direct confrontation intervention pattern (commit `ee70883`)

### 2025-11-11 - File Attachments
- **File Uploads:** Images, PDFs, documents in main room (commit `5a825ba`)
- **AI Image Analysis:** Claude Vision API integration (commit `6774563`)

## Pending Work

See `TODO.md` for detailed task list.

**High Priority:**
- Fix Telegram folders display issue
- Configure custom domain DNS (meedi8.com)
- Enable email notifications after DNS setup

**Medium Priority:**
- Implement file upload size limits by tier
- Add frontend 402 payment required handling
- Professional report limits for PRO tier

**Future Enhancements:**
- Telegram group chat monitoring (pending privacy strategy)
- Browser push notifications (FCM/OneSignal)
- SMS notifications as premium feature (Twilio)

## Version History

| Date | Commit | Description |
|------|--------|-------------|
| 2025-11-15 | `9eceea2` | Trigger Railway deployment - DialogFilters fix |
| 2025-11-15 | `bc4dab1` | Fix DialogFilters iteration bug |
| 2025-11-15 | `8439d85` | Fix critical bug: Return dialog's folder_id |
| 2025-11-15 | `76dcf1c` | Implement lazy loading for Telegram folders |
| 2025-11-15 | `bfd9e59` | Apply Telegram design system |
| 2025-11-14 | `25fe58c` | Add Telethon dependency |
| 2025-11-14 | `0f17eb2` | Fix profile picture in FloatingMenu |
| 2025-11-14 | `e858e27` | Add Meedi illustration to Subscription page |
| 2025-11-13 | `ec84a73` | Enable wallet payment methods |
| 2025-11-13 | `ff3df8d` | Implement room creation paywall |
| 2025-11-13 | `f9825c3` | Add email notification system |
| 2025-11-12 | `c5cfd7b` | Add professional PDF report generation |
| 2025-11-12 | `ee70883` | Enforce strict turn-by-turn intervention |

## Deployment Status

**Frontend (Vercel):**
- Auto-deploys from `main` branch
- Build time: ~2-3 minutes
- SSR-safe checks required for all browser APIs

**Backend (Railway):**
- Auto-deploys from `main` branch
- Build time: ~8-10 seconds (Dockerfile)
- PostgreSQL database included

**Environment Variables:**
- Backend: 15+ env vars (API keys, database, OAuth)
- Frontend: 5 env vars (API URL, OAuth client IDs)
- See `ENVIRONMENT.md` for complete list

## Health Checks

```bash
# Backend health
curl https://meedi8-production.up.railway.app/health
# Expected: {"ok":true}

# Database check
curl https://meedi8-production.up.railway.app/debug/database

# Environment check
curl https://meedi8-production.up.railway.app/debug/env
```
