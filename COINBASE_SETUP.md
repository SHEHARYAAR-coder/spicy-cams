# Coinbase Commerce Integration - Setup Guide

## Overview

This guide explains how to set up cryptocurrency payments using Coinbase Commerce for buying tokens in your application.

## Features Added

✅ Accept Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), USDC, and other cryptocurrencies
✅ Secure payment processing via Coinbase Commerce
✅ Automatic token crediting upon payment confirmation
✅ Dual payment method support (Credit/Debit Card + Crypto)
✅ Payment history tracking for both Stripe and Coinbase payments

## Files Created/Modified

### New Files:

1. **`src/app/api/coinbase/create-charge/route.ts`** - API endpoint to create Coinbase Commerce charges
2. **`src/app/api/coinbase/webhook/route.ts`** - Webhook handler for payment confirmations
3. **`src/components/pricing/crypto-payment-dialog.tsx`** - UI component for crypto payment selection

### Modified Files:

1. **`src/app/checkout/page.tsx`** - Updated to support both payment methods
2. **`.env`** - Added Coinbase Commerce environment variables

## Setup Instructions

### Step 1: Create Coinbase Commerce Account

1. Go to [Coinbase Commerce](https://commerce.coinbase.com/)
2. Sign up or log in with your Coinbase account
3. Complete business verification if required

### Step 2: Get API Credentials

1. Navigate to **Settings** → **API Keys** in Coinbase Commerce dashboard
2. Click **Create an API Key**
3. Copy the API key and save it securely
4. Go to **Settings** → **Webhook subscriptions**
5. Click **Add an endpoint**
6. Enter your webhook URL: `https://yourdomain.com/api/coinbase/webhook`
7. Select all event types or at minimum:
   - `charge:confirmed`
   - `charge:failed`
   - `charge:resolved`
8. Copy the **Webhook Shared Secret**

### Step 3: Configure Environment Variables

Update your `.env` file with the following:

```env
# Coinbase Commerce Configuration
COINBASE_COMMERCE_API_KEY=your_actual_api_key_here
COINBASE_COMMERCE_WEBHOOK_SECRET=your_actual_webhook_secret_here
```

Replace the placeholder values with your actual credentials from Step 2.

### Step 4: Update Production URL

In your `.env` file, make sure to update the production URL:

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

For local development, keep it as:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Test Webhook Locally (Development)

For local testing, you'll need to expose your local server to the internet:

#### Option A: Using ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In a new terminal, expose port 3000
ngrok http 3000

# Use the ngrok URL for your webhook in Coinbase Commerce
# Example: https://abc123.ngrok.io/api/coinbase/webhook
```

#### Option B: Using Cloudflare Tunnel

```bash
# Install cloudflared
# Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Run tunnel
cloudflared tunnel --url http://localhost:3000
```

### Step 6: Verify Installation

1. Start your development server:

```bash
npm run dev
```

2. Navigate to `/pricing` page
3. Select any token package
4. On the checkout page, you should see two payment options:

   - Credit/Debit Card (Stripe)
   - Cryptocurrency (Coinbase Commerce)

5. Click "Cryptocurrency" option
6. Click "Continue with Crypto"
7. You should be redirected to Coinbase Commerce hosted checkout page

### Step 7: Test Payment Flow

#### For Testing (Testnet):

1. Coinbase Commerce doesn't have a dedicated testnet mode
2. You can create small test charges (minimum $1)
3. Cancel them before payment to avoid actual transactions

#### For Production:

1. Make sure all environment variables are properly set
2. Webhook URL should be accessible from the internet
3. Monitor webhook logs in your application and Coinbase dashboard

## How It Works

### Payment Flow:

1. **User selects a plan** → Redirected to `/checkout?plan=basic`
2. **User chooses crypto payment** → Opens crypto payment dialog
3. **User clicks continue** → API creates Coinbase charge
4. **User redirected to Coinbase** → Hosted checkout page with crypto options
5. **User sends payment** → Coinbase monitors blockchain
6. **Payment confirmed** → Coinbase sends webhook to your server
7. **Webhook processes payment** → Credits tokens to user's wallet
8. **User redirected back** → Sees updated token balance

### Database Schema:

The existing `Payment` model already supports crypto payments:

- `provider`: Set to "COINBASE"
- `providerRef`: Stores Coinbase charge code
- `status`: Tracks payment status (PENDING, SUCCEEDED, FAILED)
- `webhookData`: Stores complete webhook payload

### Security Features:

✅ **Webhook signature verification** - Ensures webhooks are from Coinbase
✅ **Duplicate payment prevention** - Checks existing payments before processing
✅ **User authentication** - Requires logged-in user to create charges
✅ **Metadata validation** - Verifies all required data before crediting tokens

## API Endpoints

### POST `/api/coinbase/create-charge`

Creates a new Coinbase Commerce charge for token purchase.

**Request Body:**

```json
{
  "planId": "basic" | "plus" | "pro"
}
```

**Response:**

```json
{
  "chargeId": "CHARGE_ID",
  "chargeCode": "CHARGE_CODE",
  "hostedUrl": "https://commerce.coinbase.com/charges/CODE",
  "expiresAt": "ISO_DATE"
}
```

### POST `/api/coinbase/webhook`

Handles Coinbase Commerce webhook events.

**Headers:**

- `x-cc-webhook-signature`: HMAC signature for verification

**Events Handled:**

- `charge:confirmed` - Payment confirmed, credits tokens
- `charge:resolved` - Payment resolved, credits tokens
- `charge:failed` - Payment failed, logs failure
- `charge:pending` - Payment pending, logs status

## Pricing Plans

Currently configured plans (same as Stripe):

| Plan  | Price | Tokens | Plan ID |
| ----- | ----- | ------ | ------- |
| Basic | $5    | 10     | basic   |
| Plus  | $15   | 50     | plus    |
| Pro   | $50   | 200    | pro     |

## Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Bitcoin Cash (BCH)
- USD Coin (USDC)
- Dai (DAI)
- And more supported by Coinbase Commerce

## Monitoring & Debugging

### Check Payment Status:

```bash
# View all payments in database
npx prisma studio

# Check webhooks table for logs
# Navigate to Payment model, filter by provider = "COINBASE"
```

### Webhook Logs:

Monitor your application logs for webhook events:

- Look for "🔔 Coinbase Commerce webhook endpoint hit"
- Check for "✅ Successfully processed crypto payment"
- Watch for errors marked with "❌"

### Coinbase Commerce Dashboard:

1. Login to [Coinbase Commerce Dashboard](https://commerce.coinbase.com/)
2. View all charges and their statuses
3. Check webhook delivery logs
4. Monitor failed webhook attempts

## Troubleshooting

### Webhook not receiving events:

1. Verify webhook URL is publicly accessible
2. Check webhook secret is correct in `.env`
3. Ensure URL uses HTTPS in production
4. Check Coinbase Commerce webhook logs for delivery failures

### Payment not crediting tokens:

1. Check webhook signature verification passes
2. Verify user ID in charge metadata
3. Check database for payment record with same `providerRef`
4. Look for errors in application logs

### "Coinbase Commerce is not configured" error:

1. Ensure `COINBASE_COMMERCE_API_KEY` is set in `.env`
2. Restart your Next.js server after adding env variables
3. Verify the API key is valid in Coinbase Commerce dashboard

## Production Deployment Checklist

- [ ] Set production `COINBASE_COMMERCE_API_KEY`
- [ ] Set production `COINBASE_COMMERCE_WEBHOOK_SECRET`
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure webhook URL in Coinbase Commerce dashboard
- [ ] Test webhook with real transaction (small amount)
- [ ] Monitor logs for first few transactions
- [ ] Set up error alerting for failed webhooks
- [ ] Enable HTTPS on your domain
- [ ] Test complete user flow from checkout to token crediting

## Support

For Coinbase Commerce support:

- [Coinbase Commerce Documentation](https://commerce.coinbase.com/docs/)
- [API Reference](https://commerce.coinbase.com/docs/api/)
- [Support Center](https://help.coinbase.com/en/commerce)

## Notes

- Cryptocurrency transactions can take 10-30 minutes to confirm (depends on blockchain)
- Users will see "pending" status until blockchain confirmation
- Always test webhook integration thoroughly before production
- Keep webhook secret secure and rotate periodically
- Monitor for failed webhook deliveries regularly
