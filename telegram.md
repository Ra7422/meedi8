# Telegram Integration for meedi8

## Overview

This document outlines how to integrate Telegram with meedi8 to allow users to:
1. Use Telegram as OAuth login credentials
2. Connect their Telegram account to read message history
3. Allow AI to analyze conversation context for better coaching

This approach is **simpler and more privacy-friendly** than ongoing monitoring - it's a one-time context pull.

---

## User Flow

```
1. User signs up for meedi8
2. User clicks "Connect Telegram" 
3. User authorizes meedi8 to read their messages
4. User selects contact: "Sarah (my partner)"
5. meedi8 pulls conversation history with Sarah
6. AI uses this context during coaching: "I can see from your messages that..."
7. Done - no ongoing monitoring, just one-time context pull
```

---

## Implementation Approaches

### Option 1: Telegram Login Widget (Simplest - Add to existing web app)

Telegram provides a "Login with Telegram" button like "Login with Google/Facebook"

**What you get:**
- ✅ User authentication (replaces email/password)
- ✅ User's Telegram ID, username, name, profile photo
- ✅ No password management needed
- ✅ Trusted by users (they understand Telegram auth)

**What you DON'T automatically get:**
- ❌ Access to their messages (still need one extra permission step)

**Implementation:**

```html
<!-- Add to your login page -->
<script async src="https://telegram.org/js/telegram-widget.js?22" 
  data-telegram-login="meedi8_bot" 
  data-size="large" 
  data-auth-url="https://meedi8.com/auth/telegram/callback"
  data-request-access="write">
</script>
```

**Backend callback:**
```python
# app/routes/auth.py

@router.get("/auth/telegram/callback")
async def telegram_auth_callback(
    id: int,
    first_name: str,
    username: str,
    photo_url: str,
    auth_date: int,
    hash: str
):
    """
    Telegram redirects here after user approves
    """
    # 1. Verify the auth is legitimate (check hash)
    if not verify_telegram_auth(id, first_name, username, auth_date, hash):
        raise HTTPException(401, "Invalid Telegram authentication")
    
    # 2. Check if user exists
    user = await User.get_by_telegram_id(id)
    
    if not user:
        # Create new user
        user = await User.create(
            telegram_id=id,
            username=username,
            first_name=first_name,
            profile_photo=photo_url
        )
    
    # 3. Generate JWT token
    token = create_jwt_token(user.id)
    
    # 4. Redirect to app with token
    return RedirectResponse(f"https://meedi8.com/dashboard?token={token}")
```

**User Flow:**
```
1. User visits meedi8.com
2. Clicks "Login with Telegram" button
3. Telegram popup: "Allow meedi8 to know your Telegram identity?"
4. User approves → Logged into meedi8
5. First time they want to load messages → One-time phone verification
6. After that → seamless
```

**Note:** Still need phone verification for message access because:
- Telegram OAuth login only gives you identity
- To read messages via MTProto, you need authenticated session
- One-time setup: User enters phone → Gets code → Done forever

---

### Option 2: Telegram Mini App (Most Integrated - Runs INSIDE Telegram)

This is next-level: meedi8 becomes a **Telegram Web App** that runs directly inside Telegram.

**What this means:**
- Users open meedi8 inside Telegram (like a built-in app)
- Automatic authentication (Telegram already knows who they are)
- Can request permissions to access messages
- Feels native to Telegram
- No separate website login needed

**How users access it:**
```
User opens Telegram → 
Searches for @meedi8bot → 
Clicks "Open App" button → 
meedi8 web app loads inside Telegram → 
Already authenticated → 
Can immediately load messages
```

**Technical Setup:**

1. **Create bot** (via @BotFather):
```
/newbot
Name: meedi8
Username: @meedi8_bot
/setmenubutton
Add Web App URL: https://app.meedi8.com
```

2. **Web app HTML** (special Telegram script):
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script>
    // Telegram automatically provides user data
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe.user;
    
    console.log(user.id);        // Telegram user ID
    console.log(user.username);  // @username
    console.log(user.first_name);
    
    // Tell Telegram the app is ready
    tg.ready();
  </script>
</head>
<body>
  <!-- Your React app loads here -->
  <div id="root"></div>
</body>
</html>
```

3. **React app knows user automatically:**
```jsx
// src/App.jsx

useEffect(() => {
  const tg = window.Telegram.WebApp;
  
  if (tg.initDataUnsafe.user) {
    const telegramUser = tg.initDataUnsafe.user;
    
    // Send to your backend to create/login user
    fetch('https://api.meedi8.com/auth/telegram-webapp', {
      method: 'POST',
      body: JSON.stringify({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        telegram_auth_data: tg.initData // Verify authenticity
      })
    })
    .then(res => res.json())
    .then(data => {
      // User is authenticated, set token
      setToken(data.jwt_token);
    });
  }
}, []);
```

**User Flow:**
```
1. User opens Telegram
2. Searches for @meedi8
3. Clicks bot → "Open meedi8" button appears
4. Clicks button → Your web app opens INSIDE Telegram
5. Automatically logged in (Telegram provides their identity)
6. First time: "Allow meedi8 to read messages with selected contacts?"
7. Approve → Can immediately load conversation history
8. Done - fully integrated
```

**Pros:**
- ✅ Zero-friction authentication
- ✅ Users never leave Telegram
- ✅ Feels native
- ✅ Can send notifications via bot
- ✅ Telegram handles all security
- ✅ Mobile + desktop automatically work

**Cons:**
- ❌ Only Telegram users (can't have email/password login)
- ❌ Slightly different UX than standalone web app
- ❌ Must follow Telegram's design guidelines
- ❌ Still need MTProto session for message access (but easier to request permission)

---

## Recommended Approach: Hybrid

**Best of both worlds:**

```
Phase 1: Add "Login with Telegram" to existing web app
- Keeps email/password option for non-Telegram users
- Telegram users get easy login
- You have flexibility

Phase 2: Build Telegram Mini App version
- Ultimate integration for power users
- Can coexist with web version
- Users choose which they prefer
```

**Implementation:**

### Web App (meedi8.com):
```
Login Options:
[ Email/Password ]
[ Login with Telegram ] ← New
```

### Telegram Mini App (@meedi8bot):
```
User opens bot → "Open meedi8" → Web app inside Telegram
```

Both versions talk to same backend, same database, same rooms.

---

## Detailed Implementation: Message Access

### Step 1: User Connects Telegram Account

Telegram allows apps to access user messages via **Telegram's API** (not Bot API - different thing).

**Technical approach:**

```python
# Use Telethon library (Python client for Telegram)
from telethon import TelegramClient

# Your app credentials (get from https://my.telegram.org)
api_id = YOUR_API_ID
api_hash = YOUR_API_HASH

# Initialize client
client = TelegramClient('meedi8_user_session', api_id, api_hash)

async def connect_user_telegram(user_phone_number: str):
    """
    User enters their phone number
    Telegram sends them a code via SMS/Telegram
    They enter code → Connected
    """
    await client.start(phone=user_phone_number)
    
    # Store session for this user (encrypted)
    session_data = client.session.save()
    await save_user_telegram_session(user_id, session_data)
    
    return {"status": "connected"}
```

### Step 2: User Selects Contact

```python
async def get_user_contacts(user_id: str):
    """
    Show list of their Telegram contacts/chats
    """
    # Load user's Telegram session
    session = await load_user_telegram_session(user_id)
    client = TelegramClient(session, api_id, api_hash)
    
    await client.connect()
    
    # Get all dialogs (chats)
    dialogs = await client.get_dialogs()
    
    contacts = []
    for dialog in dialogs:
        if dialog.is_user:  # Only 1-on-1 chats, not groups
            contacts.append({
                'id': dialog.id,
                'name': dialog.name,
                'username': dialog.entity.username
            })
    
    return contacts
```

### Step 3: Pull Conversation History

```python
async def fetch_telegram_messages(
    user_id: str,
    contact_id: int,
    limit: int = 500  # Last 500 messages
):
    """
    Pull conversation history with selected contact
    """
    session = await load_user_telegram_session(user_id)
    client = TelegramClient(session, api_id, api_hash)
    
    await client.connect()
    
    # Get messages with this contact
    messages = []
    async for message in client.iter_messages(contact_id, limit=limit):
        if message.text:  # Only text messages
            messages.append({
                'timestamp': message.date.isoformat(),
                'from_me': message.out,  # True if user sent it
                'text': message.text
            })
    
    # Reverse to chronological order
    messages.reverse()
    
    return messages
```

### Step 4: AI Analyzes Context

```python
async def analyze_relationship_context(messages: list):
    """
    AI reads conversation history and provides coaching context
    """
    # Format for Claude
    transcript = []
    for msg in messages:
        speaker = "You" if msg['from_me'] else "Them"
        transcript.append(f"[{msg['timestamp']}] {speaker}: {msg['text']}")
    
    transcript_text = '\n'.join(transcript)
    
    prompt = f"""
    I'm coaching someone through a relationship issue. 
    Here's their recent conversation history with their partner:
    
    {transcript_text}
    
    Based on this, identify:
    1. Communication patterns (good and problematic)
    2. Recurring conflict themes
    3. Emotional dynamics
    4. Unmet needs on both sides
    5. Specific coaching recommendations
    
    Keep it constructive and empathetic.
    """
    
    response = await claude_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.content[0].text
```

---

## Frontend Implementation

### 1. Settings Page: Connect Telegram

```jsx
// src/pages/Settings.jsx

const ConnectTelegram = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'code' | 'connected'
  
  const handleConnect = async () => {
    if (step === 'phone') {
      // Send phone number
      await fetch(`${API_URL}/telegram/connect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ phone: phoneNumber })
      });
      setStep('code');
    } else if (step === 'code') {
      // Verify code
      await fetch(`${API_URL}/telegram/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: verificationCode })
      });
      setStep('connected');
    }
  };
  
  return (
    <div>
      <h3>Connect Telegram</h3>
      
      {step === 'phone' && (
        <>
          <input 
            type="tel"
            placeholder="+44 7XXX XXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button onClick={handleConnect}>Send Code</button>
        </>
      )}
      
      {step === 'code' && (
        <>
          <p>Enter the code Telegram sent you:</p>
          <input 
            type="text"
            placeholder="12345"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={handleConnect}>Verify</button>
        </>
      )}
      
      {step === 'connected' && (
        <p>✅ Telegram connected!</p>
      )}
    </div>
  );
};
```

### 2. Coaching Page: Select Contact

```jsx
// src/pages/CoachingChat.jsx

const SelectTelegramContact = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Load user's Telegram contacts
    fetch(`${API_URL}/telegram/contacts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setContacts(data.contacts));
  }, []);
  
  const handleLoadMessages = async (contactId) => {
    setLoading(true);
    
    // Fetch messages and analyze
    const response = await fetch(`${API_URL}/telegram/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ 
        contact_id: contactId,
        room_id: roomId 
      })
    });
    
    const analysis = await response.json();
    setLoading(false);
    
    // AI now has context and provides insights
    // Continue with coaching...
  };
  
  return (
    <div>
      <h3>Load conversation context</h3>
      <p>Select who you're having this issue with:</p>
      
      {contacts.map(contact => (
        <div key={contact.id} onClick={() => handleLoadMessages(contact.id)}>
          {contact.name}
        </div>
      ))}
      
      {loading && <p>Analyzing your conversations...</p>}
    </div>
  );
};
```

---

## Privacy & Security

### Critical Safeguards:

#### 1. Explicit Consent
```
⚠️ Connecting Telegram

meedi8 will:
✅ Read your message history with selected contacts
✅ Use this to understand relationship context
✅ Encrypt and store for 30 days max
✅ Never share with anyone else
✅ Delete immediately if you disconnect

❌ Will NOT:
- Access your entire Telegram account
- Read group chats (only 1-on-1)
- Send messages on your behalf
- Share your data

[Cancel] [I Understand - Connect]
```

#### 2. Selective Access
```python
# Only pull messages from contacts user explicitly selects
# Not their entire Telegram history

# Optional: Set time range
last_30_days = datetime.now() - timedelta(days=30)
messages = await client.get_messages(
    contact_id, 
    limit=500,
    offset_date=last_30_days  # Only recent messages
)
```

#### 3. Revoke Anytime
```jsx
<button onClick={async () => {
  await fetch(`${API_URL}/telegram/disconnect`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // Deletes all stored Telegram data immediately
}}>
  Disconnect Telegram
</button>
```

---

## Backend Setup (Python)

### Install Dependencies

```bash
pip install telethon cryptg
```

### Get API Credentials

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Click "API development tools"
4. Create new application
5. Get `api_id` and `api_hash`

### Store Securely

```python
# .env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abc123def456...
```

---

## Complete Auth Flow with Telegram OAuth

### Frontend (Login Page):

```jsx
// src/pages/Login.jsx

export default function Login() {
  useEffect(() => {
    // Initialize Telegram login widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'meedi8_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', 'https://api.meedi8.com/auth/telegram');
    script.setAttribute('data-request-access', 'write');
    document.getElementById('telegram-login').appendChild(script);
  }, []);
  
  return (
    <div>
      <h2>Login to meedi8</h2>
      
      {/* Traditional login */}
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button>Login</button>
      </form>
      
      <p>OR</p>
      
      {/* Telegram login */}
      <div id="telegram-login"></div>
    </div>
  );
}
```

### Backend (Auth Callback):

```python
# app/routes/auth.py

from hashlib import sha256
import hmac

@router.get("/auth/telegram")
async def telegram_login(
    id: int,
    first_name: str,
    username: Optional[str] = None,
    photo_url: Optional[str] = None,
    auth_date: int,
    hash: str
):
    # Verify authenticity
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    check_string = "\n".join([
        f"auth_date={auth_date}",
        f"first_name={first_name}",
        f"id={id}",
        f"username={username}" if username else ""
    ])
    
    secret_key = sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, check_string.encode(), sha256).hexdigest()
    
    if calculated_hash != hash:
        raise HTTPException(401, "Invalid authentication")
    
    # Get or create user
    user = await User.get_by_telegram_id(id)
    if not user:
        user = User(
            telegram_id=id,
            username=username,
            first_name=first_name,
            profile_photo=photo_url
        )
        await user.save()
    
    # Generate JWT
    token = create_jwt_token(user.id)
    
    # Redirect to app
    return RedirectResponse(f"https://meedi8.com/dashboard?token={token}")
```

---

## User Flows

### First Time User:
```
1. Visits meedi8.com
2. Sees: "Login with Telegram" button
3. Clicks → Telegram popup: "Allow meedi8?"
4. Approves → Logged in immediately
5. Starts mediation
6. AI asks: "Want me to read your Telegram history for context?"
7. User clicks "Yes"
8. One-time: "Send code to verify" (Telegram sends SMS)
9. Enters code → Connected forever
10. AI analyzes messages, coaching begins
```

### Returning User:
```
1. Visits meedi8.com
2. Clicks "Login with Telegram"
3. Instant login (already approved)
4. Starts coaching
5. AI: "Load messages with Sarah?" 
6. Click → Instant (already connected)
7. Done
```

---

## Cost & Limits

**Telegram API:**
- ✅ **FREE** (no per-message costs)
- ✅ Rate limits: ~20 requests/second (plenty)
- ✅ Message history: Unlimited access
- ✅ No approval process

**Only costs:**
- Server bandwidth (minimal)
- Claude API tokens for analysis (~$0.15 per 500 messages)

---

## Technical Comparison

| Feature | Email/Password | Telegram OAuth Login | Telegram Mini App |
|---------|---------------|---------------------|-------------------|
| **Setup Time** | You build it | 1 day | 2-3 days |
| **User Friction** | High (form, verify email) | Low (one click) | Zero (opens in Telegram) |
| **Message Access** | Need full integration | Need one-time phone verify | Easier permission flow |
| **Works Outside Telegram** | ✅ Yes | ✅ Yes | ❌ No |
| **Telegram-first Users** | Awkward | Perfect | Perfect |
| **Non-Telegram Users** | ✅ Yes | ❌ No | ❌ No |

---

## Implementation Timeline

### Week 1:
- [ ] Get Telegram API credentials
- [ ] Set up Telethon in backend
- [ ] Build phone number verification flow
- [ ] Test: Connect your own Telegram, pull messages

### Week 2:
- [ ] Build contact selection UI
- [ ] Implement message fetching
- [ ] Add to coaching flow
- [ ] Test end-to-end with real user

### Week 3:
- [ ] Security audit (encryption, access controls)
- [ ] Privacy policy updates
- [ ] User documentation
- [ ] Beta test with 10 users

---

## Bottom Line: Super Simple Path

```
1. User clicks "Connect Telegram" in Settings
2. Enters phone number → Gets SMS code → Enters code → Connected
3. During coaching, AI asks: "Want me to read your Telegram history with them?"
4. User clicks "Yes" → Selects contact from list
5. meedi8 pulls last 500 messages, analyzes in 15 seconds
6. AI: "I can see you've been arguing about household chores. Let's work on that."
7. Coaching continues with full context
```

**No bots, no monitoring, no complexity.**

Just: **Connect → Select → Analyze → Coach**

---

## Benefits of Telegram OAuth Login

**Yes, Telegram OAuth login makes it MUCH easier:**

1. ✅ Removes email/password complexity
2. ✅ Users trust Telegram auth
3. ✅ One-click login
4. ✅ Already connected to their Telegram
5. ✅ Natural transition to reading messages

**Simplest implementation:**
- Add "Login with Telegram" button (30 minutes)
- Users click → Logged in instantly
- First time they want message access → Quick phone verify (one-time)
- Done
