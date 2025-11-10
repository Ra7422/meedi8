# Deployment Guide

## Prerequisites

1. **GitHub Account** - To host your code
2. **Railway Account** - For backend hosting (railway.app)
3. **Vercel Account** - For frontend hosting (vercel.com)

## Step 1: Push to GitHub

```bash
# Create a new repository on GitHub.com (named "meedi8")
# Then push your code:

git remote add origin https://github.com/YOUR_USERNAME/meedi8.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Railway

### A. Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select the `meedi8` repository
5. Railway will detect the backend automatically

### B. Configure Railway Build Settings

Railway should auto-detect Python, but if not:

**Root Directory:** `backend`
**Build Command:** `pip install -r requirements.txt`
**Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### C. Add Environment Variables in Railway

Go to your Railway project → Variables tab → Add these:

```
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>
STRIPE_SECRET_KEY=<your-stripe-key>
TELEGRAM_BOT_TOKEN=<your-telegram-token>
DATABASE_URL=<railway-will-provide-if-you-add-postgres>
FRONTEND_URL=https://your-app.vercel.app
```

### D. Add PostgreSQL Database (Optional but Recommended)

1. In Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable

### E. Run Database Migrations

In Railway's deployment logs terminal, run:

```bash
alembic upgrade head
```

Or add to Railway start command:
```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### F. Get Your Backend URL

Railway will provide a URL like: `https://meedi8-backend.railway.app`

**Save this URL - you'll need it for Vercel!**

## Step 3: Deploy Frontend to Vercel

### A. Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository (`meedi8`)
4. Configure build settings:

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### B. Add Environment Variables in Vercel

Go to Project Settings → Environment Variables → Add these:

```
VITE_API_URL=https://your-backend.railway.app
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
VITE_FACEBOOK_APP_ID=<your-facebook-app-id>
VITE_TELEGRAM_BOT_NAME=<your-telegram-bot-name>
```

**IMPORTANT:** Use the Railway backend URL from Step 2F!

### C. Deploy

Click "Deploy" - Vercel will build and deploy your frontend.

Your site will be live at: `https://your-project.vercel.app`

## Step 4: Update CORS Settings

Now that you have your Vercel URL, update the backend CORS settings:

### In Railway:

1. Go to Variables tab
2. Add/update:
```
FRONTEND_URL=https://your-project.vercel.app
```

### Update backend/app/main.py:

The CORS middleware should look like this:

```python
from app.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",  # Keep for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push this change - Railway will auto-deploy.

## Step 5: Update OAuth Redirect URIs

Update your OAuth provider settings with your production URLs:

### Google Cloud Console
- Authorized redirect URIs: `https://your-project.vercel.app`

### Facebook Developers
- Valid OAuth Redirect URIs: `https://your-project.vercel.app`

### Telegram
- No changes needed (works with any domain)

## Step 6: Test Your Deployment

1. Visit `https://your-project.vercel.app`
2. Try logging in with OAuth
3. Create a test mediation session
4. Check Railway logs for any backend errors

## Troubleshooting

### Frontend shows "Network Error"
- Check `VITE_API_URL` in Vercel matches your Railway URL
- Ensure Railway backend is running (check deployment logs)

### OAuth not working
- Verify redirect URIs in OAuth provider consoles
- Check browser console for CORS errors
- Ensure `FRONTEND_URL` is set correctly in Railway

### Database connection errors
- Make sure PostgreSQL is added in Railway
- Run migrations: `alembic upgrade head`

### Build fails on Vercel
- Check for SSR issues (missing `typeof window !== 'undefined'` checks)
- Review build logs in Vercel dashboard

## Continuous Deployment

Both Railway and Vercel will automatically redeploy when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Railway and Vercel will auto-deploy!
```

## Custom Domain (Optional)

### For Vercel (Frontend):
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### For Railway (Backend):
1. Go to Project Settings → Domains
2. Add custom domain
3. Update `VITE_API_URL` in Vercel to use new domain

## Monitoring

- **Railway:** View logs in deployment tab
- **Vercel:** View logs in deployment details
- **Errors:** Check browser console and network tab

## Costs

- **Railway:** Free tier includes 500 hours/month
- **Vercel:** Free tier includes unlimited deployments
- **PostgreSQL:** Railway free tier includes small database

Upgrade plans available for production traffic.
