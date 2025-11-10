# Railway Deployment Fix - Database Migration Issue

## The Problem

Railway is failing with: `sqlite3.OperationalError: table rooms already exists`

This happens because:
1. Railway is using SQLite (which persists between deployments)
2. The database already has tables from a previous deployment
3. Alembic is trying to create tables that already exist

## Solution 1: Add PostgreSQL Database (RECOMMENDED)

### In Railway Dashboard:

1. Click **"+ New"** in your meedi8 project
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically adds `DATABASE_URL` environment variable
4. **Redeploy** your backend service

✅ **This will use a fresh PostgreSQL database with no conflicts**

---

## Solution 2: Update Start Command (Quick Fix)

If you want to stick with SQLite for now:

### In Railway → meedi8 → Settings:

Find **"Start Command"** and update it to:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

(Remove `alembic upgrade head &&` from the beginning)

⚠️ **Note**: This means migrations won't run automatically. You'll need to run them manually when needed.

---

## Solution 3: Reset Database (Nuclear Option)

If you want to keep SQLite but start fresh:

### In Railway:

1. Go to your backend service
2. Click **"Variables"** tab
3. Add a new variable:
   ```
   DATABASE_URL=sqlite:///./meedi8.db
   ```
4. **Redeploy**

This will use a new SQLite database file.

---

## My Recommendation

Use **Solution 1** (Add PostgreSQL):
- ✅ Production-ready
- ✅ Fresh database with no migration conflicts
- ✅ Better performance
- ✅ Railway provides it for free in their starter plan

Just click "+ New" → "Database" → "PostgreSQL" in your Railway project!
