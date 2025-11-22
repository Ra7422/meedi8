# Architecture Decisions

Log of key technical decisions with context.

---

## 2025-11-22

### Gamification Scoring System

**Decision:** Health score 0-100 with decay, not XP accumulation

**Context:**
- XP systems feel "gamey" and can trivialize relationship work
- Health score creates urgency (loss aversion) without feeling like a game
- Score can go down, which motivates consistent engagement

**Alternatives Considered:**
- Pure XP leveling (rejected: too gamey)
- No numerical score (rejected: need measurable progress)

---

### Streak Protection as PRO Feature

**Decision:** Only PLUS/PRO subscribers can protect streaks

**Context:**
- Creates high-value conversion moment when streak is at risk
- Free users feel the pain of losing streak → motivation to upgrade
- Limit to once per week to prevent abuse

---

### Idempotent Migrations

**Decision:** All migrations check if tables/columns exist before creating

**Context:**
- Railway deployments can retry migrations
- Prevents "already exists" errors on redeploy
- Pattern: `if 'table_name' not in existing_tables:`

---

### Separate Gamification Context

**Decision:** GamificationContext.jsx separate from AuthContext

**Context:**
- Gamification state is independent of auth
- Can fetch gamification data after auth completes
- Cleaner separation of concerns
- Auto-fetches on login, clears on logout

---

## Template

```markdown
### [Decision Title]

**Decision:** [What was decided]

**Context:**
[Why this decision was made]

**Alternatives Considered:**
- [Alternative 1] (rejected: [reason])
- [Alternative 2] (rejected: [reason])
```
