# PWA.md - Progressive Web App (PWA) Implementation Guide

This document outlines the strategy, implementation details, and best practices for transforming the Meedi8 web application into a Progressive Web App (PWA).

## 1. PWA Strategy & Rationale

**Goal:** To reach 1 million users by providing a low-friction, app-like experience across all platforms (web, Android, iOS) while leveraging our existing codebase and avoiding app store fees.

**Why PWA for Meedi8?**

*   **User Acquisition:** PWAs offer instant access via a URL, removing the download barrier of traditional app stores. This is crucial for Meedi8's invite-link-driven user flow and scaling to a large user base.
*   **Cost-Effectiveness:** By building on our existing React frontend, we avoid the significant development and maintenance costs of separate native iOS and Android applications.
*   **Revenue Protection:** PWAs allow us to continue using our Stripe-based subscription model without being subject to the 15-30% revenue share imposed by Apple and Google on in-app purchases.
*   **Rapid Iteration:** Updates are deployed instantly to the web server, meaning users always have the latest version without manual updates or app store review delays.
*   **App-like Experience:** PWAs provide features like "Add to Home Screen" icons, offline capabilities, and push notifications, offering a seamless user experience.

## 2. Implementation Steps

The following steps detail how to implement PWA features for Meedi8.

### Step 1: Web App Manifest (`manifest.json`)

The Web App Manifest is a JSON file that tells the browser about your PWA and how it should behave when installed on the user's device.

*   **Location:** `frontend/public/manifest.json`
*   **Content:**
    ```json
    {
      "name": "Meedi8",
      "short_name": "Meedi8",
      "description": "AI-powered mediation platform for conflict resolution.",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#7DD3C0",
      "icons": [
        {
          "src": "/assets/icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "/assets/icons/icon-512x512.png",
          "sizes": "512x512",
          "type": "image/png"
        },
        {
          "src": "/assets/icons/icon-maskable-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable"
        },
        {
          "src": "/assets/icons/icon-maskable-512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "maskable"
        }
      ]
    }
    ```
*   **Integration:** Link the manifest in `frontend/index.html` within the `<head>` section:
    ```html
    <link rel="manifest" href="/manifest.json" />
    ```

### Step 2: PWA Icons

These are the visual assets used when the PWA is installed on a device.

*   **Location:** `frontend/public/assets/icons/`
*   **Required Files:**
    *   `icon-192x192.png`
    *   `icon-512x512.png`
    *   `icon-maskable-192x192.png`
    *   `icon-maskable-512x512.png`
*   **Best Practice:** Ensure these icons are high-quality, branded, and the maskable versions have sufficient padding to adapt to various icon shapes.

### Step 3: Service Worker Registration

A Service Worker is a JavaScript file that runs in the background, separate from the web page. It enables features like offline support, push notifications, and caching.

*   **Location:** `frontend/public/sw.js` (or `frontend/src/sw.js` if using a build tool to process it)
*   **Basic `sw.js` Content (Example - will be expanded):**
    ```javascript
    // frontend/public/sw.js
    self.addEventListener('install', (event) => {
      console.log('Service Worker installing.');
      // Perform install steps, e.g., cache static assets
      event.waitUntil(
        caches.open('meedi8-static-v1').then((cache) => {
          return cache.addAll([
            '/',
            '/index.html',
            '/manifest.json',
            '/assets/icons/icon-192x192.png',
            '/assets/icons/icon-512x512.png',
            // Add other critical static assets here
          ]);
        })
      );
    });

    self.addEventListener('fetch', (event) => {
      event.respondWith(
        caches.match(event.request).then((response) => {
          return response || fetch(event.request);
        })
      );
    });

    self.addEventListener('activate', (event) => {
      console.log('Service Worker activating.');
      // Clean up old caches
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.filter((cacheName) => {
              return cacheName.startsWith('meedi8-') && cacheName !== 'meedi8-static-v1';
            }).map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        })
      );
    });
    ```
*   **Registration in Frontend:** Register the service worker in `frontend/src/main.jsx` (or `App.jsx` or similar entry point).
    ```javascript
    // frontend/src/main.jsx (or similar entry point)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
    ```

### Step 4: Push Notifications (Future Enhancement)

Once the basic PWA is established, push notifications can be integrated for real-time alerts (e.g., turn notifications, break requests).

*   **Backend Integration:** Requires a backend service to send push messages (e.g., using web-push library in Python).
*   **Frontend Integration:** Service Worker will handle receiving and displaying notifications. User consent will be required.
*   **iOS Support:** Web Push Notifications are supported on iOS 16.4+ for PWAs added to the home screen.

### Step 5: Offline Strategy (Future Enhancement)

Enhance the service worker to provide a more robust offline experience, potentially caching dynamic content or providing an offline fallback page.

## 3. Testing and Debugging

*   **Browser Developer Tools:** Use the "Application" tab in Chrome DevTools (or similar in Firefox/Edge) to inspect:
    *   **Manifest:** Verify `manifest.json` is loaded correctly.
    *   **Service Workers:** Check registration status, lifecycle, and console output.
    *   **Cache Storage:** Inspect cached assets.
*   **Lighthouse Audit:** Run a Lighthouse audit (built into Chrome DevTools) to get a score and recommendations for PWA compliance.
*   **"Add to Home Screen" Prompt:** Test the installation prompt on various devices (Android, iOS).
*   **Offline Mode:** Test functionality by enabling "Offline" in DevTools or by disconnecting from the internet.

## 4. Key Considerations

*   **HTTPS:** PWAs require HTTPS. Our Vercel/Railway deployment already handles this.
*   **User Experience:** Design the PWA to feel as native as possible, with smooth transitions and responsive layouts.
*   **Asset Management:** Ensure all critical assets (icons, fonts, core CSS/JS) are cached by the service worker for optimal performance.
*   **Vite Configuration:** Depending on how Vite is configured, the service worker might need to be placed in `public` or handled by a specific Vite plugin to ensure it's correctly served at the root. For simplicity, placing `sw.js` in `public` is often the easiest approach.

---