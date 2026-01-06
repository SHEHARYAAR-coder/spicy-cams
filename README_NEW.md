# 🎥 SpicyCams - Live Streaming Platform

A credit-gated live streaming platform with integrated payment solutions.

## 🚀 Features

- 🎬 Live streaming with LiveKit
- 💳 **Dual Payment System:**
  - Credit/Debit Cards (Stripe)
  - **Cryptocurrency (Coinbase Commerce)** ⭐ NEW!
- 🪙 Token-based credit system
- 💬 Real-time chat
- 📱 Responsive design
- 🔐 Secure authentication
- 📊 Earnings tracking
- 👤 User profiles
- 🎯 Model verification system

## 💰 Payment Methods

### Credit/Debit Card (Stripe)

- Instant payment processing
- All major cards accepted
- Immediate token delivery

### Cryptocurrency (Coinbase Commerce) 🆕

- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- USD Coin (USDC)
- And more!

**📖 [See Full Payment Comparison](PAYMENT_COMPARISON.md)**

## 🛠️ Tech Stack

- **Framework:** Next.js 15
- **Database:** PostgreSQL with Prisma
- **Authentication:** NextAuth.js
- **Payments:**
  - Stripe (Cards)
  - Coinbase Commerce (Crypto)
- **Streaming:** LiveKit
- **Styling:** Tailwind CSS
- **Real-time:** Redis

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## ⚙️ Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
AUTH_SECRET="your-secret"

# Stripe (Card Payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Coinbase Commerce (Crypto Payments) - NEW!
COINBASE_COMMERCE_API_KEY="your-api-key"
COINBASE_COMMERCE_WEBHOOK_SECRET="your-webhook-secret"

# LiveKit
LIVEKIT_URL="wss://..."
LIVEKIT_API_KEY="..."
LIVEKIT_API_SECRET="..."
NEXT_PUBLIC_LIVEKIT_URL="wss://..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🚀 Quick Start - Crypto Payments

Want to enable crypto payments? It's easy!

1. **Get Coinbase Commerce account** (free)
2. **Get API keys** from dashboard
3. **Update .env** with your credentials
4. **Setup webhook** endpoint
5. **Test it!**

**📖 [Complete Setup Guide](COINBASE_SETUP.md)**  
**⚡ [5-Minute Quick Start](QUICK_START.md)**

## 📁 Project Structure

```
spicy-cams/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stripe/          # Stripe payment endpoints
│   │   │   ├── coinbase/        # Coinbase crypto endpoints 🆕
│   │   │   ├── payments/
│   │   │   ├── streams/
│   │   │   └── ...
│   │   ├── checkout/            # Payment checkout page
│   │   ├── pricing/             # Token pricing page
│   │   └── ...
│   ├── components/
│   │   ├── pricing/
│   │   │   ├── crypto-payment-dialog.tsx 🆕
│   │   │   └── viewer-token-page.tsx
│   │   └── ...
│   └── lib/
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── test-coinbase-setup.sh   # Verify crypto setup 🆕
├── COINBASE_SETUP.md            # Crypto setup guide 🆕
├── PAYMENT_COMPARISON.md         # Payment methods comparison 🆕
├── QUICK_START.md               # Quick start guide 🆕
└── README.md
```

## 🧪 Testing

### Test Crypto Payment Setup

```bash
./scripts/test-coinbase-setup.sh
```

### Run Development Server

```bash
npm run dev
```

### Open Prisma Studio

```bash
npx prisma studio
```

## 📚 Documentation

- **[Coinbase Setup Guide](COINBASE_SETUP.md)** - Complete crypto payment setup
- **[Quick Start Guide](QUICK_START.md)** - Get crypto payments running in 5 minutes
- **[Payment Comparison](PAYMENT_COMPARISON.md)** - Card vs Crypto comparison
- **[API Documentation](docs/API.md)** - API endpoints reference

## 🔐 Security

- ✅ Webhook signature verification
- ✅ Environment variable protection
- ✅ Secure payment processing
- ✅ User authentication required
- ✅ HTTPS enforcement (production)
- ✅ Duplicate payment prevention
- ✅ Complete audit trail

## 📊 Token Pricing

| Plan  | Price | Tokens | Plan ID |
| ----- | ----- | ------ | ------- |
| Basic | $5    | 10     | basic   |
| Plus  | $15   | 50     | plus    |
| Pro   | $50   | 200    | pro     |

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Production Checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set production Stripe keys
- [ ] Set production Coinbase Commerce keys
- [ ] Configure webhook URLs (use HTTPS)
- [ ] Test payment flows
- [ ] Enable error monitoring
- [ ] Review security settings

## 🆘 Support

### Payment Issues

- **Stripe:** https://support.stripe.com/
- **Coinbase Commerce:** https://help.coinbase.com/en/commerce

### Technical Support

- Check documentation files
- Review application logs
- Test with verification script

## 📝 License

[Your License Here]

## 🤝 Contributing

Contributions are welcome! Please follow the standard fork-and-pull-request workflow.

---

**Built with ❤️ using Next.js, Stripe, and Coinbase Commerce**

**Last Updated:** January 2026
