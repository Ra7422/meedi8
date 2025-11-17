# Meedi8 TODO List

**Last Updated:** 2025-11-17

## 🔴 URGENT - Active Blockers

### Railway Deployment Not Updating (CRITICAL)
**Status:** **BLOCKING ALL TELEGRAM FIXES**
**Blocker:** YES - 6 commits stuck, cannot deploy bug fixes

**Problem:**
Railway is deploying successfully but NOT pulling latest code from GitHub. The GitHub webhook page in Railway dashboard is **EMPTY**.

**Impact:**
- Message preview feature broken (NoneType error)
- Download feature broken (entity resolution error)
- Timezone comparison error
- New download history modal not accessible
- Cannot test ANY Telegram fixes

**Required Actions:**
1. [ ] Go to Railway dashboard → meedi8 service
2. [ ] Click "New Deployment" or "Redeploy" button
3. [ ] Verify logs show: `🚀 DEPLOYMENT FIX v3 - Nov 17 2025 10:22 UTC`
4. [ ] If marker doesn't appear: Settings → GitHub → Reconnect repository
5. [ ] After successful deploy, test message preview by clicking contact name

**Commits Waiting Deployment:**
- `17a028c` - Deployment marker
- `42eb6cf` - has_more defensive programming
- `c1773b0` - has_more fix + entity cache
- `a77ab4b` - Download history modal
- `ca40d9c` - Timezone fix
- `e057791` - Empty commit trigger (failed)

**Files Modified (Not Deployed):**
- `backend/app/main.py:1-14`
- `backend/app/services/telegram_service.py:436-439,470-475,619-645`
- `backend/app/routes/telegram.py:115-129,515-558`
- `frontend/src/components/TelegramDownloadHistory.jsx` (new file)
- `frontend/src/pages/TelegramConnect.jsx`

### Telegram Message Preview Error (PAUSED - Waiting Railway Fix)
**Status:** Fix ready but not deployed
**Blocker:** Railway deployment issue (above)

**Error:** `'>' not supported between instances of 'int' and 'NoneType'`
**Fix:** Initialize `has_more = False` before loop (commits `c1773b0`, `42eb6cf`, `17a028c`)

**Next Steps After Railway Fix:**
- [ ] Verify `🔧 FIX v3 ACTIVE` appears in Railway logs
- [ ] Test clicking contact names to preview messages
- [ ] Verify no NoneType errors in logs

## 🟡 HIGH PRIORITY - Near-term Work

### Domain Configuration
**Status:** Waiting on user
**Blocker:** No (email system works without it)

**Tasks:**
- [ ] Purchase/configure `meedi8.com` domain in Namecheap
- [ ] Add Vercel DNS records (A record @ → 76.76.21.21, CNAME www → cname.vercel-dns.com)
- [ ] Add Railway CNAME (api → [railway-url].up.railway.app)
- [ ] Add SendGrid CNAME records (3-5 records for email verification)
- [ ] Update environment variables: `FRONTEND_URL=https://meedi8.com`

**Reference:** `STATUS.md` has DNS configuration examples

### Email Notification Activation
**Status:** Code deployed, disabled by default
**Dependencies:** Domain DNS configuration (above)

**Tasks:**
- [ ] Create SendGrid account (https://sendgrid.com)
- [ ] Generate SendGrid API key (Settings → API Keys)
- [ ] Verify domain in SendGrid dashboard
- [ ] Add Railway env vars: `SENDGRID_API_KEY`, `FROM_EMAIL=notifications@meedi8.com`
- [ ] Test with `python backend/test_email.py`
- [ ] Set `EMAIL_NOTIFICATIONS_ENABLED=true` in Railway

**Reference:** `SENDGRID_SETUP.md` (500+ line guide)

### Subscription Paywall - Phase 2
**Status:** Phase 1 complete (room limits), Phase 2 pending
**Reference:** `PAYWALL.md` for strategy

**Tasks:**
- [ ] File upload size validation (FREE: disabled, PLUS: 10MB, PRO: 50MB)
- [ ] Frontend 402 error handling (upgrade modal)
- [ ] Professional report limits (PRO only: 3/month counter)
- [ ] Monthly counter reset verification (test on 1st of month)

**Files:** `backend/app/routes/rooms.py`, `frontend/src/pages/MainRoom.jsx`

## 🟢 MEDIUM PRIORITY - Future Enhancements

### Telegram Group Chat Monitoring
**Status:** Foundation ready, awaiting privacy strategy
**Dependencies:** Ethical review, user consent system

**Tasks:**
- [ ] Design privacy-first approach (opt-in, data retention policy)
- [ ] Implement phone number verification flow
- [ ] Build monitoring service with Telethon event handlers
- [ ] Create AI conflict detection analysis
- [ ] Add user consent UI and database fields
- [ ] Test with personal Telegram groups first

**Note:** Telethon library already installed (commit `25fe58c`)

### Push Notifications
**Status:** Not started
**Purpose:** Real-time alerts as alternative to email

**Options:**
1. Firebase Cloud Messaging (FCM) - free, Google-backed
2. OneSignal - free tier, easier setup
3. Native browser Push API - no dependencies

**Tasks:**
- [ ] Research best option for React + Vercel
- [ ] Implement service worker for background notifications
- [ ] Add notification preferences to user settings
- [ ] Test on mobile Safari (requires HTTPS)

### SMS Notifications (Premium Feature)
**Status:** Future consideration
**Purpose:** Optional premium tier enhancement

**Tasks:**
- [ ] Research Twilio pricing (~$0.0075/SMS)
- [ ] Design SMS-only tier or add to PRO tier
- [ ] Implement SMS service (similar to email_service.py)
- [ ] Add phone number collection during signup

## 🔵 LOW PRIORITY - Polish & Optimizations

### Frontend Performance
- [ ] Add code splitting for faster initial load
- [ ] Implement lazy loading for images
- [ ] Optimize polling intervals (currently 3s, could be adaptive)
- [ ] Add service worker for offline support

### Testing
- [ ] Add Jest unit tests for critical backend functions
- [ ] Add React Testing Library for frontend components
- [ ] E2E tests with Playwright (full mediation flow)
- [ ] Load testing with Locust (simulate 100+ concurrent users)

### Documentation
- [ ] API documentation with Swagger/OpenAPI
- [ ] User guide for mediation process
- [ ] Video tutorials for common flows
- [ ] Developer onboarding guide

## ✅ COMPLETED - Recent Wins

### 2025-11-15
- [x] Telegram lazy loading for folder tabs (commit `76dcf1c`)
- [x] Fix folder_id backend bug (commit `8439d85`)
- [x] Apply Telegram design system styling (commit `bfd9e59`)
- [x] Deploy DialogFilters fix to Railway (commit `9eceea2`)

### 2025-11-14
- [x] Add Telethon library for Telegram API (commit `25fe58c`)
- [x] Fix profile picture display in FloatingMenu (commit `0f17eb2`)
- [x] Stripe Express Checkout loading spinner (commit `e858e27`)
- [x] Add Meedi illustration to Subscription page

### 2025-11-13
- [x] Payment-first Stripe checkout (commit `ec84a73`)
- [x] Room creation paywall limits (commit `ff3df8d`)
- [x] Email notification system with SendGrid (commit `f9825c3`)
- [x] Write PAYWALL.md and SENDGRID_SETUP.md docs

### 2025-11-12
- [x] Professional PDF report generation (commit `c5cfd7b`)
- [x] Harsh language intervention pattern (commit `ee70883`)
- [x] Fix homepage image assets

### 2025-11-11
- [x] File attachment feature (images, PDFs, docs)
- [x] AI image analysis with Claude Vision
- [x] Fix PostgreSQL JSON query compatibility

## 📋 Maintenance Tasks

### Weekly
- [ ] Check Railway/Vercel logs for errors
- [ ] Review Anthropic API costs (monitor spend)
- [ ] Backup PostgreSQL database
- [ ] Update dependencies (npm audit, pip list --outdated)

### Monthly
- [ ] Review subscription usage counters (verify resets)
- [ ] Analyze user engagement metrics
- [ ] Test full mediation flow end-to-end
- [ ] Review and update this TODO list

## 🎯 Quarterly Goals (Q1 2025)

1. **Launch Custom Domain** - meedi8.com with full SSL
2. **Activate Email System** - SendGrid with verified domain
3. **Complete Paywall Phase 2** - All tier limits enforced
4. **100 Beta Users** - Invite-only testing period
5. **Performance Baseline** - Establish metrics for optimization

## Notes

- Use `git log --oneline -20` to see recent commits
- Always test locally before deploying
- Keep TODO.md updated after each work session
- Reference other CLI docs for implementation details
