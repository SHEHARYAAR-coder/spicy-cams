#!/bin/bash

# Pre-Deployment Checklist Script for SpicyCams
# This script checks if your app is ready for deployment

echo "🚀 SpicyCams Deployment Readiness Check"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node version: $NODE_VERSION"
if [[ "$NODE_VERSION" < "v18" ]]; then
  echo -e "   ${RED}❌ Node.js 18+ required${NC}"
else
  echo -e "   ${GREEN}✅ Node.js version OK${NC}"
fi
echo ""

# Check if .env exists
echo "🔐 Checking environment variables..."
if [ -f .env ]; then
  echo -e "   ${GREEN}✅ .env file exists${NC}"
  
  # Check required variables
  REQUIRED_VARS=("DATABASE_URL" "STRIPE_SECRET_KEY" "STRIPE_PUBLIC_KEY" "STRIPE_WEBHOOK_SECRET" "LIVEKIT_URL" "LIVEKIT_API_KEY" "LIVEKIT_API_SECRET" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "NEXT_PUBLIC_APP_URL")
  
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env; then
      echo -e "   ${GREEN}✅ $var${NC}"
    else
      echo -e "   ${RED}❌ Missing $var${NC}"
    fi
  done
else
  echo -e "   ${RED}❌ .env file not found${NC}"
fi
echo ""

# Check if dependencies are installed
echo "📚 Checking dependencies..."
if [ -d "node_modules" ]; then
  echo -e "   ${GREEN}✅ node_modules exists${NC}"
else
  echo -e "   ${RED}❌ Run 'npm install' first${NC}"
fi
echo ""

# Try to build
echo "🔨 Testing build..."
if npm run build > /dev/null 2>&1; then
  echo -e "   ${GREEN}✅ Build successful${NC}"
else
  echo -e "   ${RED}❌ Build failed - fix errors first${NC}"
  echo "   Run 'npm run build' to see errors"
fi
echo ""

# Check Prisma
echo "🗄️  Checking database..."
if npx prisma migrate status > /dev/null 2>&1; then
  echo -e "   ${GREEN}✅ Database migrations OK${NC}"
else
  echo -e "   ${YELLOW}⚠️  Database connection issue or migrations needed${NC}"
fi
echo ""

# Check Git
echo "📝 Checking Git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current)
  echo "   Current branch: $BRANCH"
  
  if [[ -z $(git status -s) ]]; then
    echo -e "   ${GREEN}✅ Working tree clean${NC}"
  else
    echo -e "   ${YELLOW}⚠️  Uncommitted changes${NC}"
    echo "   Run: git add . && git commit -m 'Ready for deployment'"
  fi
else
  echo -e "   ${RED}❌ Not a git repository${NC}"
fi
echo ""

# Final recommendations
echo "📋 Deployment Recommendations:"
echo "=================================="
echo ""
echo "1. ✅ Use Vercel (recommended)"
echo "   - Best Next.js support"
echo "   - Perfect for this app"
echo "   - Run: npx vercel"
echo ""
echo "2. ⚠️  Netlify (not recommended)"
echo "   - Limited Next.js App Router support"
echo "   - May have issues with WebSockets/Streaming"
echo "   - Webhook reliability concerns"
echo ""
echo "3. 🔧 Before deploying:"
echo "   - Generate new AUTH_SECRET: openssl rand -base64 32"
echo "   - Get new Stripe webhook secret for production"
echo "   - Update NEXT_PUBLIC_APP_URL to production URL"
echo "   - Configure Google OAuth redirect URI"
echo ""
echo "4. 📚 Read the guides:"
echo "   - docs/DEPLOYMENT_GUIDE.md"
echo "   - docs/PAYMENT_ISSUE_FIX.md"
echo ""
echo "=================================="
echo "Ready to deploy? Run: npx vercel"
echo "=================================="
