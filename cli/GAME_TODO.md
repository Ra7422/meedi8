# Gamification Implementation TODO

This document tracks the phased implementation of gamification features for Meedi8.

**Created:** 2025-11-22
**Status:** Phase 1 MVP - Core Infrastructure Complete

---

## Phase 1: MVP Foundation (Week 1-2)

### 1.1 Core Infrastructure
- [x] Create database migrations for gamification tables
  - [x] `user_progress` table
  - [x] `score_events` table
  - [x] `gratitude_entries` table
  - [x] `breathing_sessions` table
  - [x] `emotional_checkins` table
  - [x] `achievements` table
  - [x] `user_achievements` table
  - [x] `daily_challenges` table
  - [x] `user_daily_challenges` table
  - [x] `conversion_events` table
- [x] Create SQLAlchemy models in `backend/app/models/gamification.py`
- [x] Create `GamificationContext.jsx` frontend state provider
- [x] Add gamification routes file `backend/app/routes/gamification.py`
- [x] Register routes in `main.py`

### 1.2 Relationship Health Score (0-100)
**Estimate:** 3-4 days | **Priority:** Critical

**Backend:**
- [x] Define scoring algorithm (resolution +15, check-in +2, breathing +5, etc.)
- [x] Create `GET /api/gamification/health-score` endpoint
- [x] Create `GET /api/gamification/health-score/history` endpoint
- [x] Add score update triggers after:
  - [ ] Mediation resolution
  - [x] Daily check-in
  - [x] Breathing exercise completion
  - [ ] 7-day inactivity penalty
- [x] Implement tier calculation (Bronze/Silver/Gold/Platinum)

**Frontend:**
- [x] `HealthScore.jsx` - Circular gauge component
- [ ] `ScoreHistoryChart.jsx` - 30-day trend line
- [x] `ScoreEventToast.jsx` - Real-time score change notifications
- [x] Add to SessionsDashboard.jsx

**Testing:**
- [ ] Test score increases for each action type
- [ ] Test score decreases for inactivity
- [ ] Test tier transitions
- [ ] Verify history chart renders correctly

---

### 1.3 Conflict Resolution Streaks
**Estimate:** 2-3 days | **Priority:** Critical

**Backend:**
- [x] Add streak fields to `user_progress` table
  - `current_streak`, `longest_streak`, `streak_last_activity`, `streak_protected_until`
- [x] Create `GET /api/gamification/streaks` endpoint
- [x] Create `POST /api/gamification/streaks/protect` endpoint
- [x] Implement streak extension on:
  - [x] Daily login/check-in
  - [ ] Mediation activity
  - [x] Breathing exercise
- [ ] Create daily job to break expired streaks (midnight UTC)
- [x] Implement streak milestone bonuses (7, 14, 30, 60, 90 days)

**Frontend:**
- [x] `StreakCounter.jsx` - Fire emoji with day count
- [ ] Streak milestone celebration modal
- [x] "Streak at risk" warning notification
- [x] Add to SessionsDashboard.jsx header

**Testing:**
- [ ] Test streak increment on qualifying activities
- [ ] Test streak breaks after 24+ hours inactivity
- [ ] Test milestone rewards trigger correctly
- [ ] Test longest streak tracking

---

### 1.4 Gratitude Journal
**Estimate:** 1.5 days | **Priority:** High

**Backend:**
- [x] Create `GET /api/gamification/journal` endpoint (paginated)
- [x] Create `POST /api/gamification/journal` endpoint
- [x] Create `DELETE /api/gamification/journal/{id}` endpoint
- [x] Add XP/score bonus for daily entries
- [ ] Implement "On this day last year" feature

**Frontend:**
- [x] `GratitudeJournal.jsx` - Entry list with add modal
- [x] `JournalEntry.jsx` - Single entry display (integrated in GratitudeJournal)
- [ ] Quick-entry modal from dashboard
- [x] Daily prompt suggestions

**Testing:**
- [ ] Test CRUD operations
- [ ] Test pagination
- [ ] Test XP rewards for entries
- [ ] Test prompt rotation

---

### 1.5 Daily Breathing Exercises (Backend Integration)
**Estimate:** 1.5 days | **Priority:** High

**Backend:**
- [x] Create `POST /api/gamification/breathing/complete` endpoint
- [x] Log session to `breathing_sessions` table
- [x] Award XP based on cycles completed
- [x] Extend streak on completion
- [ ] Check for breathing-related achievements

**Frontend:**
- [x] Connect existing BreathingExercise component to backend
- [x] Show XP earned after session (via toast)
- [x] Display session history/stats (GET endpoint ready)
- [ ] Add breathing streak counter

**Testing:**
- [ ] Test session logging with different modes
- [ ] Test XP calculation (cycles * XP_PER_CYCLE)
- [ ] Test streak extension
- [ ] Test achievement triggers

---

## Phase 2: Engagement Layer (Week 3-4)

### 2.1 Achievement Badges
**Estimate:** 4-5 days | **Priority:** High

**Backend:**
- [ ] Create `badges` and `user_badges` tables
- [ ] Seed initial achievements (20-25 badges):
  - [ ] Communication: First Message, 100 Messages, Voice Pioneer
  - [ ] Empathy: Listener Badge, Other Perspective, Breakthrough
  - [ ] Growth: First Resolution, 5 Resolutions, Streak Master
  - [ ] Commitment: 7-Day Streak, 30-Day Streak, Annual Subscriber
  - [ ] Mindfulness: Breath Master, Gratitude Champion, Check-in King
- [ ] Create `GET /api/gamification/achievements` endpoint
- [ ] Create `POST /api/gamification/achievements/{id}/claim` endpoint
- [ ] Implement achievement trigger system
- [ ] Add hidden/secret achievements

**Frontend:**
- [ ] `AchievementBadge.jsx` - Single badge display
- [ ] `AchievementGrid.jsx` - Full collection view
- [ ] `AchievementToast.jsx` - Unlock celebration popup
- [ ] Achievements page (`/achievements`)
- [ ] Badge showcase on profile

**Testing:**
- [ ] Test each achievement trigger condition
- [ ] Test XP/coin rewards on claim
- [ ] Test hidden achievements reveal correctly
- [ ] Test rarity display (common/rare/epic/legendary)

---

### 2.2 Daily Challenges
**Estimate:** 3-4 days | **Priority:** High

**Backend:**
- [ ] Create `daily_challenges` and `user_daily_challenges` tables
- [ ] Seed challenge pool (15-20 challenges):
  - [ ] "Complete a breathing exercise"
  - [ ] "Write a gratitude entry"
  - [ ] "Send a voice message"
  - [ ] "Log your mood"
  - [ ] "Maintain your streak"
- [ ] Create `GET /api/gamification/challenges` endpoint
- [ ] Create `POST /api/gamification/challenges/{id}/claim` endpoint
- [ ] Implement daily challenge assignment (3 per day)
- [ ] Create daily job to rotate challenges at midnight
- [ ] Track challenge progress in real-time

**Frontend:**
- [ ] `ChallengeCard.jsx` - Single challenge with progress
- [ ] `ChallengeList.jsx` - Today's challenges
- [ ] Challenge completion celebration
- [ ] Add to SessionsDashboard.jsx

**Testing:**
- [ ] Test challenge assignment rotation
- [ ] Test progress tracking for each challenge type
- [ ] Test reward claiming
- [ ] Test expiration at midnight

---

### 2.3 Emotional Weather Reports
**Estimate:** 1.5 days | **Priority:** Medium

**Backend:**
- [ ] Create `emotional_checkins` table
- [ ] Create `POST /api/gamification/mood` endpoint
- [ ] Create `GET /api/gamification/mood/history` endpoint
- [ ] Award XP for daily check-ins

**Frontend:**
- [ ] `MoodSelector.jsx` - Weather emoji picker
- [ ] `MoodCalendar.jsx` - Monthly mood visualization
- [ ] `MoodTrend.jsx` - Trend line chart
- [ ] Quick mood entry from dashboard

**Testing:**
- [ ] Test mood logging
- [ ] Test history retrieval
- [ ] Test calendar visualization
- [ ] Test XP rewards

---

## Phase 3: Monetization Hooks (Week 5-6)

### 3.1 Streak Protection (PRO Feature)
**Estimate:** 1 day | **Priority:** Critical for Conversion

**Backend:**
- [ ] Add `streak_protected_until` field to user_health_scores
- [ ] Create `POST /api/gamification/streaks/protect` endpoint
- [ ] Check PRO subscription before allowing protection
- [ ] Limit to one protection per week
- [ ] Skip streak break if protection active

**Frontend:**
- [ ] "Protect Streak" button (PRO badge)
- [ ] "Streak at risk" modal with upgrade prompt
- [ ] Protection active indicator
- [ ] Upgrade CTA when non-PRO tries to protect

**Testing:**
- [ ] Test protection blocks streak break
- [ ] Test weekly limit enforcement
- [ ] Test PRO-only access
- [ ] Test upgrade flow trigger

---

### 3.2 Score Milestone Unlocks
**Estimate:** 2 days | **Priority:** High for Conversion

**Backend:**
- [ ] Create `conversion_events` table
- [ ] Define milestone thresholds:
  - 70 points: 3-day PRO trial offer
  - 80 points: 7-day PRO trial offer
  - 90 points: 50% off first month
- [ ] Create `POST /api/gamification/milestone-offer/claim` endpoint
- [ ] Track offer shown/converted

**Frontend:**
- [ ] Milestone celebration modal with offer
- [ ] "You've earned a reward!" notification
- [ ] Clear value proposition display
- [ ] Seamless trial activation flow

**Testing:**
- [ ] Test offer triggers at each threshold
- [ ] Test offer can only be claimed once
- [ ] Test Stripe trial/discount application
- [ ] Test conversion tracking

---

### 3.3 Monthly Report Cards
**Estimate:** 2.5 days | **Priority:** Medium

**Backend:**
- [ ] Create monthly report generation service
- [ ] Include:
  - Health score trend (30 days)
  - Badges earned this month
  - Streak statistics
  - Gratitude highlights
  - Mediation outcomes
  - Comparison to previous month
- [ ] Create `GET /api/gamification/report/{month}` endpoint
- [ ] Schedule email delivery on 1st of month

**Frontend:**
- [ ] `MonthlyReportCard.jsx` - Full report view
- [ ] Report history list
- [ ] Shareable (anonymized) version
- [ ] PDF export option

**Testing:**
- [ ] Test report generation accuracy
- [ ] Test month-over-month comparison
- [ ] Test email delivery
- [ ] Test PDF export

---

## Phase 4: Social/Viral (Future)

### 4.1 Referral Program
**Estimate:** 4-5 days | **Priority:** High for Growth

- [ ] Create `referrals` table
- [ ] Add `referral_code` to users table
- [ ] Define reward tiers:
  - 1 referral: 7-day PRO trial for both
  - 3 referrals: 1 month free PRO
  - 5 referrals: 2 months free PRO
  - 10 referrals: "Relationship Advocate" badge + lifetime discount
- [ ] Create referral tracking endpoints
- [ ] Implement reward distribution
- [ ] Create shareable referral links
- [ ] Referral dashboard UI

---

### 4.2 Leaderboards (Optional - Use Carefully)
**Estimate:** 4-5 days | **Priority:** Low

- [ ] Implement with Redis caching
- [ ] Anonymized display (first name only)
- [ ] Individual rankings only (not partner vs partner)
- [ ] Weekly reset option
- [ ] Opt-out preference

---

### 4.3 Anonymous Success Stories
**Estimate:** 3 days | **Priority:** Low

- [ ] User-submitted testimonials
- [ ] Admin approval workflow
- [ ] Voting/likes system
- [ ] Featured stories on landing page

---

## Technical Infrastructure

### Backend Setup
- [ ] Create `backend/app/services/gamification_service.py`
- [ ] Create `backend/app/services/achievement_service.py`
- [ ] Create `backend/app/services/streak_service.py`
- [ ] Add background job scheduler (APScheduler or Celery)
- [ ] Add Redis for leaderboard caching (optional)

### Frontend Setup
- [ ] Create `src/context/GamificationContext.jsx`
- [ ] Create `src/components/gamification/` directory
- [ ] Create `src/pages/Achievements.jsx`
- [ ] Create `src/pages/Journal.jsx`
- [ ] Add gamification routes to App.jsx

### Database Migrations
- [ ] Migration 1: user_health_scores, score_events
- [ ] Migration 2: gratitude_entries, breathing_sessions
- [ ] Migration 3: badges, user_badges
- [ ] Migration 4: daily_challenges, user_daily_challenges, emotional_checkins
- [ ] Migration 5: conversion_events
- [ ] Migration 6: referrals (Phase 4)

---

## Anti-Patterns Checklist

Before launching each feature, verify:

- [ ] No competitive elements between partners
- [ ] No shame-based messaging for failures
- [ ] Core mediation features never blocked
- [ ] All sharing is opt-in
- [ ] Scores cannot be purchased
- [ ] Notifications respect quiet hours
- [ ] Clear explanation of how scores are calculated

---

## Success Metrics

### Phase 1 Targets
- DAU/MAU: 5% → 15%
- D7 Retention: 20% → 35%
- Avg Session Frequency: 1.2/week → 3/week

### Phase 3 Targets
- Free-to-Paid Conversion: 2% → 10%
- PRO Retention: +20%
- Trial-to-Paid: +15%

---

## Notes

- All features must be SSR-safe for Vercel deployment
- Use atomic database updates for counters (prevent race conditions)
- Test each feature on mobile before marking complete
- A/B test conversion hooks before full rollout

---

## Completed Features

(Move items here as they are finished)

---

*Last Updated: 2025-11-22*
