# Current Development Status

**Last Updated:** 2025-11-23

## Latest Stable State

**Commit:** `c05f74d` (2025-11-23) - **DEPLOYED AND VERIFIED** ✅

**Deployed:**
- Frontend: Vercel (auto-deploy from `main`)
- Backend: Railway (auto-deploy from `main`) - Deployment `5dbaa435`

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
✅ **Telegram message preview (FIXED 2025-11-17)**
✅ PostgreSQL compatibility (Railway) + SQLite (local dev)

## Current Issues

### ✅ RESOLVED - Telegram Message Preview (2025-11-17)

**Problem:** 500 error when previewing messages: `'>' not supported between instances of 'int' and 'NoneType'`

**Root Cause:** Telethon's `iter_messages()` has a bug where it compares `offset_id` with `max_id` using `max()`, which fails when `offset_id` is None.

**Fix Applied (Commit `01bdf26`):**
- Build `iter_messages()` kwargs dynamically to only include `offset_id` when not None
- Added defensive checks and logging for pagination
- Deployed as FIX v4

**Status:** ✅ RESOLVED - User confirmed "that worked i now see the messages"

**Previous Fixes (Deployed in `01bdf26`):**
1. ✅ **Message Preview Error** - Telethon offset_id NoneType comparison fixed
2. ✅ **Entity Resolution** - Increased get_dialogs() limit from 1 to 100
3. ✅ **Exception Handling** - Added comprehensive Telethon error handling
4. ✅ **Timezone Comparison** - Timezone-aware datetime handling (commit `ca40d9c`)
5. ✅ **Download History** - New `/telegram/downloads` endpoint and modal UI (commit `a77ab4b`)

**Files Modified (Already Deployed):**
- `backend/app/services/telegram_service.py` - Dynamic kwargs for iter_messages()
- `backend/app/routes/telegram.py` - Enhanced error messages
- `backend/app/main.py` - FIX v4 deployment marker

## Recent Updates (Last 30 Days)

### 2025-11-23 - Subscription Strategy Research Complete
- **Subscription Tier Restructuring:** Full competitor analysis and pricing strategy completed
- **New Pricing:** FREE (1 med), PLUS £12.99, PRO £24.99, COMPANY £15/seat
- **Company Tier:** New enterprise offering with team dashboards, challenges, peer recognition
- **Gamification Psychology:** Comprehensive conversion triggers and retention mechanics designed
- **Profile Expandable Features:** Subscription card now shows tier features with click-to-expand details
- **Documentation:** Created `cli/SUBSCRIPTION_STRATEGY.md` with full implementation plan
- **Solo Mode Disabled:** Removed from routes and menu (future feature)

### 2025-11-17 - Telegram Message Preview Fixed ✅
- **Telethon NoneType Fix:** Dynamic kwargs for iter_messages() to avoid offset_id comparison bug (commit `01bdf26`)
- **Exception Handling:** Added comprehensive Telethon error types and user-friendly messages (commit `95e3769`)
- **Entity Resolution:** Increased get_dialogs() limit from 1 to 100 for better caching (commit `95e3769`)
- **Download History Modal:** View all Telegram chat downloads with status (commit `a77ab4b`)
- **Timezone Fix:** Handle timezone-aware datetime comparisons (commit `ca40d9c`)
- **Deployment Marker:** FIX v4 deployed successfully to Railway (deployment `5dbaa435`)

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
See `SUBSCRIPTION_STRATEGY.md` for subscription restructuring plan.

**Urgent - Subscription Restructuring:**
- Create detailed implementation plan for new tiers
- Update Subscription page with new pricing (FREE/PLUS £12.99/PRO £24.99/COMPANY)
- Design Company tier admin dashboard
- Update Profile page feature matrix

**High Priority:**
- Create Stripe product for $4.99 report
- Configure custom domain DNS (meedi8.com)
- Enable email notifications after DNS setup

**Medium Priority:**
- Complete paywall Phase 2 (file limits, 402 handling)
- Landing page improvements for conversion
- Terms of Service & Privacy Policy pages

**Future Enhancements:**
- Solo mode feature (disabled for now)
- Telegram group chat monitoring (pending privacy strategy)
- Browser push notifications (FCM/OneSignal)

## Version History

| Date | Commit | Description | Deployed? |
|------|--------|-------------|-----------|
| 2025-11-17 | `17a028c` | Add startup deployment marker - FIX v3 | ❌ NO |
| 2025-11-17 | `e057791` | Trigger Railway deployment (empty) | ❌ NO |
| 2025-11-17 | `ca40d9c` | Fix timezone-aware datetime comparison | ❌ NO |
| 2025-11-17 | `a77ab4b` | Add Telegram download history feature | ❌ NO |
| 2025-11-17 | `c1773b0` | Fix has_more initialization + entity cache | ❌ NO |
| 2025-11-17 | `42eb6cf` | FIX v3: Defensive programming for has_more | ❌ NO |
| 2025-11-15 | `9eceea2` | Trigger Railway deployment - DialogFilters fix | ✅ YES |
| 2025-11-15 | `bc4dab1` | Fix DialogFilters iteration bug | ✅ YES |
| 2025-11-15 | `8439d85` | Fix critical bug: Return dialog's folder_id | ✅ YES |
| 2025-11-15 | `76dcf1c` | Implement lazy loading for Telegram folders | ✅ YES |
| 2025-11-15 | `bfd9e59` | Apply Telegram design system | ✅ YES |
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
