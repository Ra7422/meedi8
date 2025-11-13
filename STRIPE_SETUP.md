# Stripe Integration Setup Guide

Complete guide to setting up Stripe subscriptions for Meedi8.

## Overview

Meedi8 uses Stripe for subscription management with three tiers:
- **FREE**: 1 mediation/month, no voice
- **PLUS**: Unlimited mediations, 30 voice messages/month
- **PRO**: Unlimited mediations, 300 voice messages/month, professional reports

## Step 1: Create Stripe Account

1. Go to https://stripe.com and sign up
2. Complete business verification
3. Switch to **Test Mode** (toggle in top-right) for development

## Step 2: Create Products and Prices

### Create PLUS Tier Product

1. Go to **Products** → **Add Product**
2. Product details:
   - **Name**: `Meedi8 PLUS`
   - **Description**: `Unlimited mediations with 30 voice messages per month`
   - **Statement descriptor**: `MEEDI8 PLUS`

3. Create Monthly Price:
   - **Pricing model**: Standard pricing
   - **Price**: `$9.99`
   - **Billing period**: Monthly
   - **Currency**: USD
   - **Copy the Price ID** (format: `price_xxxxxxxxxxxxx`)
   - Save as: `STRIPE_PRICE_PLUS_MONTHLY`

4. Add Yearly Price (click "Add another price"):
   - **Price**: `$99.99` (save $20/year)
   - **Billing period**: Yearly
   - **Copy the Price ID**
   - Save as: `STRIPE_PRICE_PLUS_YEARLY`

### Create PRO Tier Product

1. Go to **Products** → **Add Product**
2. Product details:
   - **Name**: `Meedi8 PRO`
   - **Description**: `Unlimited mediations with 300 voice messages per month and professional reports`
   - **Statement descriptor**: `MEEDI8 PRO`

3. Create Monthly Price:
   - **Price**: `$19.99`
   - **Billing period**: Monthly
   - **Copy the Price ID**
   - Save as: `STRIPE_PRICE_PRO_MONTHLY`

4. Add Yearly Price:
   - **Price**: `$199.99` (save $40/year)
   - **Billing period**: Yearly
   - **Copy the Price ID**
   - Save as: `STRIPE_PRICE_PRO_YEARLY`

## Step 3: Get API Keys

1. Go to **Developers** → **API keys**
2. Copy the following keys:

### Test Mode Keys (for development)
- **Publishable key**: `pk_test_xxxxxxxxxxxxx`
- **Secret key**: `sk_test_xxxxxxxxxxxxx`

### Live Mode Keys (for production)
- **Publishable key**: `pk_live_xxxxxxxxxxxxx`
- **Secret key**: `sk_live_xxxxxxxxxxxxx`

## Step 4: Set Up Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint details:
   - **Endpoint URL**: `https://api.meedi8.com/subscriptions/webhook`
   - **Description**: `Meedi8 subscription webhooks`
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
4. Click **Add endpoint**
5. Click **Reveal** under "Signing secret"
6. Copy the webhook secret (format: `whsec_xxxxxxxxxxxxx`)
7. Save as: `STRIPE_WEBHOOK_SECRET`

## Step 5: Configure Environment Variables

### Railway (Backend)

Add the following environment variables to Railway:

```bash
# Stripe API Keys (use test keys for development)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs - REPLACE with your actual Price IDs from Step 2
STRIPE_PRICE_PLUS_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PLUS_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
```

**How to add to Railway:**
1. Go to Railway project → **meedi8-backend**
2. Click **Variables** tab
3. Add each variable above
4. Railway will auto-redeploy after adding variables

### Vercel (Frontend)

Add the Stripe publishable key to Vercel for embedded checkout:

```bash
# Stripe Publishable Key (use test key for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

**How to add to Vercel:**
1. Go to Vercel project → **meedi8**
2. Click **Settings** → **Environment Variables**
3. Add `VITE_STRIPE_PUBLISHABLE_KEY`
4. Add value for Production, Preview, and Development environments
5. Redeploy the frontend after adding

## Step 6: Update Frontend URLs

The backend currently has hardcoded URLs. Update these in Railway:

```bash
# Add to Railway environment variables
FRONTEND_URL=https://meedi8.com
```

Then update the code to use this variable:

**File**: `backend/app/routes/subscriptions.py`

**Lines 101-103** (replace):
```python
# OLD:
frontend_url = "https://clean-air-med.vercel.app"

# NEW:
frontend_url = settings.FRONTEND_URL or "https://meedi8.com"
```

**Lines 146-147** (replace):
```python
# OLD:
frontend_url = "https://clean-air-med.vercel.app"

# NEW:
frontend_url = settings.FRONTEND_URL or "https://meedi8.com"
```

## Step 7: Test Subscription Flow

### Test Cards (Stripe Test Mode)

Use these test card numbers:

**Successful payment**:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Payment declined**:
- Card: `4000 0000 0000 0002`

**Payment requires authentication (3D Secure)**:
- Card: `4000 0025 0000 3155`

### Testing Steps

1. **Create test user account** on https://meedi8.com
2. **Try creating 2 mediations** - should hit FREE tier limit
3. **Click upgrade** in paywall modal
4. **Select PLUS or PRO tier**
5. **Enter test card** and complete checkout
6. **Verify subscription** activated in database:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = YOUR_USER_ID;
   ```
7. **Create another mediation** - should work now
8. **Test Customer Portal**:
   - Go to /subscription page
   - Click "Manage Subscription"
   - Try canceling/updating

### Webhook Testing

After completing a test purchase:

1. Go to **Developers** → **Webhooks** → **Your endpoint**
2. Check **Attempted** tab for webhook delivery logs
3. Should see `checkout.session.completed` with status `200`
4. Check Railway logs for webhook processing:
   ```
   🔔 Stripe webhook received: checkout.session.completed
   ```

## Step 8: Switch to Production

When ready to go live:

1. **Switch Stripe to Live Mode** (toggle in dashboard)
2. **Create real products/prices** (same steps as test mode)
3. **Get Live API keys** from Developers → API keys
4. **Update Railway variables** with live keys
5. **Update webhook endpoint** URL if needed
6. **Test with real card** (small amount)

## Architecture Overview

### Backend Components

**Routes**: `backend/app/routes/subscriptions.py`
- `GET /subscriptions/status` - Get user's subscription info
- `POST /subscriptions/create-checkout` - Create Stripe Checkout session
- `POST /subscriptions/create-portal` - Create Customer Portal session
- `POST /subscriptions/webhook` - Handle Stripe webhook events

**Services**: `backend/app/services/stripe_service.py`
- `create_checkout_session()` - Create Stripe Checkout
- `create_portal_session()` - Create Customer Portal
- `handle_checkout_complete()` - Activate subscription
- `handle_subscription_updated()` - Update subscription status
- `handle_subscription_deleted()` - Cancel subscription

**Models**: `backend/app/models/subscription.py`
- `Subscription` model with usage counters
- `SubscriptionTier` enum (FREE, PLUS, PRO)
- `SubscriptionStatus` enum (active, inactive, past_due, canceled)

### Paywall Enforcement

**Room Creation**: `backend/app/routes/rooms.py:95`
```python
# Check if user can create room
check_room_creation_limit(db, current_user)
```

**File Uploads**: `backend/app/routes/rooms.py:1978`
```python
# Check file size limit based on tier
check_file_upload_limit(db, current_user, file_size)
```

**Professional Reports**: `backend/app/routes/rooms.py:2664`
```python
# Check if user can generate report (PRO only)
check_professional_report_limit(db, current_user)
```

### Frontend Integration

**Paywall Modal**: `frontend/src/pages/CreateRoom.jsx:370-471`
- Shows when hitting room creation limit
- Displays current usage (e.g., "1 / 1" for FREE tier)
- "View Subscription Plans" button

**Subscription Page**: `frontend/src/pages/Subscription.jsx`
- Shows tier comparison table
- Stripe Checkout integration
- Customer Portal access

## Pricing Strategy

### Current Pricing

- **FREE**: $0/month - 1 mediation/month
- **PLUS**: $9.99/month or $99.99/year - Unlimited mediations, 30 voice messages
- **PRO**: $19.99/month or $199.99/year - Unlimited mediations, 300 voice messages, professional reports

### Recommended Adjustments

Based on competitor analysis and value proposition:

1. **Consider lower entry tier**: $4.99/month for PLUS (easier conversion from free)
2. **Add usage-based pricing**: $0.50 per extra mediation for FREE tier overflow
3. **Yearly discount**: Offer 20% off (2 months free) to encourage annual subscriptions
4. **Trial period**: 7-day free trial for PLUS/PRO tiers

## Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rate**: FREE → PLUS/PRO
2. **Churn Rate**: Monthly cancellations
3. **Upgrade Rate**: PLUS → PRO
4. **Usage Patterns**: Rooms created per tier
5. **Revenue MRR**: Monthly recurring revenue

### Stripe Dashboard

Monitor these in **Stripe Dashboard → Reports**:
- New subscriptions
- Active subscriptions
- Churned subscriptions
- Revenue growth
- Failed payments

### Database Queries

```sql
-- Active subscriptions by tier
SELECT tier, COUNT(*)
FROM subscriptions
WHERE status = 'active'
GROUP BY tier;

-- Monthly revenue estimate
SELECT
  tier,
  COUNT(*) as active_subs,
  CASE
    WHEN tier = 'plus' THEN COUNT(*) * 9.99
    WHEN tier = 'pro' THEN COUNT(*) * 19.99
    ELSE 0
  END as monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY tier;

-- Users hitting limits
SELECT COUNT(*)
FROM subscriptions
WHERE tier = 'free'
AND rooms_created_this_month >= rooms_per_month_limit;
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check Railway logs for webhook endpoint errors
2. Verify webhook URL in Stripe dashboard is correct
3. Test webhook manually: Stripe Dashboard → Webhooks → Send test webhook
4. Check CORS settings in backend

### Checkout Session Creation Fails

1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Check price IDs match your Stripe products
3. Ensure user has valid email address
4. Check Railway logs for detailed error

### Subscription Not Activating

1. Check webhook is receiving `checkout.session.completed`
2. Verify subscription ID matches in database
3. Check user's `stripe_customer_id` is set
4. Look for errors in Railway logs

### Payment Fails but Subscription Created

1. Check `invoice.payment_failed` webhook
2. Subscription status should be `past_due`
3. Stripe will retry payment automatically
4. Consider sending email notification to user

## Security Considerations

1. **API Keys**: Never commit API keys to git
2. **Webhook Signatures**: Always verify webhook signatures (already implemented)
3. **HTTPS Only**: Stripe requires HTTPS for production webhooks
4. **Rate Limiting**: Consider adding rate limits to checkout endpoint
5. **Fraud Detection**: Enable Stripe Radar for fraud protection

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Customer Portal**: https://stripe.com/docs/billing/subscriptions/customer-portal
- **Stripe Status**: https://status.stripe.com

## Next Steps After Setup

1. ✅ Complete Stripe account setup
2. ✅ Create products and prices
3. ✅ Configure Railway environment variables
4. ✅ Test subscription flow with test cards
5. ✅ Verify webhook delivery
6. ✅ Update frontend URLs
7. ✅ Test paywall enforcement
8. ✅ Monitor first real transactions
9. ✅ Set up email notifications for failed payments
10. ✅ Add analytics tracking for conversion funnel

---

## Embedded Checkout Implementation

Meedi8 uses Stripe's **Embedded Checkout** to keep users on-site during payment instead of redirecting to Stripe's hosted page.

### How It Works

1. **User clicks upgrade button** → Frontend calls `/subscriptions/create-checkout`
2. **Backend creates Stripe session** with `ui_mode='embedded'` and returns `client_secret`
3. **Frontend displays embedded form** in modal using `@stripe/react-stripe-js`
4. **User completes payment** → Stripe redirects to success page
5. **Webhook activates subscription** → `checkout.session.completed` event

### Files Changed for Embedded Checkout

**Backend:**
- `backend/app/services/stripe_service.py:74-94` - Added `ui_mode='embedded'`, returns `client_secret` instead of `checkout_url`
- `backend/app/routes/subscriptions.py:35-37` - Updated response model to return `client_secret`

**Frontend:**
- `frontend/src/components/EmbeddedCheckout.jsx` (NEW) - Stripe embedded checkout component
- `frontend/src/pages/Subscription.jsx:48-88, 637-694` - Updated to show embedded checkout modal instead of redirect
- `frontend/package.json` - Added `@stripe/stripe-js` and `@stripe/react-stripe-js` dependencies

### Environment Variable Required

**Frontend must have:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # or pk_live_xxxxx for production
```

Without this variable, the embedded checkout will show an error message asking the user to configure Stripe.

---

**Last Updated**: 2025-11-13
**Version**: 1.1.0
**Status**: Embedded checkout implementation complete
