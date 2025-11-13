# SendGrid Email Notification Setup Guide

This guide walks through setting up SendGrid for turn-taking email notifications in Meedi8.

## Overview

**Purpose**: Send email notifications to users when it's their turn to respond in a mediation session, reducing drop-off rates and improving engagement.

**Email Types**:
1. **Turn Notification** - "It's your turn to respond"
2. **Break Notification** - "The other person requested a break"

**Implementation Status**:
- ✅ Email service created (`backend/app/services/email_service.py`)
- ✅ SendGrid dependency added to requirements.txt
- ⏳ Domain DNS verification (requires custom domain setup)
- ⏳ Integration with main room endpoints
- ⏳ User notification preferences (Profile page)

---

## Step 1: SendGrid Account Setup

### Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for free account (100 emails/day free forever)
3. Verify your email address
4. Complete onboarding

### Generate API Key
1. Go to Settings → API Keys → Create API Key
2. Name: "Meedi8 Production"
3. Permissions: **Full Access** (or minimum: Mail Send)
4. Copy the API key immediately (you won't see it again)

**Save this for Step 4**: `SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Domain Authentication (CRITICAL)

**Why Required**: Without domain authentication, emails will be marked as spam or rejected by Gmail/Outlook.

### In SendGrid Dashboard
1. Go to Settings → Sender Authentication → Authenticate Your Domain
2. Select DNS Host: **Namecheap**
3. Enter your domain: `meedi8.com`
4. SendGrid will provide 3-5 DNS records to add

### Example DNS Records (yours will be different)
```
Type: CNAME
Host: em1234
Value: u1234567.wl134.sendgrid.net

Type: CNAME
Host: s1._domainkey
Value: s1.domainkey.u1234567.wl134.sendgrid.net

Type: CNAME
Host: s2._domainkey
Value: s2.domainkey.u1234567.wl134.sendgrid.net

Type: CNAME (optional - for click tracking)
Host: url1234
Value: sendgrid.net
```

### In Namecheap DNS Settings
1. Log into Namecheap → Domain List → Manage `meedi8.com`
2. Go to Advanced DNS tab
3. Add each CNAME record provided by SendGrid
4. Wait 24-48 hours for DNS propagation (usually faster)
5. Return to SendGrid and click "Verify" button

**Verification Status**: Green checkmark = ready to send from `@meedi8.com`

---

## Step 3: Configure Sender Identity

### Option A: Verified Domain (Recommended - after Step 2)
Once domain is verified, you can send from any address like:
- `notifications@meedi8.com`
- `noreply@meedi8.com`
- `team@meedi8.com`

**No additional setup needed** - domain verification covers all addresses.

### Option B: Single Sender (Quick Test - before domain verification)
If domain not yet verified, you can verify a single email address:

1. Go to Settings → Sender Authentication → Verify Single Sender
2. Enter your personal email (e.g., `adam@gmail.com`)
3. Fill out sender details:
   - From Name: Meedi8
   - From Email: (your email)
   - Reply To: (your email)
   - Company: Meedi8
4. SendGrid sends verification email
5. Click link to verify

**Limitation**: Can only send from THIS specific email address.

---

## Step 4: Environment Variables

### Backend Environment Variables (Railway)

Add these to Railway → Backend Service → Variables:

```bash
# SendGrid API Key (from Step 1)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender email (must match verified domain/sender)
FROM_EMAIL=notifications@meedi8.com
FROM_NAME=Meedi8

# Frontend URL for email links
FRONTEND_URL=https://meedi8.com

# Enable email notifications (set to true when ready)
EMAIL_NOTIFICATIONS_ENABLED=false
```

**Important**:
- Keep `EMAIL_NOTIFICATIONS_ENABLED=false` until domain is verified
- Change to `true` only after successful test (Step 5)

### Local Development (.env)

For testing locally, add to `backend/.env`:

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=notifications@meedi8.com
FROM_NAME=Meedi8
FRONTEND_URL=http://localhost:5173
EMAIL_NOTIFICATIONS_ENABLED=true  # Enable for local testing
```

---

## Step 5: Testing Email Delivery

### Test Script

Create `backend/test_email.py`:

```python
import os
from dotenv import load_dotenv
from app.services.email_service import send_turn_notification

load_dotenv()

# Test parameters
test_email = "your-personal-email@gmail.com"  # Use YOUR email
test_name = "Adam"
room_id = 123
other_person_name = "Sarah"

print(f"Sending test email to {test_email}...")
success = send_turn_notification(
    to_email=test_email,
    to_name=test_name,
    room_id=room_id,
    other_person_name=other_person_name
)

if success:
    print("✅ Email sent successfully!")
    print(f"📬 Check your inbox: {test_email}")
else:
    print("❌ Email failed to send")
    print("Check logs for error details")
```

### Run Test

```bash
cd backend
source .venv/bin/activate
pip install sendgrid
python test_email.py
```

### Check Results

1. **Check terminal output** for success/error
2. **Check your inbox** (including spam folder)
3. **Check SendGrid Activity Feed**:
   - Go to Activity in SendGrid dashboard
   - Should see delivery status (Delivered, Opened, etc.)

### Troubleshooting Test Failures

**Error: "The from email does not match a verified Sender Identity"**
- **Cause**: FROM_EMAIL not verified
- **Fix**: Either verify domain (Step 2) or use Single Sender email (Step 3 Option B)

**Error: "API key authentication failed"**
- **Cause**: Invalid or expired API key
- **Fix**: Generate new API key in SendGrid dashboard

**Email goes to spam**
- **Cause**: Domain not authenticated
- **Fix**: Complete Step 2 domain authentication
- **Temporary workaround**: Mark as "Not Spam" during testing

**Email not received at all**
- Check SendGrid Activity Feed for delivery status
- Check recipient email for typos
- Try different email provider (Gmail, Outlook, etc.)

---

## Step 6: Integration with Main Room

### Backend Integration

Add email notifications to turn-taking logic in `backend/app/routes/rooms.py`:

```python
from app.services.email_service import send_turn_notification

@router.post("/{room_id}/main-room/send")
async def send_main_room_message(
    room_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ... existing turn-taking logic ...

    # After determining next_speaker_id
    next_speaker = next((p for p in room.participants if p.id == next_speaker_id), None)
    if next_speaker and next_speaker.id != current_user.id:
        # Send email notification
        send_turn_notification(
            to_email=next_speaker.email,
            to_name=next_speaker.name,
            room_id=room_id,
            other_person_name=current_user.name
        )

    # ... return response ...
```

### Files to Modify

1. **`backend/app/routes/rooms.py`**:
   - Import: `from app.services.email_service import send_turn_notification`
   - Add after turn assignment in `send_main_room_message` endpoint (around line 1800)
   - Also add to `request-break` endpoint for break notifications

2. **Test Integration**:
   - Start mediation with real emails
   - Take turns responding
   - Verify emails arrive for each turn

---

## Step 7: User Preferences (Future Enhancement)

### Database Schema

Add to User model:

```python
class User(Base):
    # ... existing fields ...
    email_notifications_enabled = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
```

### Frontend Profile Page

Add notification toggle in `frontend/src/pages/Profile.jsx`:

```javascript
<label>
  <input
    type="checkbox"
    checked={emailNotificationsEnabled}
    onChange={handleToggleNotifications}
  />
  Send me email notifications when it's my turn
</label>
```

### Backend Check

Update email service to check user preference:

```python
def send_turn_notification(to_email, to_name, room_id, other_person_name, user_id, db):
    user = db.query(User).filter(User.id == user_id).first()
    if not user.email_notifications_enabled:
        logger.info(f"User {user_id} has email notifications disabled")
        return False
    # ... continue with email send ...
```

---

## Step 8: Monitoring & Analytics

### SendGrid Dashboard Metrics

Monitor in SendGrid dashboard:
- **Requests**: Total emails sent
- **Delivered**: Successfully delivered
- **Opens**: Recipients who opened email
- **Clicks**: Recipients who clicked "Continue Mediation" button
- **Bounces**: Failed deliveries (invalid emails)
- **Spam Reports**: Users who marked as spam

### Key Metrics to Track

1. **Delivery Rate**: Should be >98%
   - If lower, check domain authentication
2. **Open Rate**: Aim for >40%
   - Subject line and sender name impact this
3. **Click Rate**: Aim for >20%
   - CTA button design and placement matter
4. **Bounce Rate**: Should be <2%
   - Clean up invalid emails from database

### Alert Setup

Set up alerts in SendGrid for:
- Bounce rate >5%
- Spam reports >1%
- Delivery rate <95%

---

## Cost Analysis

### SendGrid Free Tier
- **100 emails/day** = 3,000 emails/month
- **Forever free** (no credit card required)
- Sufficient for ~75 active mediations/month (assuming 40 emails per mediation)

### Paid Tiers (when needed)
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

### Email Volume Estimates

Average mediation with notifications:
- Pre-mediation: 0 emails (happens once at start)
- Main room: ~20-40 turn-taking emails
- Break requests: ~2-4 emails
- Total: **~25-45 emails per completed mediation**

**Free tier supports**: ~65-120 mediations/month

### Cost Per User
- Free tier: $0
- Essentials tier: $0.0004/email = $0.01-0.02 per mediation
- Negligible cost compared to AI tokens (~$0.50-2.00 per mediation)

---

## Security Best Practices

### API Key Management
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys every 90 days
- ✅ Use different keys for dev/staging/prod

### Email Content Security
- ✅ No sensitive personal info in email body
- ✅ Use short-lived magic links (optional enhancement)
- ✅ Include unsubscribe link (SendGrid handles automatically)
- ✅ HTTPS-only links

### Anti-Spam Compliance
- ✅ Only email opted-in users (account holders)
- ✅ Clear sender identity (Meedi8)
- ✅ Relevant content (turn notifications only)
- ✅ Easy unsubscribe (in footer)
- ✅ Domain authentication (SPF, DKIM)

---

## Rollout Plan

### Phase 1: Setup & Testing (Current)
- ✅ Create email service
- ⏳ Create SendGrid account
- ⏳ Verify domain (requires custom domain setup)
- ⏳ Test email delivery with personal email

### Phase 2: Soft Launch
- Enable for 10% of users (A/B test)
- Monitor engagement metrics
- Gather user feedback
- Fix any deliverability issues

### Phase 3: Full Rollout
- Enable for all users by default
- Add user preference toggle in Profile
- Monitor SendGrid metrics
- Scale to paid tier if needed

### Phase 4: Enhancements
- Add break notifications
- Add resolution notifications
- Add weekly digest emails
- Add onboarding email sequence

---

## Troubleshooting Guide

### Emails Not Sending

**Check 1**: Is `EMAIL_NOTIFICATIONS_ENABLED=true`?
```bash
# In Railway logs
echo $EMAIL_NOTIFICATIONS_ENABLED
```

**Check 2**: Is API key valid?
```bash
# Test with curl
curl -X "POST" "https://api.sendgrid.com/v3/mail/send" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"personalizations":[{"to":[{"email":"test@test.com"}]}],"from":{"email":"test@example.com"},"subject":"Test","content":[{"type":"text/plain","value":"test"}]}'
```

**Check 3**: Check backend logs
```bash
# Railway logs should show
✅ Email sent to user@email.com (status: 202)
# Or error:
❌ Failed to send email to user@email.com: [error]
```

### Emails Going to Spam

**Solution 1**: Domain Authentication (Step 2)
- This is THE most important fix
- 90% of spam issues are due to unverified domains

**Solution 2**: Improve Email Content
- Avoid spam trigger words ("free", "urgent", "act now")
- Balance text/image ratio (more text, fewer images)
- Include physical address in footer

**Solution 3**: Warm Up Sender Reputation
- Start with low volume (10-20 emails/day)
- Gradually increase over 2-4 weeks
- High engagement (opens/clicks) improves reputation

### High Bounce Rate

**Cause**: Invalid or old email addresses

**Solution**: Email validation
- Use `email-validator` library (already in requirements.txt)
- Validate emails at signup
- Remove hard bounces from database
- Re-verify old accounts periodically

---

## Next Steps

1. **Immediate** (You need to do this):
   - [ ] Create SendGrid account
   - [ ] Generate API key
   - [ ] Add to Railway environment variables
   - [ ] Set `EMAIL_NOTIFICATIONS_ENABLED=false` (keep disabled until domain verified)

2. **After Custom Domain Setup** (meedi8.com):
   - [ ] Add DNS records to Namecheap
   - [ ] Verify domain in SendGrid
   - [ ] Run test script with your email
   - [ ] Set `EMAIL_NOTIFICATIONS_ENABLED=true`

3. **Integration** (after emails working):
   - [ ] Add email calls to main room endpoints
   - [ ] Add email calls to break endpoints
   - [ ] Test full mediation flow
   - [ ] Deploy to production

4. **Polish** (future):
   - [ ] Add notification preferences to Profile
   - [ ] Add email templates for other events
   - [ ] Monitor SendGrid metrics
   - [ ] Scale to paid tier if needed

---

## Support Resources

- **SendGrid Docs**: https://docs.sendgrid.com/
- **Email Service Code**: `backend/app/services/email_service.py`
- **Test Script**: `backend/test_email.py` (create this from Step 5)
- **DNS Guide**: See SENDGRID_SETUP.md Step 2
- **Questions**: Check Railway logs for errors
