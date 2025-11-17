# Meedi8 CLI Documentation

This directory contains organized project documentation for AI-assisted development of Meedi8, split into focused files under 400 lines each.

## Documentation Structure

### Project Management
- **[TODO.md](TODO.md)** - Current tasks, blockers, and next steps
- **[STATUS.md](STATUS.md)** - Current development status and recent updates
- **[ROADMAP.md](ROADMAP.md)** - Future features and implementation phases

### Development
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Local setup, commands, and workflows
- **[CLI_TOOLS.md](CLI_TOOLS.md)** - External CLI tools (Railway, Vercel, Canva, etc.)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data models
- **[AI_SERVICES.md](AI_SERVICES.md)** - AI mediator and coach implementation

### Implementation Guides
- **[PATTERNS.md](PATTERNS.md)** - Critical coding patterns and conventions
- **[FEATURES_PART1.md](FEATURES_PART1.md)** - Core features (OAuth, subscriptions, email)
- **[FEATURES_PART2.md](FEATURES_PART2.md)** - Additional features (PDF reports, file uploads)
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and debugging

### Deployment
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment and rollback guides
- **[ENVIRONMENT.md](ENVIRONMENT.md)** - Environment variables and configuration

## Quick Reference

**What's Meedi8?** An AI-powered mediation platform using Nonviolent Communication (NVC) principles.

**Tech Stack:**
- Frontend: React + Vite (deployed on Vercel)
- Backend: FastAPI (deployed on Railway)
- Database: PostgreSQL (production) / SQLite (local)
- AI: Claude Sonnet 4.5 (Anthropic)

**Production URLs:**
- Frontend: https://meedi8.vercel.app
- Backend: https://meedi8-production.up.railway.app

## Usage Tips for AI Assistants

1. **Start with STATUS.md** to understand current project state
2. **Check TODO.md** for pending work and blockers
3. **Reference PATTERNS.md** for critical coding conventions
4. **Use TROUBLESHOOTING.md** when encountering errors
5. **Consult ARCHITECTURE.md** for system design questions

## File Size Guidelines

All files are kept under 400 lines for optimal AI context management. Complex topics are split across multiple files (e.g., FEATURES_PART1/PART2).
