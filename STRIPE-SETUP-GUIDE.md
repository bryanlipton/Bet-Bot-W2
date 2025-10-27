# Stripe Payment Integration Setup Guide

This guide explains how to set up and configure the Stripe payment integration for Bet Bot Pro subscriptions.

## Overview

The Stripe integration enables users to subscribe to Bet Bot Pro for $9.99/month, with automatic account upgrades and webhook-based status updates.

## Architecture

### Frontend
- **GetProButton Component** (`client/src/components/GetProButton.tsx`)
  - Appears in the top navigation
  - Handles user authentication check
  - Creates Stripe checkout session
  - Redirects to Stripe Checkout
  
- **GetPro Page** (`client/src/pages/GetPro.tsx`)
  - Marketing page showing features, pricing, and testimonials
  - No duplicate button (users click "Get Pro" in navigation)
  
- **Success Page** (`client/src/pages/PaymentSuccess.tsx`)
  - Post-payment confirmation page
  - Shows Pro account activation status
  - Route: `/success`

### Backend
- **Checkout Session API** (`api/create-checkout-session.js`)
  - Creates Stripe Checkout sessions
  - Passes userId in metadata for webhook processing
  - Redirects to `/success` on completion
  
- **Webhook Handler** (`api/stripe-webhook.js`)
  - Receives Stripe events
  - Verifies webhook signatures
  - Updates Supabase `profiles` table with Pro status

## Required Environment Variables

### Vercel Environment Variables

Configure these in your Vercel project dashboard (Settings → Environment Variables):

```bash
# Stripe Keys (from Stripe Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_live_...        # or sk_test_... for testing
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_... for testing

# Stripe Webhook Secret (from Stripe Dashboard → Developers → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...      # Critical for security!

# Application Domain
DOMAIN=https://bet-bot-w2.vercel.app

# Supabase (for database updates)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...          # Service role key (not anon key!)
```

### Local Development

Create a `.env` file in the root directory:

```bash
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DOMAIN=http://localhost:5173
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

## Stripe Dashboard Configuration

### 1. Create a Product

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Configure:
   - **Name**: Bet Bot Pro
   - **Description**: Premium sports analytics
   - **Pricing**: $9.99 USD / month (recurring)
   - **Billing period**: Monthly

### 2. Configure Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://bet-bot-w2.vercel.app/api/stripe-webhook`
   - **Events to send**:
     - `checkout.session.completed` - When payment succeeds
     - `customer.subscription.updated` - When subscription changes
     - `customer.subscription.deleted` - When subscription cancels
4. After creating, copy the **Signing secret** (starts with `whsec_`)
5. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### 3. Test Mode vs Live Mode

**Test Mode** (Development):
- Use `sk_test_...` and `pk_test_...` keys
- Use test credit card: `4242 4242 4242 4242` (any future expiry, any CVC)
- Webhook endpoint: Can use your Vercel preview URL

**Live Mode** (Production):
- Use `sk_live_...` and `pk_live_...` keys
- Real credit cards only
- Webhook endpoint: Must use production URL

## Payment Flow

### User Journey

1. **User clicks "Get Pro" button** (in navigation)
   - Must be logged in
   - Button shows "Please log in to upgrade to Pro" if not authenticated
   
2. **Frontend creates checkout session**
   ```javascript
   POST /api/create-checkout-session
   {
     "userId": "user-uuid",
     "userEmail": "user@example.com"
   }
   ```
   
3. **Redirects to Stripe Checkout**
   - User enters payment information
   - Stripe processes payment
   
4. **Stripe redirects back on success**
   - Success URL: `/success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `/get-pro` (returns to pricing page)
   
5. **Stripe sends webhook event**
   ```json
   {
     "type": "checkout.session.completed",
     "data": {
       "object": {
         "metadata": { "userId": "user-uuid" },
         "customer": "cus_...",
         "subscription": "sub_..."
       }
     }
   }
   ```
   
6. **Webhook updates database**
   ```sql
   UPDATE profiles 
   SET is_pro = true,
       stripe_customer_id = 'cus_...',
       stripe_subscription_id = 'sub_...',
       subscription_status = 'active'
   WHERE id = 'user-uuid'
   ```

7. **User sees Pro features**
   - GetProButton now shows "Pro Member" with checkmark
   - Pro features are unlocked throughout the app

## Database Schema

The Supabase `profiles` table should have these columns:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  is_pro BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  -- other columns...
);
```

## Security Features

### Webhook Signature Verification

The webhook handler verifies that requests actually come from Stripe:

```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  payload, 
  sig, 
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Without this verification**, anyone could fake a webhook and grant themselves Pro access!

### HTTPS Required

- Stripe requires HTTPS for webhook endpoints
- Vercel provides HTTPS automatically
- Local testing: Use Stripe CLI or ngrok

## Testing

### Test the Payment Flow

1. **Use Stripe test mode keys**
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Test credit cards**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

3. **Test webhook locally**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:5173/api/stripe-webhook
   
   # Trigger test event
   stripe trigger checkout.session.completed
   ```

### Verify Database Updates

After a test payment:

1. Check Stripe Dashboard → Payments for successful payment
2. Check Supabase → Table Editor → profiles table
3. Verify `is_pro = true` for the test user
4. Check Vercel → Functions logs for webhook processing

## Troubleshooting

### "Cannot read properties of undefined (reading 'match')"

**Cause**: GetProButton tried to redirect before response was parsed correctly.

**Solution**: ✅ Fixed - Button now checks `response.ok` before parsing JSON.

### Webhook not updating database

**Possible causes**:
1. Missing `STRIPE_WEBHOOK_SECRET` - Check Vercel env vars
2. Wrong webhook endpoint URL in Stripe Dashboard
3. Missing `userId` in checkout session metadata
4. Supabase service key incorrect or missing

**Debug**:
```bash
# Check Vercel function logs
vercel logs

# Check Stripe Dashboard → Developers → Webhooks
# Look for failed webhook deliveries
```

### Button appears twice

**Solution**: ✅ Fixed - Removed GetProButton from GetPro.tsx page. It only appears in navigation.

### User pays but still shows as free

**Possible causes**:
1. Webhook failed to process
2. Database update failed
3. Frontend cached old Pro status

**Solution**:
1. Check webhook delivery in Stripe Dashboard
2. Check Vercel logs for errors
3. Have user refresh page or log out/in
4. Manually verify/fix database entry

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Supabase Documentation**: https://supabase.com/docs

## Code Reference

### GetProButton Component
Location: `client/src/components/GetProButton.tsx`
- Creates checkout session
- Redirects to Stripe
- Shows Pro status badge

### Checkout Session API
Location: `api/create-checkout-session.js`
- Validates user authentication
- Creates Stripe session with metadata
- Returns session ID

### Webhook Handler
Location: `api/stripe-webhook.js`
- Verifies webhook signatures
- Handles 3 event types
- Updates Supabase profiles table

### Success Page
Location: `client/src/pages/PaymentSuccess.tsx`
- Shows payment confirmation
- Displays Pro activation status
- Links back to dashboard
