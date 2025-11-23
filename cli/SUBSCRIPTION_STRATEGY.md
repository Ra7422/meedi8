# Meedi8 Subscription Strategy

**Created:** 2025-11-23
**Status:** Planning Phase - Ready for Implementation

---

## Executive Summary

Comprehensive subscription restructuring based on competitor analysis (15-20 services) and gamification psychology research. Key findings: Meedi8 is underpriced, Company tier is high-margin opportunity, reduce FREE tier to increase conversion.

---

## Recommended Tier Structure

| Tier | Monthly | Annual (17% off) | Target User |
|------|---------|------------------|-------------|
| **FREE** | £0 | £0 | Trial users, habit formation |
| **PLUS** | £12.99 | £109/yr | Power users needing protection |
| **PRO** | £24.99 | £209/yr | Premium experience seekers |
| **COMPANY** | £15/seat | Custom | Teams & organizations |

### Price Justification
- Current PRO at £19.99 is below competitors (BetterHelp £60-80, Talkspace £65-100)
- Meedi8 offers unique two-party AI mediation not available elsewhere
- Company tier has 76% gross margin vs 52% for individual PRO

---

## Feature Matrix

### Core Features

| Feature | FREE | PLUS | PRO | COMPANY |
|---------|------|------|-----|---------|
| Mediations/month | 1 | Unlimited | Unlimited | Unlimited |
| AI NVC Coaching | Yes | Yes | Yes | Yes |
| Voice Messages | 1 trial | 50/month | 300/month | 300/month |
| File Attachments | No | Yes | Yes | Yes |
| Telegram Import | No | Yes | Yes | Yes |
| PDF Reports | No | No | 5/month | Unlimited |
| AI Voice Responses | No | No | Yes | Yes |
| Priority Support | No | Yes | Yes | Yes |
| Priority AI | No | No | Yes | Yes |

### Streak Protection (Loss Aversion)

| Feature | FREE | PLUS | PRO | COMPANY |
|---------|------|------|-----|---------|
| Grace Period | 12hr | 18hr | 24hr | 24hr |
| Freeze Tokens | 1 (signup only) | 2/month | 5/month (rollover) | 5/month |
| Weekend Pauses | 1/month | 2/month | 4/month | Unlimited |
| Auto Vacation Mode | No | No | Yes | Yes |
| Free Repair | No | No | 1/month | Unlimited |

### Gamification Features

| Feature | FREE | PLUS | PRO | COMPANY |
|---------|------|------|-----|---------|
| Achievements Visible | 15 | 27 | 37+ | 50+ |
| Daily Challenges | 3 | 4 | 5 | 5 |
| Challenge Swap | No | 1/day | 3/day | Unlimited |
| Score History | 7 days | 30 days | 90 days | 1 year |
| Mood Calendar | No | Yes | Yes | Yes |
| Pattern Analysis | No | No | Yes | Yes |
| Health Forecast | No | No | Yes | Yes |
| Bonus Rewards | Base | +50% | +100% | +100% |

### Analytics & Insights

| Feature | FREE | PLUS | PRO | COMPANY |
|---------|------|------|-----|---------|
| Basic Health Score | Yes | Yes | Yes | Yes |
| Trend Charts | No | 30-day | 90-day | 1-year |
| Conflict Patterns | No | No | Yes | Yes |
| Relationship Forecast | No | No | Yes | Yes |
| Monthly Reports | No | Email | PDF + Email | Dashboard |

---

## Company Tier Details

### Pricing Tiers

| Plan | Seats | Monthly | Annual | Features |
|------|-------|---------|--------|----------|
| **Starter** | Up to 10 | £99 | £999 | Basic team features, manager dashboard |
| **Growth** | Up to 50 | £249 | £2,499 | Full analytics, challenges, API access |
| **Enterprise** | Unlimited | Custom | Custom | SSO, integrations, dedicated support |

### Company-Only Features

- **Manager Dashboard**: Anonymized team analytics, conflict archetypes, participation balance
- **Team Collaboration Index**: Tiered rating (Bronze/Silver/Gold/Platinum) - not competitive ranking
- **Department Challenges**: "Feedback February", "Mediation Sprint", "Team Charter Challenge"
- **Peer Recognition**: Kudos system for acknowledging constructive behavior
- **Company Achievements**: Mediator Track, Communicator Track, Bridge Builder badges
- **Admin Console**: User management, billing, usage reports
- **SSO Integration**: Enterprise-only SAML/OAuth
- **API Access**: Growth+ for custom integrations

---

## Conversion Triggers

### Free to Plus

1. **Streak at Risk** (Loss Aversion)
   - Trigger: 7+ day streak about to break
   - Modal: "Don't lose your streak! PLUS members can freeze theirs."

2. **Achievement Wall** (Goal Gradient)
   - Trigger: 1 badge away from completing category
   - Show: Locked badge with "Requires PLUS"

3. **Voice Message Tease** (Endowment Effect)
   - Trigger: After using trial voice message
   - Prompt: "That helped! Want more? PLUS: 50/month"

4. **Health Score Milestones** (Reward Timing)
   - 70 points: 3-day PLUS trial
   - 80 points: 7-day PLUS trial
   - 90 points: 50% off first month

### Plus to Pro

1. **PDF Report Gate**
   - Trigger: Trying to generate professional report
   - High-value moment after completing mediation

2. **Streak Fear Escalation**
   - Trigger: 28/29 days toward 30, no freezes left
   - Maximum loss aversion at highest investment

3. **Analytics Preview**
   - Monthly email shows "locked" advanced analytics
   - "PRO members also see conflict pattern analysis..."

---

## Psychological Principles

### Core Mechanics

1. **Loss Aversion** (Kahneman & Tversky)
   - Streak protection creates insurance mentality
   - Pain of losing streak 2x stronger than pleasure of gaining

2. **Endowment Effect** (Thaler)
   - Trial features create desire for more
   - "Taste of premium" weekly for FREE users

3. **Goal Gradient Hypothesis** (Kivetz)
   - Achievement walls at 80% completion
   - People accelerate as they approach goal

4. **Variable Ratio Reinforcement** (Skinner)
   - Random bonuses create compulsive engagement
   - 10-20% chance of surprise rewards

5. **Sunk Cost Fallacy** (Arkes & Blumer)
   - Progress visualization prevents churn
   - "127 days as member, 324 messages sent"

6. **Social Proof** (Cialdini)
   - "Top 15% of users" notifications
   - "Only 8% reach Platinum tier"

### Ethical Guidelines

- All notifications can be disabled
- Gamification can be turned off in settings
- No dark patterns or deceptive design
- Core mediation never blocked
- Growth-oriented messaging (not shame-based)
- All team data anonymized

---

## Expected Impact

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| DAU/MAU Ratio | 5% | 20% | 3 months |
| Free-to-Plus | 2% | 12% | 2 months |
| Plus-to-Pro | 5% | 15% | 3 months |
| Pro Churn | 8% | 4% | 3 months |
| ARPU | £2 | £8 | 3 months |
| D7 Retention | 20% | 40% | 2 months |
| D30 Retention | 10% | 25% | 3 months |

---

## Implementation Phases

### Phase 1: Core Tier Updates (Week 1-2)
- [ ] Update Stripe products with new prices
- [ ] Modify subscription limits in backend
- [ ] Update Subscription page UI
- [ ] Update Profile page feature matrix
- [ ] Add enhanced streak protection tiers

### Phase 2: Conversion Optimization (Week 3-4)
- [ ] Implement streak-based conversion modals
- [ ] Add achievement wall triggers
- [ ] Enhance milestone offer system
- [ ] Build Plus-to-Pro trigger points
- [ ] Add variable reward system

### Phase 3: Company Tier (Week 5-6)
- [ ] Design database schema for teams
- [ ] Build manager dashboard backend
- [ ] Create team collaboration index
- [ ] Implement peer recognition system
- [ ] Build admin console

### Phase 4: Polish & Launch (Week 7-8)
- [ ] A/B test conversion triggers
- [ ] User test enterprise features
- [ ] Documentation and training
- [ ] Gradual rollout with monitoring

---

## Competitor Analysis Summary

### Individual Therapy/Coaching
- **BetterHelp**: £60-80/week, unlimited messaging
- **Talkspace**: £65-100/week, video sessions
- **Cerebral**: £85/month + medication

### Relationship Apps
- **Lasting**: £12/month, couples exercises
- **Relish**: £12/month, coaching
- **Paired**: £8/month, daily questions

### AI Coaching
- **Woebot**: Free (ad-supported)
- **Wysa**: £8/month premium
- **Replika**: £8/month PRO

### Mediation
- **TheMediator.AI**: $4.99/mediation (validates market)
- **Traditional**: £150-300/hour

### Enterprise Wellness
- **Headspace for Work**: $12-15/seat/month
- **Calm Business**: $10-15/seat/month
- **Ginger**: $20-40/seat/month

**Key Insight**: Meedi8 at £24.99/month PRO offers unique value (two-party AI mediation) at fraction of therapy costs.

---

## Database Changes Required

### New Tables

```sql
-- Company/Team structure
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50), -- starter, growth, enterprise
    seat_count INTEGER,
    admin_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    manager_id INTEGER REFERENCES users(id),
    collaboration_index INTEGER DEFAULT 50,
    collaboration_tier VARCHAR(20) DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE TABLE peer_recognitions (
    id SERIAL PRIMARY KEY,
    giver_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    room_id INTEGER REFERENCES rooms(id),
    recognition_type VARCHAR(50),
    points INTEGER DEFAULT 5,
    message VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE team_challenges (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50),
    target_metric VARCHAR(50),
    target_value INTEGER,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    reward_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Subscription Model Updates

```python
# Add to Subscription model
class Subscription(Base):
    # Existing fields...

    # New fields for enhanced tiers
    freeze_tokens_remaining = Column(Integer, default=0)
    freeze_tokens_rollover = Column(Integer, default=0)
    weekend_pauses_used = Column(Integer, default=0)
    challenge_swaps_used = Column(Integer, default=0)
    pdf_reports_generated = Column(Integer, default=0)

    # Company tier fields
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)
    is_company_admin = Column(Boolean, default=False)
```

---

## Files to Modify

### Backend
- `app/models/subscription.py` - Add new tier limits
- `app/routes/subscriptions.py` - Update Stripe products
- `app/services/subscription_limits.py` - New limit checking
- `app/routes/gamification.py` - Enhanced streak protection
- New: `app/routes/company.py` - Company tier endpoints
- New: `app/models/company.py` - Company/Team models

### Frontend
- `src/pages/Subscription.jsx` - New pricing UI
- `src/pages/Profile.jsx` - Updated feature matrix
- `src/context/GamificationContext.jsx` - New protection mechanics
- New: `src/pages/CompanyDashboard.jsx` - Manager dashboard
- New: `src/components/TeamLeaderboard.jsx` - Team gamification

### Database
- New migration for companies/teams tables
- New migration for subscription enhancements

---

## Success Metrics

### KPIs to Track

1. **Conversion Funnel**
   - Free signups
   - Free-to-Plus conversion rate
   - Plus-to-Pro conversion rate
   - Company tier inquiries

2. **Retention**
   - D1/D7/D30 retention by tier
   - Churn rate by tier
   - Streak statistics

3. **Revenue**
   - MRR by tier
   - ARPU
   - LTV by tier
   - Company tier revenue

4. **Engagement**
   - DAU/MAU ratio
   - Session frequency
   - Feature usage by tier

---

## Next Steps

1. **Review this strategy** with stakeholders
2. **Prioritize Phase 1** implementation
3. **Create Stripe products** for new pricing
4. **Update frontend** Subscription page
5. **Test conversion triggers** with A/B tests

---

## References

- Kahneman, D. & Tversky, A. (1979). Prospect Theory
- Thaler, R. (1980). Endowment Effect
- Duhigg, C. (2012). The Power of Habit
- Cialdini, R. (2006). Influence: The Psychology of Persuasion
- Google Project Aristotle - Team Dynamics Research
