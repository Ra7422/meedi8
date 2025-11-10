# Environment Variables Migration Checklist

## ✅ What I've Done Automatically

1. ✅ Created `backend/.env` with your Anthropic API key
2. ✅ Created `frontend/.env.local` template
3. ✅ Both files are in `.gitignore` (won't be committed)

---

## 📋 What YOU Need to Do (Copy from Railway/Vercel)

### Railway Backend Variables

Go to Railway → **clean-air project** → **Variables tab** → Copy these:

```
Variable Name                   | Notes
--------------------------------|-----------------------------------------------
ANTHROPIC_API_KEY               | ✅ Already set locally (from your .env file)
OPENAI_API_KEY                  | ⚠️ Your local .env has a shell command, get real key from Railway
STRIPE_SECRET_KEY               | 📋 Copy from Railway clean-air
TELEGRAM_BOT_TOKEN              | 📋 Copy from Railway clean-air (or use placeholder)
DATABASE_URL                    | 🆕 Add PostgreSQL in new Railway project (don't copy old one)
FRONTEND_URL                    | 🆕 Set to https://temp.com (update after Vercel)
```

**Railway Clean-Air URL to check**: https://railway.app/project/[your-project-id]

---

### Vercel Frontend Variables

Go to Vercel → **clean-air project** → **Settings** → **Environment Variables** → Copy these:

```
Variable Name                   | Value to Copy from clean-air
--------------------------------|-----------------------------------------------
VITE_GOOGLE_CLIENT_ID          | 📋 Copy exact value from Vercel
VITE_FACEBOOK_APP_ID           | 📋 Copy exact value from Vercel
VITE_TELEGRAM_BOT_NAME         | 📋 Copy exact value from Vercel
VITE_API_URL                   | 🆕 UPDATE to your NEW Railway backend URL
```

**Vercel Clean-Air URL to check**: https://vercel.com/[your-username]/clean-air/settings/environment-variables

---

## 🎯 Step-by-Step Deployment Instructions

### Step 1: Deploy to Railway (5 minutes)

1. **Open Railway**: https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"** → Select **"meedi8"**
3. Railway auto-detects `railway.toml` ✨
4. **Add Variables** (click **"Variables"** tab):

   ```bash
   # Copy these from clean-air Railway project:
   ANTHROPIC_API_KEY=[copy-from-railway-clean-air]
   OPENAI_API_KEY=[copy-from-railway-clean-air]
   STRIPE_SECRET_KEY=[copy-from-railway-clean-air]
   TELEGRAM_BOT_TOKEN=[copy-from-railway-clean-air]

   # Add this new variable:
   FRONTEND_URL=https://temp.com
   ```

5. **Optional**: Add PostgreSQL
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - Railway automatically sets `DATABASE_URL`

6. **Save your Railway URL**: `https://meedi8-production-XXXX.up.railway.app`

---

### Step 2: Deploy to Vercel (5 minutes)

1. **Open Vercel**: https://vercel.com
2. Click **"Add New"** → **"Project"** → Import **"meedi8"** from GitHub
3. Vercel auto-detects `vercel.json` ✨
4. **Add Variables** (in deployment settings before clicking Deploy):

   ```bash
   # Copy these from clean-air Vercel project:
   VITE_GOOGLE_CLIENT_ID=[get-from-vercel-clean-air]
   VITE_FACEBOOK_APP_ID=[get-from-vercel-clean-air]
   VITE_TELEGRAM_BOT_NAME=[get-from-vercel-clean-air]

   # UPDATE this to your NEW Railway backend URL:
   VITE_API_URL=https://meedi8-production-XXXX.up.railway.app
   ```

5. Click **"Deploy"**
6. **Save your Vercel URL**: `https://meedi8-XXXX.vercel.app`

---

### Step 3: Update CORS (2 minutes)

1. Go back to **Railway** → **meedi8 project** → **Variables**
2. Update `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=https://meedi8-XXXX.vercel.app
   ```
3. Railway auto-redeploys ✅

---

## 🔍 How to Find Your Clean-Air Keys

### From Railway Dashboard:

1. Go to https://railway.app
2. Find **clean-air** project
3. Click on the service (backend)
4. Click **"Variables"** tab
5. Click the **👁️ eye icon** next to each variable to reveal value
6. Copy and paste into new meedi8 project

### From Vercel Dashboard:

1. Go to https://vercel.com
2. Find **clean-air** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Show"** button next to each variable
5. Copy and paste into new meedi8 project

---

## ⚠️ Important Notes

1. **OPENAI_API_KEY**: Your local `.env` has a shell validation command. Get the real API key from Railway.

2. **DATABASE_URL**: Don't copy from old project. Create NEW PostgreSQL in Railway meedi8 project.

3. **OAuth Redirect URIs**: After deploying, update these:
   - **Google**: https://console.cloud.google.com/ → Add `https://meedi8-XXXX.vercel.app`
   - **Facebook**: https://developers.facebook.com/ → Add `https://meedi8-XXXX.vercel.app`
   - Keep old URLs so clean-air still works

4. **Stripe**: Same key = same products/customers for both apps

5. **Local Development**: Your local `.env` files are already configured!

---

## ✅ Verification Checklist

After deployment, test:

- [ ] Backend health: `https://your-railway-url/health` → Should return `{"ok": true}`
- [ ] Frontend loads: `https://your-vercel-url`
- [ ] Login page appears correctly
- [ ] No console errors in browser
- [ ] Check Railway logs for startup errors
- [ ] Check Vercel deployment logs

---

## 🆘 If You Get Stuck

1. **Railway deployment fails**: Check Railway logs for error messages
2. **Vercel build fails**: Check build logs for SSR-related errors
3. **CORS errors**: Make sure `FRONTEND_URL` in Railway matches Vercel URL exactly
4. **OAuth not working**: Check redirect URIs in Google/Facebook consoles

---

## 📞 Need Me To Help?

Once you've deployed, I can:
- ✅ Test your endpoints
- ✅ Debug any errors
- ✅ Update code if needed
- ✅ Check logs and diagnose issues

Just paste your Railway and Vercel URLs and I'll verify everything is working!
