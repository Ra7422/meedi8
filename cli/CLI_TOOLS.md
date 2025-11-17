# CLI Tools Reference

External command-line tools used in the Meedi8 project.

## Production Deployment

### Railway (Backend Hosting)

**What:** Platform-as-a-Service for deploying backend FastAPI application with PostgreSQL database.

**Installation:**
```bash
npm install -g @railway/cli
railway login
```

**Common Commands:**
```bash
# Link to project
railway link

# View logs
railway logs

# View environment variables
railway variables

# Open dashboard
railway open

# Deploy manually (usually auto-deploys from GitHub)
railway up --detach

# Redeploy existing build
railway redeploy --service meedi8 --yes

# SSH into container
railway shell

# Run command in container
railway run <command>
```

**Project Details:**
- Service name: `meedi8`
- Project: `secure-creation`
- Auto-deploys from `main` branch on GitHub
- Database: PostgreSQL included
- URL: https://meedi8-production.up.railway.app

**Dashboard:** https://railway.app

### Vercel (Frontend Hosting)

**What:** Platform for deploying React applications with automatic SSL and CDN.

**Installation:**
```bash
npm install -g vercel
vercel login
```

**Common Commands:**
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View logs
vercel logs

# List deployments
vercel ls

# View environment variables
vercel env ls

# Add environment variable
vercel env add

# Open dashboard
vercel
```

**Project Details:**
- Auto-deploys from `main` branch on GitHub
- Preview deployments for PRs
- URL: https://meedi8.vercel.app
- Custom domain (pending): https://meedi8.com

**Dashboard:** https://vercel.com/dashboard

## Version Control

### Git

**Common Workflow:**
```bash
# Check status
git status

# View recent commits
git log --oneline -20

# Create branch
git checkout -b feature/description

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View diff
git diff

# Revert commit (safe - creates new commit)
git revert <commit-hash>

# Rollback to specific commit (destructive)
git reset --hard <commit-hash>
```

**Branches:**
- `main` - Production branch (auto-deploys)
- Feature branches: `feature/description`
- Hotfix branches: `hotfix/description`

## Package Management

### pip (Python)

```bash
# Install dependencies
pip install -r requirements.txt

# Add new package
pip install package-name
pip freeze > requirements.txt

# List installed packages
pip list

# Check outdated packages
pip list --outdated

# Update package
pip install --upgrade package-name
```

### npm (Node.js)

```bash
# Install dependencies
npm install

# Add new package
npm install package-name
npm install --save-dev package-name  # Dev dependency

# List installed packages
npm list --depth=0

# Check outdated packages
npm outdated

# Update packages
npm update

# Security audit
npm audit
npm audit fix
```

## Database Tools

### Alembic (Database Migrations)

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history

# Manually set revision
alembic stamp <revision>

# Generate SQL without applying
alembic upgrade head --sql
```

### psql (PostgreSQL CLI)

```bash
# Connect to Railway database (from Railway shell)
railway run psql $DATABASE_URL

# Local PostgreSQL
psql -U postgres -d meedi

# Common commands (inside psql)
\dt          # List tables
\d users     # Describe users table
\l           # List databases
\q           # Quit

# Run query
SELECT * FROM users LIMIT 10;

# Export data
\copy users TO 'users.csv' CSV HEADER
```

### sqlite3 (Local Development)

```bash
# Open database
sqlite3 backend/meedi.db

# Common commands (inside sqlite3)
.tables                    # List tables
.schema users              # Show table schema
.quit                      # Exit

# Run query
SELECT * FROM users;

# Export to CSV
.mode csv
.output users.csv
SELECT * FROM users;
.quit
```

## API Testing

### curl

```bash
# Health check
curl https://meedi8-production.up.railway.app/health

# GET request with auth
curl -H "Authorization: Bearer TOKEN" \
     https://meedi8-production.up.railway.app/rooms/

# POST request with JSON
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"key": "value"}' \
     https://meedi8-production.up.railway.app/endpoint

# Save response to file
curl https://api.example.com/data > response.json

# Follow redirects
curl -L https://example.com
```

### httpie (Alternative to curl)

```bash
# Install
pip install httpie

# GET request
http GET https://meedi8-production.up.railway.app/health

# POST with auth
http POST https://api.example.com/endpoint \
     Authorization:"Bearer TOKEN" \
     key=value
```

## Design Tools

### Canva (Brand Assets)

**What:** Design tool for creating Meedi8 illustrations, logos, and marketing materials.

**Web-based:** https://canva.com

**Project Assets:**
- Meedi character illustrations
- Brand colors: Teal (#7DD3C0), Purple (#CCB2FF)
- Logo variations (PNG, SVG)

**Export Settings:**
- Format: PNG (transparent) or SVG
- Size: Original dimensions
- Location: `frontend/public/assets/illustrations/`

**Files:**
- `meedi standing.svg` - Hero character
- `family.svg` - Two people mediation
- `Meedi_sit_bubble.svg` - Solo mode
- `meedi8-logo.png` - Logo for PDFs

### Figma (UI Design)

**Web-based:** https://figma.com

**Export to Code:**
```bash
# From frontend directory
npm run export-figma            # Export designs
npm run export-figma:browser    # Browser-based
npm run export-figma:debug      # Debug mode
npm run test:visual             # Visual tests
```

## External APIs

### Stripe CLI (Payment Testing)

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listen for webhooks (local testing)
stripe listen --forward-to localhost:8000/subscriptions/webhook

# Trigger test events
stripe trigger payment_intent.succeeded

# View logs
stripe logs tail
```

**Dashboard:** https://dashboard.stripe.com

### SendGrid CLI (Email)

**Web-based Dashboard Only:** https://app.sendgrid.com

**Testing Locally:**
```bash
# Run test script
python backend/test_email.py
```

## Monitoring & Logging

### Railway Logs

```bash
# View live logs
railway logs --service meedi8

# Filter logs
railway logs | grep ERROR

# Save to file
railway logs > logs.txt
```

### Vercel Logs

```bash
# View logs
vercel logs meedi8.vercel.app

# Filter by deployment
vercel logs --deployment <deployment-url>
```

## Utilities

### jq (JSON Processing)

```bash
# Install
brew install jq

# Pretty print JSON
curl https://api.example.com/data | jq

# Extract field
curl https://api.example.com/data | jq '.field'

# Filter array
curl https://api.example.com/data | jq '.[] | select(.status == "active")'
```

### grep (Search)

```bash
# Search in files
grep -r "search term" backend/app/

# Case insensitive
grep -ri "search term" .

# Show line numbers
grep -n "search term" file.py

# Exclude directories
grep -r "term" --exclude-dir=node_modules .
```

## Docker (Optional)

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Execute command in container
docker exec -it cleanair_backend bash

# Rebuild containers
docker-compose build

# Remove all containers and volumes
docker-compose down -v
```

## Environment Management

### direnv (Auto-load .env)

```bash
# Install
brew install direnv

# Setup
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
# or for zsh
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc

# Allow directory
cd /path/to/project
direnv allow
```

## Performance

### Artillery (Load Testing)

```bash
# Install
npm install -g artillery

# Run test
artillery quick --count 10 --num 100 https://meedi8-production.up.railway.app/health

# Custom script
artillery run load-test.yml
```

### Lighthouse (Frontend Performance)

```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse https://meedi8.vercel.app --view

# CI mode
lighthouse https://meedi8.vercel.app --output json --output-path ./report.json
```

## Security

### npm audit

```bash
# Check vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Force fix (may have breaking changes)
npm audit fix --force
```

### Safety (Python Security)

```bash
# Install
pip install safety

# Check dependencies
safety check

# Check requirements.txt
safety check -r requirements.txt
```

## Quick Reference

| Tool | Purpose | Install | Docs |
|------|---------|---------|------|
| Railway | Backend hosting | `npm i -g @railway/cli` | [Docs](https://docs.railway.app) |
| Vercel | Frontend hosting | `npm i -g vercel` | [Docs](https://vercel.com/docs) |
| Alembic | DB migrations | (in requirements.txt) | [Docs](https://alembic.sqlalchemy.org) |
| Stripe CLI | Payment testing | `brew install stripe/stripe-cli/stripe` | [Docs](https://stripe.com/docs/cli) |
| psql | PostgreSQL CLI | (comes with PostgreSQL) | [Docs](https://www.postgresql.org/docs/) |
| jq | JSON processing | `brew install jq` | [Docs](https://stedolan.github.io/jq/) |
