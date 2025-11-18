# Meedi8 User Experience Strategy
## Guest-to-Paid Conversion Funnel

**Last Updated:** 2025-11-18
**Status:** Planning Phase
**Goal:** Reduce signup friction, increase trial-to-paid conversion

---

## Executive Summary

**Current Problem:** Meedi8 requires login before users can experience the product, creating high friction and low conversion rates.

**Opportunity:** The backend already supports guest checkout (Stripe payment-before-account). We can extend this to allow guest sessions, then convert users at strategic moments.

**Recommended Approach:** Phased rollout starting with low-risk demo enhancement, progressing to full guest room creation.

---

## Current State Analysis

### Authentication Barriers

**100% of core features require login:**
- Home dashboard
- Room creation
- Coaching sessions
- Main room mediation
- All premium features (voice, uploads, Telegram)

**Only 6 routes are public:**
- Login/Signup pages
- FAQ, About, Terms
- Demo pages (static content only)

**Key Finding:** Users cannot try the AI before committing to account creation.

---

## User Journey Problems

### Problem 1: Login Wall at Entry
```
User Journey (Current):
1. User clicks "Start Free Session" → Redirect to /login
2. User sees login form → Friction point
3. Options: Create account OR leave site
4. High abandonment rate (estimated 60-80%)
```

**Impact:** Lost opportunities to demonstrate product value before asking for commitment.

---

### Problem 2: Static Demos Don't Convert
```
Demo Pages (Current):
- /coaching-demo - Pre-written conversation (no AI)
- /main-room-demo - Static example dialogue
- /lobby-demo - Shows invite flow but can't interact
```

**Limitation:** Users see what mediation *looks like* but don't experience the AI's quality.

**Missing:** Interactive demo where users can type real questions and get AI responses.

---

### Problem 3: User 2 Invite Friction
```
User 2 Journey (Current):
1. User 2 receives invite link (https://meedi8.com/join/xyz)
2. Clicks link → Sees User 1's summary
3. Clicks "Start My AI Coaching" → Redirect to /login
4. Must create account before seeing any coaching
5. High drop-off at login requirement
```

**Opportunity:** Let User 2 preview the full conversation context before committing.

---

### Problem 4: No Trial Experience
```
Free Tier Limitations:
- 1 active room per month
- No voice recording (10 free trials total, then paywall)
- No file uploads
- No PDF reports
- No Telegram import
```

**Issue:** Free tier is too limited to demonstrate full value, but premium features require payment upfront.

**Missing:** Trial period where users can try premium features before committing.

---

## Conversion Funnel Strategy

### Option A: Interactive Demo (RECOMMENDED - Phase 1)

**Goal:** Let users experience AI quality with zero commitment

**Flow:**
```
1. Homepage: "Try Interactive Demo" (no login)
   ↓
2. Demo Coaching Session (3-5 AI turns)
   - Real AI responses using Claude
   - Stored in sessionStorage (no DB)
   - Limited conversation depth
   ↓
3. Conversion Modal (after 3 turns)
   "Create account to save & invite someone"
   - Show value: "You've started something meaningful"
   - Social proof: "Join 1,000+ mediations"
   - CTA: "Continue Your Session"
   ↓
4. Account Creation
   - Quick signup (email + password)
   - Or continue with Google/Telegram
   ↓
5. Resume Coaching
   - Start fresh session (demo not saved)
   - Full access to coaching + invite features
```

**Pros:**
- ✅ Low technical complexity (no DB changes)
- ✅ Demonstrates AI quality immediately
- ✅ Clear conversion point with proven value
- ✅ Low cost (3 turns × $0.10 = ~$0.30 per demo)

**Cons:**
- ❌ Demo progress not saved (friction at signup)
- ❌ Cannot demo full 2-party mediation
- ❌ Some API cost for non-converting users

**ROI Calculation:**
```
Cost per demo: $0.30 (3 AI turns)
If 30% convert to free accounts: $1.00 acquisition cost
If 10% of free convert to paid: $10.00 CAC (customer acquisition cost)
Monthly revenue (PLUS): $19.99
LTV/CAC ratio: 2:1 (acceptable for early stage)
```

**Implementation Effort:** 4-6 hours

---

### Option B: Guest Room Creation (Phase 2)

**Goal:** Let users complete full coaching session, convert at invite sharing

**Flow:**
```
1. Homepage: "Start Free Session" (no login)
   ↓
2. Auto-create Guest Account
   - Email: guest_{uuid}@temp.meedi8.com
   - Password: random (user doesn't see it)
   - is_guest: true
   - Tier: FREE (1 room limit)
   ↓
3. Full Coaching Session
   - All turns saved to database
   - User can refresh page (session persists)
   - Complete NVC coaching flow
   ↓
4. Finalization Point - PAYWALL
   "Set your email to share this mediation"
   - Explain: Need email to send invite link
   - Form: Email + Password (convert guest → real user)
   - Option: "Continue with Google/Telegram"
   ↓
5. Account Migration
   - Update guest user: email, hashed_password
   - Set is_guest = false
   - Keep all room history
   ↓
6. User can now:
   - Share invite with User 2
   - Access session from any device
   - View coaching summary
```

**Pros:**
- ✅ Full product experience before commitment
- ✅ Natural conversion point (when user wants to share)
- ✅ Session saved (no lost progress)
- ✅ Clear value demonstrated (completed coaching)

**Cons:**
- ❌ Higher API cost (~$0.50 per full session)
- ❌ Database complexity (guest user migration)
- ❌ Risk of abandoned guest sessions (DB clutter)

**Technical Requirements:**
```python
# Backend changes needed:
1. Add User.is_guest field (Boolean, default=False)
2. Create POST /auth/create-guest endpoint
3. Modify room creation to auto-create guest if no auth
4. Add PUT /auth/convert-guest endpoint (email + password → real user)

# Frontend changes needed:
1. Remove auth requirement from /create route
2. Add guest account creation on room start
3. Show "Upgrade to share" modal at finalization
4. Migrate guest token to real token on conversion
```

**Implementation Effort:** 12-16 hours

---

### Option C: Enhanced Invite Preview (Phase 1.5)

**Goal:** Reduce User 2 friction by showing full context upfront

**Flow:**
```
1. User 2 receives invite link
   ↓
2. Public Invite Page (NO LOGIN)
   - Show User 1's full NVC summary
   - Display conflict category (work, family, etc.)
   - Show "Preview Conversation" button
   ↓
3. Preview Mode (Read-Only)
   - See User 1's coaching conversation
   - Understand their perspective
   - Build empathy before committing
   ↓
4. Soft Conversion
   "Ready to share your perspective?"
   - Collect email first (lower friction)
   - Check if email exists → Login
   - If new email → Signup flow
   ↓
5. Start User 2 Coaching
   - Prefilled context from User 1
   - Personalized AI opening
```

**Pros:**
- ✅ Low technical complexity
- ✅ Reduces perceived risk for User 2
- ✅ Demonstrates value before asking for email
- ✅ Email-first approach (easier than password upfront)

**Cons:**
- ❌ Requires making Turn history public (privacy concern?)
- ❌ Still requires account for User 2 to participate

**Privacy Considerations:**
- User 1 could opt-in: "Allow preview before they join"
- Only show NVC summary by default, full chat opt-in
- Add invite expiration (7 days)

**Implementation Effort:** 6-8 hours

---

### Option D: Trial Period (Phase 3)

**Goal:** Let users try premium features before payment

**Flow:**
```
1. New User Signup
   ↓
2. 7-Day Trial (Automatic)
   - Full PLUS tier access
   - Voice recording (unlimited)
   - File uploads (10MB)
   - Multiple rooms
   ↓
3. Trial Reminders
   - Day 3: "You have 4 days left of premium features"
   - Day 6: "Trial ends tomorrow - upgrade to keep features"
   - Day 7: Downgrade to FREE tier
   ↓
4. Conversion Points
   - During trial: "Upgrade to PLUS for $19.99/mo"
   - After trial: "Your trial expired - upgrade to continue"
```

**Pros:**
- ✅ Users experience full value before paying
- ✅ Standard SaaS model (familiar to users)
- ✅ Higher conversion vs. limited free tier

**Cons:**
- ❌ Risk of trial abuse (create multiple accounts)
- ❌ Cost of providing premium features for free
- ❌ Complexity of trial expiration logic

**Anti-Abuse Measures:**
```python
# Prevent trial abuse:
1. One trial per email (check during signup)
2. One trial per payment method (check credit card fingerprint)
3. Require phone verification for trial (SMS)
4. Block disposable email domains
```

**Implementation Effort:** 8-10 hours

---

## Recommended Phased Rollout

### Phase 1: Quick Wins (This Week)
**Goal:** Reduce friction with minimal dev work

**Tasks:**
1. ✅ **Interactive Demo Page** (4-6 hours)
   - Create `/demo/interactive` route (public, no auth)
   - Use real AI for 3-5 turns
   - Store in sessionStorage only
   - Show "Create account to continue" after 3 turns
   - Track conversion rate in analytics

2. ✅ **Enhanced Invite Preview** (6-8 hours)
   - Make `/join/:token` show full User 1 summary
   - Add "Preview Conversation" button (opt-in for User 1)
   - Collect email before showing signup form
   - Track User 2 conversion rate

3. ✅ **Homepage Redesign** (2-3 hours)
   - Primary CTA: "Try Interactive Demo" (no login)
   - Secondary CTA: "Start Free Session" (requires login)
   - Add social proof: "Join 1,000+ successful mediations"
   - Show pricing comparison table

**Expected Impact:**
- 30-50% more users try demo vs. current signup rate
- 20-30% conversion from demo → signup
- Overall 5-10% increase in signups

---

### Phase 2: Guest Rooms (Next 2 Weeks)
**Goal:** Full product trial before account creation

**Tasks:**
1. ✅ **Backend: Guest User System** (8-10 hours)
   - Add `is_guest` field to User model
   - Create `POST /auth/create-guest` endpoint
   - Create `PUT /auth/convert-guest` endpoint
   - Update room creation to support guest users
   - Add cleanup job (delete unconverted guests after 7 days)

2. ✅ **Frontend: Guest Flow** (6-8 hours)
   - Remove auth from `/create` route
   - Auto-create guest on room start
   - Show "Upgrade to share" at finalization
   - Migrate guest token → real token on conversion

3. ✅ **Analytics Tracking** (2 hours)
   - Track guest session starts
   - Track guest → real conversion rate
   - Track abandonment points

**Expected Impact:**
- 60-80% more users start coaching (no login wall)
- 25-40% convert at finalization (high intent users)
- Overall 15-30% increase in paid conversions

---

### Phase 3: Optimization (Next Month)
**Goal:** Maximize conversion based on data

**Tasks:**
1. ✅ **A/B Testing** (4 hours)
   - Test: Demo (3 turns) vs. Guest Rooms (full session)
   - Test: Email-first vs. Email+Password at conversion
   - Test: Conversion modal copy variations

2. ✅ **Trial System** (8-10 hours)
   - 7-day PLUS tier trial for new signups
   - Email reminders at Day 3, 6, 7
   - Auto-downgrade to FREE after trial

3. ✅ **Conversion Optimization** (6-8 hours)
   - Add exit-intent popups ("Wait! Try our demo first")
   - Email drip campaign for demo users who didn't convert
   - Retargeting pixels for ad campaigns

**Expected Impact:**
- 10-20% additional conversion from A/B test winners
- 15-25% of trial users convert to paid
- Overall 20-40% increase in monthly revenue

---

## Technical Implementation Details

### Phase 1: Interactive Demo

**Frontend Changes:**

```javascript
// frontend/src/pages/InteractiveDemo.jsx (NEW FILE)
import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export default function InteractiveDemo() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'What would you like to discuss?' }
  ]);
  const [input, setInput] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [showConversion, setShowConversion] = useState(false);
  const MAX_TURNS = 3;

  const handleSend = async () => {
    if (turnCount >= MAX_TURNS) {
      setShowConversion(true);
      return;
    }

    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Call demo endpoint (no auth required)
    const response = await fetch('/api/demo/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        conversation: newMessages
      })
    });

    const data = await response.json();
    setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    setTurnCount(turnCount + 1);

    if (turnCount + 1 >= MAX_TURNS) {
      setShowConversion(true);
    }
  };

  return (
    <div>
      {/* Chat UI */}
      <ChatMessages messages={messages} />

      {showConversion ? (
        <ConversionModal
          onSignup={() => navigate('/signup?from=demo')}
        />
      ) : (
        <ChatInput value={input} onChange={setInput} onSend={handleSend} />
      )}
    </div>
  );
}
```

**Backend Changes:**

```python
# backend/app/routes/demo.py (NEW FILE)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.pre_mediation_coach import process_coaching_response

router = APIRouter(prefix="/demo", tags=["demo"])

class DemoRequest(BaseModel):
    message: str
    conversation: list[dict]  # [{role, content}]

@router.post("/respond")
async def demo_respond(request: DemoRequest):
    """
    Demo endpoint - NO AUTH REQUIRED
    Limited to 3 turns to prevent abuse
    """
    # Validate turn limit
    if len(request.conversation) >= 6:  # 3 turns = 6 messages (user + AI)
        raise HTTPException(status_code=429, detail="Demo limit reached")

    # Use existing coaching AI
    result = process_coaching_response(
        conversation_history=request.conversation,
        user_response=request.message,
        exchange_count=len([m for m in request.conversation if m['role'] == 'user'])
    )

    return {"response": result.get('ai_question', 'Tell me more.')}
```

**Effort:** 4-6 hours total

---

### Phase 2: Guest User System

**Database Migration:**

```python
# backend/migrations/versions/add_guest_users.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add is_guest field to users table
    op.add_column('users', sa.Column('is_guest', sa.Boolean(), server_default='false', nullable=False))

    # Make email nullable for guest users
    op.alter_column('users', 'email', nullable=True)

    # Add created_at index for cleanup job
    op.create_index('idx_users_is_guest_created', 'users', ['is_guest', 'created_at'])

def downgrade():
    op.drop_index('idx_users_is_guest_created')
    op.alter_column('users', 'email', nullable=False)
    op.drop_column('users', 'is_guest')
```

**Backend: Guest Creation**

```python
# backend/app/routes/auth.py
import uuid
from datetime import datetime
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionTier

@router.post("/create-guest")
def create_guest(db: Session = Depends(get_db)):
    """
    Create anonymous guest account
    - Auto-generated email (guest_{uuid}@temp.meedi8.com)
    - Random password (user never sees it)
    - is_guest = true
    - FREE tier subscription
    """
    guest_id = str(uuid.uuid4())[:8]
    guest_email = f"guest_{guest_id}@temp.meedi8.com"
    guest_password = str(uuid.uuid4())  # Random, user doesn't know it

    # Create guest user
    guest = User(
        email=guest_email,
        name=f"Guest {guest_id}",
        hashed_password=get_password_hash(guest_password),
        is_guest=True,
        created_at=datetime.utcnow()
    )
    db.add(guest)
    db.flush()

    # Create FREE subscription
    subscription = Subscription(
        user_id=guest.id,
        tier=SubscriptionTier.FREE,
        stripe_subscription_id=None,  # No payment
        status="active"
    )
    db.add(subscription)
    db.commit()

    # Create JWT token
    token = create_access_token(data={"sub": guest.email})

    return {
        "token": token,
        "user": {
            "id": guest.id,
            "email": guest_email,
            "is_guest": True
        }
    }
```

**Backend: Guest Conversion**

```python
# backend/app/routes/auth.py
class ConvertGuestRequest(BaseModel):
    email: str
    password: str

@router.put("/convert-guest")
def convert_guest(
    request: ConvertGuestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Convert guest account to real user
    - Validate guest status
    - Check email not already taken
    - Update email + password
    - Set is_guest = false
    """
    if not current_user.is_guest:
        raise HTTPException(status_code=400, detail="Not a guest account")

    # Check email availability
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Update user
    current_user.email = request.email
    current_user.hashed_password = get_password_hash(request.password)
    current_user.is_guest = False
    db.commit()

    # Create new token with real email
    token = create_access_token(data={"sub": current_user.email})

    return {
        "token": token,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "is_guest": False
        }
    }
```

**Frontend: Auto Guest Creation**

```javascript
// frontend/src/pages/CreateRoom.jsx
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

export default function CreateRoom() {
  const { token, setToken } = useAuth();
  const [creating, setCreating] = useState(false);

  const handleStartSession = async () => {
    setCreating(true);

    // If no token, create guest account first
    if (!token) {
      const guestResponse = await apiRequest('/auth/create-guest', 'POST');
      setToken(guestResponse.token);
      // Store in localStorage for session persistence
      localStorage.setItem('authToken', guestResponse.token);
    }

    // Now create room (will use guest token)
    const room = await apiRequest('/rooms', 'POST', {
      title: 'Guest Session',
      category: 'other',
      room_type: 'mediation'
    });

    navigate(`/rooms/${room.id}/coaching`);
  };

  return (
    <div>
      <h1>Start Your Free Session</h1>
      <button onClick={handleStartSession} disabled={creating}>
        {creating ? 'Starting...' : 'Begin Coaching'}
      </button>
    </div>
  );
}
```

**Frontend: Conversion Modal**

```javascript
// frontend/src/components/GuestConversionModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GuestConversionModal({ onClose, onConverted }) {
  const { user, setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConvert = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest('/auth/convert-guest', 'PUT', {
        email,
        password
      });

      // Update token with real account
      setToken(response.token);
      localStorage.setItem('authToken', response.token);

      onConverted();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_guest) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Save Your Session</h2>
        <p>You've completed coaching! Set your email to share this mediation with someone.</p>

        <form onSubmit={handleConvert}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>

        <div className="oauth-options">
          <p>Or continue with:</p>
          <button onClick={() => handleOAuth('google')}>Google</button>
          <button onClick={() => handleOAuth('telegram')}>Telegram</button>
        </div>
      </div>
    </div>
  );
}
```

**Effort:** 12-16 hours total

---

## Conversion Optimization Best Practices

### Modal Copy Testing

**Variation A: Value-First**
```
Headline: "You've Started Something Meaningful"
Body: "Your coaching session is saved! Set your email to share this mediation and find resolution together."
CTA: "Save & Share"
```

**Variation B: Fear of Loss**
```
Headline: "Don't Lose Your Progress"
Body: "You've completed your coaching. Create an account to save your session and invite the other person."
CTA: "Secure My Session"
```

**Variation C: Social Proof**
```
Headline: "Join 1,000+ Successful Mediations"
Body: "You're ready to invite someone. Create your account to share your perspective and start the conversation."
CTA: "Continue to Mediation"
```

**Testing Method:**
- A/B test with 33% traffic to each variation
- Track conversion rate (guest → account)
- Winner becomes default after 1000 impressions

---

### Email Drip Campaign (Demo Non-Converters)

**Day 0 (Immediate):**
```
Subject: Thanks for trying Meedi8!
Body:
We noticed you tried our demo. Ready to start a real mediation?

[Start Free Session CTA]

- No credit card required
- 1 free mediation per month
- Invite anyone to join
```

**Day 3:**
```
Subject: Still thinking about reaching out?
Body:
Conflict resolution is hard. That's why 1,000+ people use Meedi8 to find common ground.

Real stories:
- "Saved my relationship with my sister" - Jane M.
- "Finally resolved our work disagreement" - Tom K.

[Try It Free CTA]
```

**Day 7:**
```
Subject: Your mediation toolkit is waiting
Body:
When you're ready to resolve that conflict, Meedi8 has:

✓ AI-guided coaching (like a therapist)
✓ Turn-by-turn mediation (keeps things fair)
✓ Professional summaries (document your progress)

First session is free. No risk.

[Start Now CTA]
```

---

## Analytics & Metrics

### Key Metrics to Track

**Acquisition Funnel:**
```
1. Homepage Visits
   ↓
2. Demo Started (% of visits)
   ↓
3. Demo Completed (% of starts)
   ↓
4. Account Created (% of completes)
   ↓
5. First Room Created (% of accounts)
   ↓
6. Invite Sent (% of rooms)
   ↓
7. User 2 Joined (% of invites)
   ↓
8. Mediation Completed (% of 2-user rooms)
```

**Target Conversion Rates (Industry Benchmarks):**
- Homepage → Demo: 15-25%
- Demo → Signup: 20-30%
- Signup → First Room: 60-80%
- Room → Invite: 40-60%
- Invite → User 2 Join: 30-50%
- 2-User → Complete: 50-70%

**Revenue Metrics:**
```
CAC (Customer Acquisition Cost):
- Demo API cost: $0.30
- Ad spend per signup: $5-10
- Total CAC: $5.30-10.30

LTV (Lifetime Value):
- Avg subscription length: 6 months
- PLUS tier: $19.99/mo × 6 = $119.94
- PRO tier: $39.99/mo × 6 = $239.94
- Blended LTV (70% PLUS, 30% PRO): $155.95

LTV/CAC ratio: 15-30x (excellent)
```

**Event Tracking (Google Analytics 4):**
```javascript
// Track demo interactions
gtag('event', 'demo_started', {
  event_category: 'engagement',
  event_label: 'interactive_demo'
});

// Track conversion points
gtag('event', 'demo_conversion_shown', {
  event_category: 'conversion',
  turn_count: 3
});

// Track signup source
gtag('event', 'signup', {
  method: 'email',
  source: 'demo'  // vs 'homepage', 'invite', etc.
});
```

---

## Privacy & Legal Considerations

### Guest User Data Handling

**GDPR Compliance:**
- Guest sessions are anonymous (no PII collected)
- Temporary email (`guest_*@temp.meedi8.com`) is not real user data
- If user doesn't convert, delete guest record after 7 days
- User can request deletion via `/auth/delete-guest`

**Terms of Service Update:**
```markdown
## Guest Sessions

When you start a session without creating an account, we create a temporary
"guest" account to save your conversation. This guest account:

- Uses a temporary email address (guest_123@temp.meedi8.com)
- Is deleted after 7 days if you don't convert to a real account
- Cannot be recovered if you lose your session
- Is not linked to any personal information

To save your session permanently, create an account by setting your real
email address when prompted.
```

**Privacy Policy Update:**
```markdown
## Data Retention

Guest Accounts: Deleted after 7 days of inactivity
Real Accounts: Retained until user requests deletion
Conversations: Retained for 1 year, then archived
```

---

## Cost-Benefit Analysis

### Phase 1: Interactive Demo

**Costs:**
- Development: 4-6 hours @ $100/hr = $400-600
- API costs: 100 demos/day × $0.30 = $30/day = $900/mo
- Total Year 1: $11,400

**Benefits:**
- Expected signups: 100 demos × 25% conversion = 25 signups/day
- Paid conversions: 25 × 10% = 2.5 paid/day × 30 = 75 paid/mo
- Revenue: 75 × $19.99 = $1,499/mo = $17,988/year

**ROI:** 158% Year 1

---

### Phase 2: Guest Rooms

**Costs:**
- Development: 12-16 hours @ $100/hr = $1,200-1,600
- API costs: 50 sessions/day × $0.50 = $25/day = $750/mo
- Database storage: ~500 guest users/mo × $0.001 = $0.50/mo
- Total Year 1: $10,806

**Benefits:**
- Expected sessions: 50 guest sessions/day
- Conversions: 50 × 35% = 17.5 accounts/day
- Paid conversions: 17.5 × 15% = 2.6 paid/day × 30 = 78 paid/mo
- Revenue: 78 × $19.99 = $1,559/mo = $18,708/year

**ROI:** 173% Year 1

---

### Combined Impact (Phase 1 + 2)

**Total Costs:** $22,206/year
**Total Revenue:** $36,696/year
**Net Profit:** $14,490/year
**ROI:** 165%

**Break-even:** Month 2 (after initial development amortized)

---

## Risk Mitigation

### Risk 1: Trial Abuse

**Threat:** Users create multiple guest accounts to bypass room limits

**Mitigation:**
- IP-based rate limiting (max 3 guest sessions per IP/day)
- Email domain validation (block disposable emails)
- Captcha on guest creation after 2 sessions from same IP
- Browser fingerprinting (block duplicate devices)

**Code Example:**
```python
# backend/app/routes/auth.py
from fastapi import Request
import hashlib

@router.post("/create-guest")
async def create_guest(
    request: Request,
    db: Session = Depends(get_db)
):
    # Get IP address
    ip = request.client.host

    # Check rate limit
    today_count = db.query(User).filter(
        User.is_guest == True,
        User.created_at >= datetime.utcnow().date(),
        User.metadata['ip'].astext == ip  # JSON field
    ).count()

    if today_count >= 3:
        raise HTTPException(
            status_code=429,
            detail="Guest limit reached. Create an account to continue."
        )

    # Create guest with IP tracking
    # ... (rest of guest creation)
```

---

### Risk 2: High API Costs

**Threat:** Non-converting guests consume Claude API credits

**Mitigation:**
- Start with demo (3 turns, low cost)
- Monitor conversion rate weekly
- If conversion < 20%, reduce to demo-only
- If conversion > 40%, expand to full guest rooms
- Set hard limit: 100 guest sessions/day max

**Cost Control:**
```python
# backend/app/config.py
DEMO_MAX_TURNS = 3  # Limit demo length
GUEST_DAILY_LIMIT = 100  # Max guest accounts per day
GUEST_CLEANUP_DAYS = 7  # Delete unconverted guests

# Monitor costs in /admin/analytics
```

---

### Risk 3: Abandoned Guest Sessions

**Threat:** Database fills with unconverted guest accounts

**Mitigation:**
- Cron job: Delete guests older than 7 days (if is_guest=true)
- Archive conversations before deletion (for analytics)
- Monitor storage usage weekly

**Cleanup Job:**
```python
# backend/app/tasks/cleanup.py
from datetime import datetime, timedelta
from app.models.user import User

def cleanup_abandoned_guests():
    """Delete guest accounts older than 7 days"""
    cutoff = datetime.utcnow() - timedelta(days=7)

    abandoned = db.query(User).filter(
        User.is_guest == True,
        User.created_at < cutoff
    ).all()

    for guest in abandoned:
        # Archive conversation for analytics
        archive_conversation(guest.id)

        # Delete user (cascade deletes rooms, turns, etc.)
        db.delete(guest)

    db.commit()

    return len(abandoned)

# Run daily via cron
# crontab: 0 2 * * * python -m app.tasks.cleanup
```

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ **Create UX.md** (this file) - Document strategy ← YOU ARE HERE
2. ✅ **Stakeholder Review** - Get approval for phased approach
3. ✅ **Design Mockups** - Wireframe demo page, conversion modals
4. ✅ **Analytics Setup** - Add GA4 events for demo tracking

### Week 1: Demo Implementation

1. Create `/demo/interactive` frontend page
2. Build demo API endpoint (no auth)
3. Design conversion modal
4. Test demo flow end-to-end
5. Deploy to production
6. Monitor conversion rate for 3-5 days

### Week 2-3: Guest Rooms (If Demo Performs Well)

1. Add `is_guest` field to User model (DB migration)
2. Create guest creation/conversion endpoints
3. Update frontend room creation flow
4. Build "Upgrade to share" modal
5. Add cleanup cron job
6. A/B test against demo-only approach

### Week 4: Optimization

1. Analyze demo vs. guest conversion rates
2. Implement winning strategy
3. Add email drip campaign for non-converters
4. Optimize modal copy (A/B test)
5. Document learnings for next iteration

---

## Success Criteria

### Phase 1 Success (Interactive Demo)
- ✅ 20%+ demo completion rate
- ✅ 25%+ demo → signup conversion
- ✅ 10%+ signup → paid conversion
- ✅ < $10 CAC (including API costs)

### Phase 2 Success (Guest Rooms)
- ✅ 60%+ guest session completion
- ✅ 35%+ guest → account conversion
- ✅ 15%+ account → paid conversion
- ✅ < $12 CAC (including higher API costs)

### Overall Success (6 Months)
- ✅ 2x increase in monthly signups
- ✅ 1.5x increase in paid conversions
- ✅ Positive ROI (revenue > costs)
- ✅ < 15% trial abuse rate

---

## Appendix: Competitive Analysis

### How Competitors Handle Trial/Demo

**BetterHelp (Therapy App):**
- Quiz before signup (qualify intent)
- Match with therapist (demonstrate value)
- Require payment upfront for first session
- 7-day trial with full refund

**Headspace (Meditation App):**
- 7-14 free guided meditations (demo)
- No account required for demo
- Account creation after demo completion
- 7-day free trial of premium features

**Calm (Wellness App):**
- Limited free content (demo library)
- Account required to track progress
- 7-day free trial of premium
- Aggressive email marketing

**Meedi8 Opportunity:**
- More interactive than quiz (live AI demo)
- Lower commitment than BetterHelp (no payment)
- More engaging than static content (real coaching)
- Unique value prop: Try before inviting someone

---

## File Reference

**Files to Create:**
- `/frontend/src/pages/InteractiveDemo.jsx` - Demo page
- `/frontend/src/components/GuestConversionModal.jsx` - Conversion modal
- `/backend/app/routes/demo.py` - Demo API endpoint
- `/backend/app/tasks/cleanup.py` - Guest cleanup cron job

**Files to Modify:**
- `/frontend/src/App.jsx` - Add `/demo/interactive` public route
- `/frontend/src/pages/CreateRoom.jsx` - Auto-create guest if no token
- `/backend/app/models/user.py` - Add `is_guest` field
- `/backend/app/routes/auth.py` - Add guest creation/conversion endpoints
- `/backend/app/deps.py` - Already has `get_current_user_optional()` ✓

**Documentation to Update:**
- `/cli/TODO.md` - Add Phase 1/2 tasks
- `/cli/STATUS.md` - Track guest access deployment
- `/cli/PATTERNS.md` - Document guest user patterns
- `/README.md` - Update with demo link

---

**End of UX Strategy Document**

For questions or suggestions, contact the product team.
