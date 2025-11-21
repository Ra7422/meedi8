# PWA Setup Guide for Meedi8

This guide covers implementing Progressive Web App (PWA) functionality to make Meedi8 feel like a native app.

## Overview

PWA enables:
- Install to home screen (no app store)
- No browser chrome (standalone mode)
- Push notifications
- Offline capability
- App-like transitions

## Phase 1: Foundation (Day 1-2)

### 1. Create manifest.json

**Location:** `/frontend/public/manifest.json`

```json
{
  "name": "Meedi8 - AI Mediation",
  "short_name": "Meedi8",
  "description": "AI-powered conflict resolution using NVC principles",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#7DD3C0",
  "categories": ["lifestyle", "productivity", "health"],
  "lang": "en-US",
  "icons": [
    {
      "src": "/icons/pwa/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/pwa/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "New Mediation",
      "short_name": "New",
      "description": "Start a new mediation session",
      "url": "/create",
      "icons": [{ "src": "/icons/pwa/shortcut-new.png", "sizes": "96x96" }]
    },
    {
      "name": "My Sessions",
      "short_name": "Sessions",
      "description": "View your mediation history",
      "url": "/sessions",
      "icons": [{ "src": "/icons/pwa/shortcut-sessions.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/coaching-mobile.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "AI Coaching Session"
    }
  ]
}
```

### 2. Add Meta Tags to index.html

**Location:** `/frontend/index.html`

Add inside `<head>`:

```html
<!-- PWA Meta Tags -->
<meta name="theme-color" content="#7DD3C0">
<link rel="manifest" href="/manifest.json">

<!-- iOS Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Meedi8">

<!-- iOS Icons -->
<link rel="apple-touch-icon" href="/icons/pwa/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/pwa/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/pwa/apple-touch-icon-180x180.png">
<link rel="apple-touch-icon" sizes="167x167" href="/icons/pwa/apple-touch-icon-167x167.png">

<!-- iOS Splash Screens -->
<link rel="apple-touch-startup-image"
      href="/splash/apple-splash-1125-2436.png"
      media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image"
      href="/splash/apple-splash-1242-2688.png"
      media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image"
      href="/splash/apple-splash-750-1334.png"
      media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image"
      href="/splash/apple-splash-1242-2208.png"
      media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)">
```

### 3. Generate Icons

Use PWA Asset Generator:

```bash
# Install
npm install -g pwa-asset-generator

# Generate from logo
cd frontend
pwa-asset-generator public/assets/logo/meedi8-logo.png public/icons/pwa \
  --background "#7DD3C0" \
  --padding "20%" \
  --manifest public/manifest.json \
  --index index.html
```

**Required icon sizes:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Apple Touch Icons: 120x120, 152x152, 167x167, 180x180

### 4. Create Service Worker

**Location:** `/frontend/public/sw.js`

```javascript
const CACHE_NAME = 'meedi8-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/logo/meedi8-logo.png'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('/offline.html');
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'New notification from Meedi8',
    icon: '/icons/pwa/icon-192x192.png',
    badge: '/icons/pwa/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Meedi8', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 5. Register Service Worker

**Location:** `/frontend/src/main.jsx`

Add at the end:

```javascript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### 6. Create Offline Page

**Location:** `/frontend/public/offline.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meedi8 - Offline</title>
  <style>
    body {
      font-family: 'Nunito', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%);
      text-align: center;
      padding: 20px;
    }
    h1 { color: #7DD3C0; margin-bottom: 10px; }
    p { color: #6b7280; max-width: 300px; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    button {
      margin-top: 20px;
      padding: 12px 24px;
      background: #7DD3C0;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="icon">📡</div>
  <h1>You're Offline</h1>
  <p>Take a moment to breathe. We'll reconnect when your internet returns.</p>
  <button onclick="location.reload()">Try Again</button>
</body>
</html>
```

---

## Phase 2: Install Experience (Day 3-4)

### 1. Custom Install Prompt Hook

**Location:** `/frontend/src/hooks/useInstallPrompt.js`

```javascript
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    return outcome === 'accepted';
  };

  return { isInstallable, isInstalled, promptInstall };
}
```

### 2. Install Prompt Component

**Location:** `/frontend/src/components/InstallPrompt.jsx`

```javascript
import React, { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt({ context = 'default' }) {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || isInstalled || dismissed) return null;

  const messages = {
    'waiting-room': {
      title: "Don't miss it",
      body: "Get notified when the other person joins",
      cta: "Enable Notifications"
    },
    'after-coaching': {
      title: "Stay connected",
      body: "Install Meedi8 to continue your mediation journey",
      cta: "Install App"
    },
    'default': {
      title: "Better experience",
      body: "Add Meedi8 to your home screen for quick access",
      cta: "Add to Home"
    }
  };

  const msg = messages[context] || messages.default;

  return (
    <div style={{
      background: '#f0fdf4',
      border: '1px solid #7DD3C0',
      borderRadius: '12px',
      padding: '16px',
      margin: '16px 0',
      position: 'relative'
    }}>
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af'
        }}
      >
        ×
      </button>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#374151' }}>
        {msg.title}
      </h3>
      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
        {msg.body}
      </p>
      <button
        onClick={promptInstall}
        style={{
          background: '#7DD3C0',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        {msg.cta}
      </button>
    </div>
  );
}
```

### 3. iOS Install Guide

**Location:** `/frontend/src/components/IOSInstallGuide.jsx`

```javascript
import React, { useState } from 'react';

export default function IOSInstallGuide() {
  const [dismissed, setDismissed] = useState(false);

  // Only show on iOS Safari, not already installed
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
  const hasSeenGuide = localStorage.getItem('meedi8-ios-guide-seen');

  if (!isIOS || isInStandaloneMode || dismissed || hasSeenGuide) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('meedi8-ios-guide-seen', 'true');
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      margin: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Add to Home Screen</h3>
      <ol style={{ margin: '0', paddingLeft: '20px', color: '#6b7280' }}>
        <li style={{ marginBottom: '8px' }}>
          Tap the <strong>Share</strong> button (box with arrow)
        </li>
        <li style={{ marginBottom: '8px' }}>
          Scroll down and tap <strong>"Add to Home Screen"</strong>
        </li>
        <li>
          Tap <strong>"Add"</strong> in the top right
        </li>
      </ol>
      <button
        onClick={handleDismiss}
        style={{
          marginTop: '12px',
          background: '#7DD3C0',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Got it
      </button>
    </div>
  );
}
```

---

## Phase 3: Push Notifications (Day 5-7)

### 1. Generate VAPID Keys

```bash
# Install web-push
npm install web-push -g

# Generate keys
web-push generate-vapid-keys
```

Save the keys:
- **Public Key** → `VITE_VAPID_PUBLIC_KEY` (frontend)
- **Private Key** → `VAPID_PRIVATE_KEY` (backend)

### 2. Backend Push Service

**Location:** `/backend/app/services/push_notification_service.py`

```python
from pywebpush import webpush, WebPushException
import json
import os

class PushNotificationService:
    def __init__(self):
        self.vapid_private_key = os.getenv('VAPID_PRIVATE_KEY')
        self.vapid_claims = {
            'sub': 'mailto:support@meedi8.com'
        }

    async def send_notification(self, subscription: dict, payload: dict):
        try:
            webpush(
                subscription_info=subscription,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims
            )
            return True
        except WebPushException as e:
            print(f"Push failed: {e}")
            return False

    async def notify_user2_joined(self, user_subscription: dict, room_id: str):
        await self.send_notification(user_subscription, {
            'title': "They're ready to talk",
            'body': "Take a breath and join the mediation",
            'url': f'/rooms/{room_id}/main-room',
            'actions': [
                {'action': 'join', 'title': 'Join Now'}
            ]
        })

    async def notify_your_turn(self, user_subscription: dict, room_id: str):
        await self.send_notification(user_subscription, {
            'title': "Space to speak",
            'body': "It's your turn in the mediation",
            'url': f'/rooms/{room_id}/main-room'
        })

    async def notify_break_ending(self, user_subscription: dict, room_id: str):
        await self.send_notification(user_subscription, {
            'title': "Ready to return?",
            'body': "Your break ends in 2 minutes",
            'url': f'/rooms/{room_id}/main-room',
            'actions': [
                {'action': 'return', 'title': 'Return Now'},
                {'action': 'extend', 'title': 'Need More Time'}
            ]
        })

push_service = PushNotificationService()
```

### 3. Backend Subscription Endpoint

**Location:** `/backend/app/routes/notifications.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/subscribe")
async def subscribe_to_push(
    subscription: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save push subscription for user"""
    current_user.push_subscription = subscription
    db.commit()
    return {"success": True}

@router.delete("/subscribe")
async def unsubscribe_from_push(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove push subscription"""
    current_user.push_subscription = None
    db.commit()
    return {"success": True}
```

### 4. Frontend Subscription

**Location:** `/frontend/src/services/pushNotifications.js`

```javascript
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export async function subscribeToPush(token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Send to backend
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });

    return true;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return false;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

---

## Phase 4: Meedi8-Specific Features

### 1. "Calm Before" Breathing Exercise

Show before entering mediation session:

```javascript
// CalmBefore.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CalmBefore({ onComplete, onSkip }) {
  const [breathCount, setBreathCount] = useState(0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)'
    }}>
      <h2 style={{ color: '#7DD3C0', marginBottom: '20px' }}>
        Take a moment
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Three breaths to center yourself
      </p>

      {/* Breathing circle */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 4,
          repeat: 3,
          onRepeat: () => setBreathCount(c => c + 1)
        }}
        onAnimationComplete={onComplete}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(125, 211, 192, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ fontSize: '24px', color: '#7DD3C0' }}>
          {breathCount + 1}/3
        </span>
      </motion.div>

      <button
        onClick={onSkip}
        style={{
          marginTop: '40px',
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer'
        }}
      >
        Skip
      </button>
    </div>
  );
}
```

### 2. Contextual Install Prompts

Show at strategic moments:

```javascript
// In Lobby.jsx (waiting for User 2)
import InstallPrompt from '../components/InstallPrompt';

// Show when waiting
{isWaiting && <InstallPrompt context="waiting-room" />}

// In CoachingChat.jsx (after completing coaching)
{coachingComplete && <InstallPrompt context="after-coaching" />}
```

### 3. Offline Session Cache

Cache completed sessions for offline viewing:

```javascript
// sessionCache.js
import { openDB } from 'idb';

const DB_NAME = 'meedi8-sessions';

export async function cacheSession(session) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('sessions', { keyPath: 'id' });
    }
  });

  await db.put('sessions', {
    id: session.id,
    topic: session.topic,
    createdAt: session.created_at,
    yourNeeds: session.your_needs,
    keyInsight: session.key_insight,
    cachedAt: new Date().toISOString()
  });
}

export async function getCachedSessions() {
  const db = await openDB(DB_NAME, 1);
  return db.getAll('sessions');
}
```

---

## Testing Checklist

### Lighthouse PWA Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Run audit
5. Fix any issues

### Manual Testing
- [ ] Install on Android Chrome
- [ ] Install on iOS Safari (Add to Home Screen)
- [ ] Opens in standalone mode (no browser chrome)
- [ ] Splash screen shows on iOS
- [ ] Works offline (shows offline page)
- [ ] Push notifications work
- [ ] App shortcuts appear (long press icon)

### Tools
- **PWA Builder:** https://pwabuilder.com
- **Maskable.app:** https://maskable.app/editor
- **Lighthouse:** Chrome DevTools

---

## Environment Variables

### Frontend (.env.local)
```
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

### Backend (.env)
```
VAPID_PRIVATE_KEY=your_private_key_here
```

---

## Future Enhancements

### Play Store (TWA)
Use Bubblewrap to wrap PWA for Play Store:
```bash
npm install -g @aspect-build/aspect-cli
aspect build
```

### iOS App Store
Use Capacitor to create native iOS wrapper if PWA limitations are too restrictive.

### Advanced Features
- Background sync for offline messages
- Periodic background sync for updates
- Web Share Target API
- Badging API for unread count
- File System Access for exports

---

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Workbox](https://developers.google.com/web/tools/workbox) - Service worker library
