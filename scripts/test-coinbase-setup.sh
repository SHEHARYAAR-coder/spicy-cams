#!/bin/bash

# Test script for Coinbase Commerce Integration
# This script helps verify your setup is correct

echo "🔍 Coinbase Commerce Integration - Setup Verification"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check for required environment variables
echo "📋 Checking environment variables..."
echo ""

# Function to check env var
check_env() {
    local var_name=$1
    local var_value=$(grep "^$var_name=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name - NOT SET"
        return 1
    elif [[ "$var_value" == *"your_"* ]] || [[ "$var_value" == *"_here"* ]]; then
        echo "⚠️  $var_name - PLACEHOLDER (needs actual value)"
        return 1
    else
        echo "✅ $var_name - SET"
        return 0
    fi
}

# Check all required variables
all_good=true

check_env "COINBASE_COMMERCE_API_KEY" || all_good=false
check_env "COINBASE_COMMERCE_WEBHOOK_SECRET" || all_good=false
check_env "NEXT_PUBLIC_APP_URL" || all_good=false

echo ""
echo "=================================================="

if [ "$all_good" = true ]; then
    echo "✅ All environment variables are configured!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure your Next.js app is running: npm run dev"
    echo "2. Test the checkout flow at: http://localhost:3000/pricing"
    echo "3. For webhook testing, expose your local server with ngrok"
    echo ""
    echo "📖 See COINBASE_SETUP.md for detailed instructions"
else
    echo "⚠️  Some environment variables need attention"
    echo ""
    echo "Please update your .env file with actual values from:"
    echo "https://commerce.coinbase.com/dashboard/settings"
    echo ""
    echo "📖 See COINBASE_SETUP.md for detailed instructions"
fi

echo ""
echo "=================================================="
echo ""

# Check if required files exist
echo "📁 Checking integration files..."
echo ""

files=(
    "src/app/api/coinbase/create-charge/route.ts"
    "src/app/api/coinbase/webhook/route.ts"
    "src/components/pricing/crypto-payment-dialog.tsx"
    "src/app/checkout/page.tsx"
    "COINBASE_SETUP.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

echo ""
echo "=================================================="
echo ""
echo "🚀 Ready to test? Run: npm run dev"
echo ""
