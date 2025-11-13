# Stripe Environment Variables Setup

Quick reference for setting up Stripe in Railway and Vercel.

## Railway Environment Variables (Backend)

Go to Railway → meedi8-backend → Variables tab and add:

```bash
# Stripe API Keys (get from Stripe Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_test_xxxxx  # Use your actual test key (or live key for production)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Get from webhook setup (see below)

# Price IDs (already set in code, but can override here if needed)
STRIPE_PRICE_PLUS_MONTHLY=price_1ST3SOI6BakpcqZhMdACodvT
STRIPE_PRICE_PLUS_YEARLY=price_1ST3RqI6BakpcqZhg8F3UcAd
STRIPE_PRICE_PRO_MONTHLY=price_1ST3W6I6BakpcqZhLTITlNHJ
STRIPE_PRICE_PRO_YEARLY=price_1ST3W6I6BakpcqZhYykzYUG9
```

## Vercel Environment Variables (Frontend)

Go to Vercel → meedi8 → Settings → Environment Variables and add:

```bash
# Stripe Publishable Key (get from Stripe Dashboard → Developers → API keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Use your actual test key (or live key for production)
```

**Important**: Add this variable to ALL environments:
- Production ✓
- Preview ✓
- Development ✓

Then trigger a redeploy after adding the variable.

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://meedi8-production.up.railway.app/subscriptions/webhook`
4. Select events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Click "Reveal" under "Signing secret"
7. Copy the secret (format: `whsec_xxxxx`)
8. Add to Railway as `STRIPE_WEBHOOK_SECRET`

## Where to Find Stripe Keys

### Test Mode (for development/testing)
1. Go to Stripe Dashboard
2. Toggle "Test mode" ON (top right)
3. Go to Developers → API keys
4. Copy:
   - **Publishable key**: `pk_test_xxxxx` → Add to Vercel
   - **Secret key**: `sk_test_xxxxx` → Add to Railway

### Live Mode (for production)
1. Go to Stripe Dashboard
2. Toggle "Test mode" OFF (top right)
3. Go to Developers → API keys
4. Copy:
   - **Publishable key**: `pk_live_xxxxx` → Update in Vercel
   - **Secret key**: `sk_live_xxxxx` → Update in Railway

## Testing the Integration

After adding all environment variables:

1. Railway will auto-redeploy (wait ~2 minutes)
2. Vercel will need manual redeploy: Deployments → ⋯ → Redeploy
3. Go to https://meedi8.com/subscription (or your Vercel preview URL)
4. Click "Get Plus" or "Get Pro"
5. Embedded checkout modal should appear
6. Use test card: `4242 4242 4242 4242`, any future date, any CVC
7. Complete checkout
8. Check Stripe Dashboard → Payments to see test payment
9. Check Railway logs to see webhook received

## Troubleshooting

**"Stripe is not configured" error in frontend:**
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set in Vercel
- Ensure you redeployed frontend after adding the variable

**Checkout creation fails:**
- Check that `STRIPE_SECRET_KEY` is set correctly in Railway
- Check Railway logs for detailed error messages

**Subscription not activating after payment:**
- Check webhook endpoint is configured in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches in Railway
- Check Railway logs for webhook delivery errors
- Check Stripe Dashboard → Webhooks → your endpoint → Recent deliveries

## Price IDs Reference

Already configured in code, but here for reference:

- **Plus Monthly**: £9.99/month → `price_1ST3SOI6BakpcqZhMdACodvT`
- **Plus Yearly**: £99/year → `price_1ST3RqI6BakpcqZhg8F3UcAd`
- **Pro Monthly**: £19.99/month → `price_1ST3W6I6BakpcqZhLTITlNHJ`
- **Pro Yearly**: £199/year → `price_1ST3W6I6BakpcqZhYykzYUG9`
