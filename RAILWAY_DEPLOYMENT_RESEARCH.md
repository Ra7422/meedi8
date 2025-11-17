# Railway Deployment Cache Issues - Research Report

**Research Date:** 2025-11-17
**Issue:** Railway shows correct commit hash (17a028c) but deployed code doesn't match
**Deployment ID:** 70228baf-e947-4130-9164-5be33b74b2ba
**Status:** SUCCESS (but wrong code deployed)

## Executive Summary

Railway has a known issue where deployments show the correct commit hash and SUCCESS status, but the actual running code doesn't reflect the latest changes. This is primarily caused by **Docker build layer caching** that persists old code despite new commits. The issue is compounded by **Python logging buffering** which prevents startup logs from appearing in Railway's log viewer.

### Root Causes Identified

1. **Docker Build Cache Persistence** - Railway caches Docker layers for faster builds, but service redeployments often reuse cached layers from previous builds
2. **Python Logging Buffering Issue** - Railway requires unbuffered logs; without `PYTHONUNBUFFERED=1`, startup logs never appear
3. **Deployment Configuration Issues** - Some services resolve only by deleting and recreating entirely

---

## Solutions (In Order of Effectiveness)

### ✅ Solution 1: Set NO_CACHE Environment Variable
**Most Recommended by Railway**

```bash
# Via Railway Dashboard
1. Go to service Settings → Variables
2. Add: NO_CACHE=1
3. Redeploy the service
```

**What it does:**
- Disables Docker layer caching entirely
- Forces fresh build of all layers
- Build time increases (e.g., 9s → 54s) but ensures correct code

**Tradeoff:** Slower builds, but guaranteed cache invalidation

---

### ✅ Solution 2: Add PYTHONUNBUFFERED=1
**Critical for Python/FastAPI Applications**

```bash
# Via Railway Dashboard
1. Go to service Settings → Variables
2. Add: PYTHONUNBUFFERED=1
3. Redeploy the service
```

**Why this matters:**
- Railway's logging infrastructure requires unbuffered output
- Python buffers stdout/stderr by default
- Startup logs won't appear without this setting
- May give false impression that code didn't update

**Alternative:** Add to Dockerfile
```dockerfile
ENV PYTHONUNBUFFERED=1
```

---

### ✅ Solution 3: Manual Deploy Latest Commit
**Quick UI-based Fix**

```bash
# Via Railway Dashboard
1. Press CMD+K (or CTRL+K on Windows/Linux)
2. Type "Deploy Latest Commit"
3. Select the command
```

**What it does:**
- Forces Railway to pull and build the latest commit
- Bypasses automatic deployment triggers
- Useful for one-off deployments

---

### ✅ Solution 4: Railway CLI Redeploy
**Command-line Alternative**

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Redeploy the service
railway redeploy --service backend -y

# View deployment logs
railway logs --deployment

# View build logs
railway logs --build
```

**Key commands:**
- `railway up` - Deploy current directory to Railway
- `railway redeploy` - Redeploy currently deployed version
- `railway logs` - View deployment logs
- `railway status` - Check deployment status
- `railway down` - Remove most recent deployment

---

### ⚠️ Solution 5: Force Push Empty Commit
**GitHub-based Cache Bust**

```bash
# Create empty commit to trigger rebuild
git commit --allow-empty -m "Force Railway rebuild - cache bust"
git push origin main
```

**What it does:**
- Creates new commit hash without code changes
- Forces Railway to process a "new" deployment
- May still use cached layers unless NO_CACHE=1 is set

---

### 🔧 Solution 6: Update Dockerfile for Better Cache Control
**Long-term Fix**

```dockerfile
# Add at top of Dockerfile
ARG CACHEBUST=1
ENV PYTHONUNBUFFERED=1

# Use official Python runtime as base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies (cached layer)
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (this layer invalidates on code changes)
COPY . .

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Improvements:**
- `PYTHONUNBUFFERED=1` ensures logs appear
- Copy requirements.txt before code for better caching
- ARG CACHEBUST can be changed to force rebuilds

---

### 🚨 Solution 7: Nuclear Option - Recreate Service
**Last Resort Only**

```bash
# Via Railway Dashboard
1. Note all environment variables
2. Note all service settings
3. Delete the service
4. Create new service with same settings
5. Restore environment variables
6. Deploy
```

**When to use:**
- All other solutions have failed
- Service appears fundamentally misconfigured
- Multiple users report this as the only working solution

**Warning:** Causes downtime and loses deployment history

---

## Specific Recommendations for Your Case

Based on your setup (FastAPI + Dockerfile in `/backend`):

### Immediate Actions (Do These Now)

1. **Add environment variables in Railway dashboard:**
   ```
   NO_CACHE=1
   PYTHONUNBUFFERED=1
   ```

2. **Update Dockerfile** (`/Users/adambrown/code/Meedi8/backend/Dockerfile`):
   ```dockerfile
   # Add after FROM statement
   ENV PYTHONUNBUFFERED=1
   ```

3. **Commit and push:**
   ```bash
   cd /Users/adambrown/code/Meedi8
   git add backend/Dockerfile
   git commit -m "Add PYTHONUNBUFFERED to Dockerfile for Railway logging"
   git push origin main
   ```

4. **Manually trigger deployment:**
   - Press CMD+K in Railway dashboard
   - Select "Deploy Latest Commit"

### Verification Steps

```bash
# Check Railway logs via CLI
railway logs --deployment

# Look for your deployment marker in logs
# If you see it, code updated successfully
# If you don't see it, NO_CACHE=1 is working

# Check deployment status
railway status
```

### Long-term Preventions

1. **Keep PYTHONUNBUFFERED=1 permanently** - Required for Railway Python apps
2. **Use NO_CACHE=1 when debugging** - Remove after confirming deployment works
3. **Structure Dockerfile for optimal caching:**
   - Copy dependencies file first
   - Install dependencies
   - Copy code last (invalidates cache on code changes only)

---

## Railway CLI Quick Reference

```bash
# Installation
npm i -g @railway/cli

# Authentication
railway login

# Link to project
railway link

# Deploy current directory
railway up
railway up --detach  # Don't stream logs

# Redeploy existing deployment
railway redeploy --service backend -y

# View logs
railway logs                    # Recent deployment logs
railway logs --deployment       # Deployment logs
railway logs --build           # Build logs

# Check status
railway status

# Remove deployment
railway down -y

# Open dashboard
railway open
```

---

## Common Issues & Troubleshooting

### Issue: "Deployment SUCCESS but code doesn't match"
**Symptoms:**
- Railway shows correct commit hash
- Deployment status: SUCCESS
- Code doesn't reflect latest changes
- Startup logs missing

**Diagnosis:**
1. Check if it's a caching issue → Set NO_CACHE=1
2. Check if it's a logging issue → Set PYTHONUNBUFFERED=1
3. Check if it's a misconfiguration → Verify branch, service settings

**Solution Path:**
1. Add PYTHONUNBUFFERED=1 (should see logs now)
2. If logs show old code → Add NO_CACHE=1
3. If still broken → Manual "Deploy Latest Commit"
4. If STILL broken → Delete and recreate service

### Issue: "No logs appearing at all"
**Cause:** Python buffering output

**Solution:**
```bash
# Railway dashboard → Variables
PYTHONUNBUFFERED=1
```

**Verification:**
```bash
railway logs --deployment
# Should now see startup logs
```

### Issue: "Build succeeds but container crashes"
**Diagnosis:**
```bash
railway logs --deployment
# Look for Python tracebacks or errors
```

**Common causes:**
- Missing environment variables
- Database connection failures
- Port configuration issues
- Missing dependencies

---

## Railway Configuration Reference

### Current railway.toml
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
numReplicas = 1
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[environments.production]
projectId = "ec1ccb72-fb04-4d48-b079-3e2eb12af14a"
```

**Note:** Railway always builds with Dockerfile when one is found, regardless of railway.toml settings.

### Environment Variables to Set

```bash
# Required for Python/FastAPI on Railway
PYTHONUNBUFFERED=1

# Use when debugging cache issues (slower builds)
NO_CACHE=1

# Your existing variables
ANTHROPIC_API_KEY=***
DATABASE_URL=***
# ... etc
```

---

## Sources Explored

### Official Railway Documentation
- https://docs.railway.com/guides/deployment-actions
- https://docs.railway.com/guides/deployments
- https://docs.railway.com/reference/cli-api
- https://docs.railway.com/guides/dockerfiles
- https://docs.railway.com/reference/config-as-code
- https://docs.railway.com/guides/build-configuration

### Railway Help Station (Community Support)
- Forcing fresh Docker builds on Railway
- Deployment not matching code from GitHub
- Docker content not being updated after build
- Deploy logs doesn't show any logs
- Deployment is running but no logs at all

### Stack Overflow & GitHub
- FastAPI/uvicorn logging issues
- Python PYTHONUNBUFFERED discussions
- Railway deployment troubleshooting
- Docker cache invalidation principles

---

## Confidence Assessment

### High Confidence ✅
- NO_CACHE=1 solves Docker cache issues (Railway-confirmed)
- PYTHONUNBUFFERED=1 required for Python logs (Railway-confirmed)
- Manual "Deploy Latest Commit" forces new deployment (Railway docs)
- Service recreation resolves persistent issues (multiple user reports)

### Medium Confidence ⚠️
- Empty commit push may not bypass cache without NO_CACHE=1
- Dockerfile restructuring helps but not guaranteed
- Railway CLI redeploy behavior (limited documentation)

### Low Confidence ❌
- Root cause of "misconfiguration" in some cases unclear
- Why some services work fine and others don't (inconsistent)
- Whether Railway is working on permanent fix (no roadmap visibility)

---

## Key Takeaways

1. **Docker build layer caching** is the primary cause of stale deployments on Railway
2. **PYTHONUNBUFFERED=1** is critical for Python apps - without it, logs never appear
3. **NO_CACHE=1** forces fresh builds but increases build time
4. **Manual "Deploy Latest Commit"** via CMD+K often resolves issues
5. **Service recreation** is nuclear option but sometimes necessary
6. **Railway CLI** provides better visibility into deployment status than dashboard

---

**Research completed:** 2025-11-17
**Total sources consulted:** 25+ (Railway docs, Help Station, Stack Overflow, GitHub)
**Recommended solution:** NO_CACHE=1 + PYTHONUNBUFFERED=1 environment variables
