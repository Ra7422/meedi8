# Quick Deploy Guide - Railway + Vercel

Your repository is ready! I've created `railway.toml` and `vercel.json` configuration files that will make deployment automatic.

## What I've Done

✅ Created `railway.toml` - Railway will auto-detect backend settings
✅ Created `vercel.json` - Vercel will auto-detect frontend settings
✅ Health check endpoint exists at `/health`
✅ Code pushed to GitHub: https://github.com/Ra7422/meedi8.git

## Deploy Steps (You'll do this in browser)

### 1. Deploy Backend to Railway (5 minutes)

1. Open https://railway.app in browser
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **"meedi8"** repository
5. Railway will automatically detect the `railway.toml` configuration!

**Add Environment Variables** (click on your project → Variables tab):
```
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
STRIPE_SECRET_KEY=your-key-here
TELEGRAM_BOT_TOKEN=your-key-here
FRONTEND_URL=https://your-app.vercel.app
```

**Add PostgreSQL** (recommended):
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically sets `DATABASE_URL` environment variable

**Your backend URL will be**: `https://meedi8-production.up.railway.app` (or similar)

💾 **SAVE THIS URL** - You'll need it for Vercel!

---

### 2. Deploy Frontend to Vercel (5 minutes)

1. Open https://vercel.com in browser
2. Click **"Add New"** → **"Project"**
3. Import **"meedi8"** repository from GitHub
4. Vercel will automatically detect the `vercel.json` configuration!

**Add Environment Variables** (Project Settings → Environment Variables):
```
VITE_API_URL=https://meedi8-production.up.railway.app
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_FACEBOOK_APP_ID=your-app-id
VITE_TELEGRAM_BOT_NAME=your-bot-name
```

⚠️ **IMPORTANT**: Use the Railway URL from Step 1!

**Your frontend URL will be**: `https://meedi8.vercel.app` (or similar)

---

### 3. Update CORS (2 minutes)

Now that you have your Vercel URL, go back to Railway:

1. Go to your Railway project → **Variables**
2. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   FRONTEND_URL=https://meedi8.vercel.app
   ```
3. Railway will automatically redeploy with new CORS settings

---

### 4. Update OAuth Redirect URIs (Optional)

If using OAuth in production, update your provider settings:

**Google Cloud Console**:
- Authorized redirect URIs: `https://meedi8.vercel.app`

**Facebook Developers**:
- Valid OAuth Redirect URIs: `https://meedi8.vercel.app`

---

## CLI Alternative (If You Want to Use Terminal)

If you prefer using the command line instead of web dashboards:

### Railway CLI Login:
```bash
# Open a new terminal window and run:
railway login --browserless

# Copy the token from the browser and paste it in terminal
```

### Vercel CLI:
```bash
# Install Vercel CLI
npm install -g vercel

# Login (opens browser)
vercel login

# Deploy from project root
cd /Users/adambrown/code/Meedi8
vercel --prod
```

---

## Verification Checklist

After deployment, verify:

- [ ] Backend health check works: `https://your-backend.railway.app/health`
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] OAuth login works
- [ ] Can create a test mediation session
- [ ] Check Railway logs for errors
- [ ] Check Vercel logs for errors

---

## Continuous Deployment (Automatic!)

Both platforms will auto-redeploy when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main

# Railway and Vercel automatically detect the push and redeploy!
```

---

## Need Help?

Check the detailed guide: `DEPLOYMENT.md`

Or Railway/Vercel documentation:
- https://docs.railway.app
- https://vercel.com/docs
