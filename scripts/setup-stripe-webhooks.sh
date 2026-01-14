#!/bin/bash

echo "🎯 Stripe Webhook Setup for Development"
echo "======================================"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed."
    echo "📥 Install it from: https://stripe.com/docs/stripe-cli"
    echo ""
    echo "🍎 macOS: brew install stripe/stripe-cli/stripe"
    echo "🐧 Linux: Download from GitHub releases"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI found"

# Check if user is logged in to Stripe
if ! stripe config --list | grep -q "account_id"; then
    echo "❌ Not logged in to Stripe CLI"
    echo "🔑 Please run: stripe login"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI authenticated"

# Check if app is running on port 3000
if ! curl -s http://localhost:3000/api/stripe/config >/dev/null 2>&1; then
    echo "❌ App not running on http://localhost:3000"
    echo "🚀 Please start your Next.js app first: npm run dev"
    echo ""
    exit 1
fi

echo "✅ App running on localhost:3000"
echo ""

# Start webhook forwarding
echo "🎣 Starting webhook forwarding..."
echo "⚠️  Keep this terminal open while testing payments"
echo "🔄 Webhooks will be forwarded to: http://localhost:3000/api/stripe/webhook"
echo ""
echo "📝 To test a payment:"
echo "   1. Go to http://localhost:3000/pricing"
echo "   2. Select a plan and click 'Buy Tokens'"
echo "   3. Use test card: 4242 4242 4242 4242"
echo "   4. Any future date for expiry"
echo "   5. Any 3-digit CVC"
echo ""

stripe listen --forward-to localhost:3000/api/stripe/webhook