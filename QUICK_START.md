# 🚀 Quick Start Guide - Crypto Payments

Get crypto payments running in your app in 5 minutes!

## ⚡ Quick Setup (5 steps)

### 1️⃣ Get Coinbase Commerce Account

```
👉 Go to: https://commerce.coinbase.com/
👉 Sign up (free)
👉 Complete verification
```

### 2️⃣ Get Your API Keys

```
👉 Dashboard → Settings → API Keys
👉 Click "Create an API Key"
👉 Copy the key 📋
```

### 3️⃣ Setup Webhook

```
👉 Dashboard → Settings → Webhook subscriptions
👉 Click "Add an endpoint"
👉 URL: https://yourdomain.com/api/coinbase/webhook
   (For local: use ngrok - see below)
👉 Select all events or minimum:
   - charge:confirmed
   - charge:failed
   - charge:resolved
👉 Copy webhook secret 📋
```

### 4️⃣ Update .env File

```env
COINBASE_COMMERCE_API_KEY=your_api_key_here
COINBASE_COMMERCE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 5️⃣ Test It!

```bash
npm run dev
# Visit: http://localhost:3000/pricing
# Select a plan → Choose "Cryptocurrency" → Test!
```

---

## 🧪 Local Testing with ngrok

Can't test webhooks locally? Use ngrok:

```bash
# Terminal 1 - Start your app
npm run dev

# Terminal 2 - Start ngrok
npx ngrok http 3000
# Copy the https URL (e.g., https://abc123.ngrok.io)

# Update Coinbase webhook URL to:
# https://abc123.ngrok.io/api/coinbase/webhook
```

---

## ✅ Verify Installation

Run the verification script:

```bash
./scripts/test-coinbase-setup.sh
```

All green? You're ready! ✨

---

## 🎮 Test the Flow

### User Journey:

1. Go to `/pricing`
2. Click "Get Basic" (or any plan)
3. On checkout page, select "Cryptocurrency"
4. Click "Continue with Crypto"
5. You'll be redirected to Coinbase Commerce
6. Complete payment (in test, you can cancel)
7. After payment confirmation (10-30 min), tokens auto-credit!

---

## 📊 Monitor Payments

### In Your App:

```bash
# Open Prisma Studio
npx prisma studio

# Check Payment table → Filter by provider = "COINBASE"
```

### In Coinbase Dashboard:

```
👉 https://commerce.coinbase.com/dashboard
👉 View all charges
👉 Check webhook deliveries
```

---

## 🐛 Troubleshooting

### "Coinbase Commerce is not configured"

```bash
# Check .env has actual values (not placeholders)
# Restart server after updating .env
npm run dev
```

### Webhook not working

```bash
# Check webhook URL is accessible
# Verify webhook secret is correct
# Check Coinbase dashboard → Webhook logs
```

### Payment not crediting tokens

```bash
# Check application logs for errors
# Verify webhook signature passes
# Check database for payment record
```

---

## 📚 Full Documentation

Need more details?

- **Setup Guide:** `COINBASE_SETUP.md`
- **Payment Comparison:** `PAYMENT_COMPARISON.md`
- **Code Documentation:** Check inline comments in API files

---

## 🎯 What Was Added?

### New API Endpoints:

- ✅ `POST /api/coinbase/create-charge` - Create crypto payment
- ✅ `POST /api/coinbase/webhook` - Handle payment confirmations

### New UI Components:

- ✅ Crypto payment dialog
- ✅ Updated checkout page with dual payment options
- ✅ Payment method selection cards

### Database:

- ✅ Already supports crypto (uses existing Payment model)
- ✅ Provider field set to "COINBASE"
- ✅ Tracks all transaction details

---

## 💰 Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- USD Coin (USDC)
- Dai (DAI)
- Bitcoin Cash (BCH)
- And more via Coinbase Commerce!

---

## 🔐 Security Features

- ✅ Webhook signature verification
- ✅ Duplicate payment prevention
- ✅ User authentication required
- ✅ Secure metadata handling
- ✅ Complete audit trail

---

## 🚀 Go Live Checklist

Before deploying to production:

- [ ] Get production Coinbase Commerce API key
- [ ] Get production webhook secret
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure webhook in Coinbase dashboard with HTTPS URL
- [ ] Test with small real transaction
- [ ] Monitor logs for first few transactions
- [ ] Set up error alerting
- [ ] Update Terms of Service (mention crypto)
- [ ] Test complete flow end-to-end

---

## 💡 Pro Tips

1. **Test thoroughly** before going live
2. **Monitor webhook** delivery success rates
3. **Keep secrets secure** - never commit to git
4. **Use HTTPS** in production (required)
5. **Consider crypto volatility** in pricing
6. **Educate users** about blockchain confirmation times
7. **Provide clear status** updates during payment

---

## 🆘 Need Help?

- **Coinbase Docs:** https://commerce.coinbase.com/docs/
- **API Reference:** https://commerce.coinbase.com/docs/api/
- **Support:** https://help.coinbase.com/en/commerce
- **Status Page:** https://status.coinbase.com/

---

## 🎉 You're All Set!

Your app now accepts crypto payments! 🎊

Users can now buy tokens with:

- 💳 Credit/Debit Cards (Stripe)
- ₿ Cryptocurrency (Coinbase Commerce)

**Happy coding!** 🚀

---

**Created:** January 2026  
**Version:** 1.0  
**Maintained by:** Your Development Team
