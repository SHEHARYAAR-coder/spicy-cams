#!/bin/bash

# Google OAuth Setup Verification Script
# This script checks if all required configurations are in place

echo "🔍 Checking Google OAuth Setup for SpicyCams..."
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ .env file found"
    
    # Check for required environment variables
    if grep -q "GOOGLE_CLIENT_ID" .env; then
        echo "✅ GOOGLE_CLIENT_ID is set"
    else
        echo "❌ GOOGLE_CLIENT_ID is missing in .env"
        echo "   Add: GOOGLE_CLIENT_ID=\"your-client-id.apps.googleusercontent.com\""
    fi
    
    if grep -q "GOOGLE_CLIENT_SECRET" .env; then
        echo "✅ GOOGLE_CLIENT_SECRET is set"
    else
        echo "❌ GOOGLE_CLIENT_SECRET is missing in .env"
        echo "   Add: GOOGLE_CLIENT_SECRET=\"your-client-secret\""
    fi
    
    if grep -q "NEXTAUTH_URL" .env; then
        echo "✅ NEXTAUTH_URL is set"
    else
        echo "❌ NEXTAUTH_URL is missing in .env"
        echo "   Add: NEXTAUTH_URL=\"http://localhost:3000\""
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env; then
        echo "✅ NEXTAUTH_SECRET is set"
    else
        echo "❌ NEXTAUTH_SECRET is missing in .env"
        echo "   Generate one with: openssl rand -base64 32"
    fi
else
    echo "❌ .env file not found"
    echo "   Copy .env.example to .env and fill in your values"
    echo "   cp .env.example .env"
fi

echo ""

# Check if required files exist
echo "📁 Checking required files..."

if [ -f "lib/auth-config.ts" ]; then
    if grep -q "GoogleProvider" lib/auth-config.ts; then
        echo "✅ GoogleProvider configured in auth-config.ts"
    else
        echo "❌ GoogleProvider not found in auth-config.ts"
    fi
else
    echo "❌ lib/auth-config.ts not found"
fi

if [ -f "src/components/auth/login-form.tsx" ]; then
    if grep -q "signIn(\"google\"" src/components/auth/login-form.tsx; then
        echo "✅ Google OAuth button configured in login form"
    else
        echo "❌ Google OAuth button not configured in login form"
    fi
else
    echo "❌ src/components/auth/login-form.tsx not found"
fi

if [ -f "src/components/auth/register-form.tsx" ]; then
    if grep -q "signIn(\"google\"" src/components/auth/register-form.tsx; then
        echo "✅ Google OAuth button configured in register form"
    else
        echo "❌ Google OAuth button not configured in register form"
    fi
else
    echo "❌ src/components/auth/register-form.tsx not found"
fi

echo ""
echo "📚 Documentation:"
if [ -f "docs/GOOGLE_OAUTH_SETUP.md" ]; then
    echo "✅ Setup guide available at docs/GOOGLE_OAUTH_SETUP.md"
else
    echo "❌ Setup guide not found"
fi

if [ -f "docs/GOOGLE_OAUTH_IMPLEMENTATION.md" ]; then
    echo "✅ Implementation summary available at docs/GOOGLE_OAUTH_IMPLEMENTATION.md"
else
    echo "❌ Implementation summary not found"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Set up Google OAuth credentials in Google Cloud Console"
echo "   Follow: docs/GOOGLE_OAUTH_SETUP.md"
echo ""
echo "2. Add credentials to .env file:"
echo "   GOOGLE_CLIENT_ID=\"your-client-id\""
echo "   GOOGLE_CLIENT_SECRET=\"your-client-secret\""
echo ""
echo "3. Generate NEXTAUTH_SECRET (if not set):"
echo "   openssl rand -base64 32"
echo ""
echo "4. Restart your development server:"
echo "   npm run dev"
echo ""
echo "5. Test the integration at:"
echo "   http://localhost:3000/v/login (for viewers)"
echo "   http://localhost:3000/m/login (for models)"
echo ""
