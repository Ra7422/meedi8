# Admin Dashboard Enhancements TODO

**Last Updated:** 2025-11-21

## Overview

This file tracks planned enhancements for the Meedi8 admin dashboard at `/admin/dashboard`.

## Completed

### AI Cost Tracking
- [x] Add Gemini/OpenAI cost calculation to cost_tracker.py
- [x] Add /admin/ai-costs API endpoint (summary, details, export)
- [x] Add AI Costs tab to AdminDashboard.jsx
- [x] Display costs by service (Claude, Gemini, Whisper, TTS)
- [x] Display costs by model
- [x] Display top users by cost
- [x] Show today/month/30-day totals

**Commit:** `d323aaf` - Add AI Cost Tracking to admin dashboard

## Pending Features

### 1. Environment Variables Management
**Priority:** High
**Purpose:** Edit API keys in dashboard that sync to Vercel/Railway

**Tasks:**
- [ ] Research Vercel REST API for env var management
- [ ] Research Railway GraphQL API for env var management
- [ ] Create backend endpoints for env var CRUD
- [ ] Add "Environment Variables" tab to dashboard
- [ ] Show masked values with reveal option
- [ ] Add sync buttons for Vercel/Railway
- [ ] Trigger redeployments after updates

**API References:**
- Vercel: `POST /v10/projects/{projectId}/env`
- Railway: GraphQL mutations for variables

**Files to modify:**
- `backend/app/routes/admin.py`
- `frontend/src/pages/AdminDashboard.jsx`

### 2. Enhanced Audit Logs
**Priority:** Medium
**Purpose:** Better tracking of admin actions

**Tasks:**
- [ ] Create AuditLog database model
- [ ] Add search and filter to Activity Logs tab
- [ ] Add date range picker
- [ ] Add CSV export for audit logs
- [ ] Track detailed change metadata (before/after values)
- [ ] Add admin action logging middleware

**Fields to track:**
- Admin user ID
- Action type (create, update, delete)
- Target entity (user, subscription, room)
- Target ID
- Change details (JSON diff)
- IP address
- Timestamp

### 3. Budget Alerts
**Priority:** Medium
**Purpose:** Email notifications when AI costs hit thresholds

**Tasks:**
- [ ] Create BudgetAlert database model
- [ ] Add budget threshold configuration UI
- [ ] Add email notification when threshold reached
- [ ] Support daily/weekly/monthly budgets
- [ ] Add alert history view

**Thresholds:**
- Warning: 80% of budget
- Critical: 100% of budget
- Options: $10, $25, $50, $100 daily

### 4. Two-Factor Authentication
**Priority:** Medium
**Purpose:** TOTP authentication for admin login

**Tasks:**
- [ ] Add pyotp to requirements.txt
- [ ] Add totp_secret field to User model
- [ ] Create TOTP setup endpoint
- [ ] Add QR code generation for authenticator apps
- [ ] Update admin login to verify TOTP
- [ ] Add 2FA setup page in admin dashboard
- [ ] Support backup codes

**Libraries:**
- Backend: pyotp, qrcode
- Frontend: QR code display component

### 5. Session Management
**Priority:** Low
**Purpose:** View/revoke user sessions, set concurrent limits

**Tasks:**
- [ ] Create UserSession database model
- [ ] Track active sessions with device info
- [ ] Add session list view per user
- [ ] Add "Revoke Session" button
- [ ] Set max concurrent sessions per tier
- [ ] Add session timeout settings

### 6. Database Backup Controls
**Priority:** Low
**Purpose:** Trigger and restore backups from dashboard

**Tasks:**
- [ ] Research Railway database backup API
- [ ] Add backup trigger endpoint
- [ ] Add backup list view
- [ ] Add restore functionality
- [ ] Show backup status and size
- [ ] Set automatic backup schedule

### 7. Performance Metrics
**Priority:** Low
**Purpose:** Response times, Web Vitals, latency tracking

**Tasks:**
- [ ] Add request timing middleware
- [ ] Create PerformanceMetric database model
- [ ] Track endpoint response times
- [ ] Add frontend Web Vitals reporting
- [ ] Create performance dashboard tab
- [ ] Show graphs and trends

**Metrics to track:**
- API response times (p50, p95, p99)
- Database query times
- Frontend LCP, FID, CLS
- Error rates

## Implementation Notes

### Current Admin Dashboard Structure
- **File:** `frontend/src/pages/AdminDashboard.jsx` (~2400 lines)
- **API:** `backend/app/routes/admin.py` (~1100 lines)
- **Tabs:** Dashboard, Analytics, Users, Rooms, Subscriptions, Settings, Activity Logs, Revenue, AI Costs, Feature Flags, Webhooks, Email Templates, System Health

### Design Patterns
- Use StatCard component for summary metrics
- Use consistent table styling (thStyle, tdStyle)
- Use consistent card styling (white bg, 24px border-radius, shadow)
- Fetch data in fetchData() function
- Add state variables at component top

### API Patterns
- All endpoints require admin authentication via check_admin()
- Use SQLAlchemy text() for raw SQL queries
- Return JSON with consistent structure
- Support pagination with skip/limit params

## Resources

- Vercel API Docs: https://vercel.com/docs/rest-api
- Railway API Docs: https://docs.railway.app/reference/public-api
- pyotp Documentation: https://pyauth.github.io/pyotp/
- SendGrid Transactional Email: https://docs.sendgrid.com/
