#!/bin/bash

echo "🧪 Testing Payment Processing API"
echo "================================"
echo ""

# Check if sessionId is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <stripe_session_id>"
    echo "Example: $0 cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
    echo ""
    echo "💡 Get a session ID by:"
    echo "   1. Making a test purchase"
    echo "   2. Looking at the URL after checkout"
    echo "   3. Or checking the browser network tab"
    exit 1
fi

SESSION_ID="$1"

echo "🔍 Testing session ID: $SESSION_ID"
echo ""

# Test the manual payment processing endpoint
echo "📡 Calling payment processing API..."

curl -X POST http://localhost:3000/api/stripe/process-payment \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat ~/.nextauth_test_cookie 2>/dev/null || echo '')" \
  -d "{\"sessionId\": \"$SESSION_ID\"}" \
  -w "\n\nResponse Status: %{http_code}\n" \
  2>/dev/null

echo ""
echo "✅ Test completed"
echo ""
echo "💡 If you get a 401 Unauthorized error:"
echo "   - Make sure you're logged into the app"
echo "   - Try copying your session cookie manually"
echo ""
echo "💡 If you get a 400 Bad Request:"
echo "   - Check if the session ID is valid"
echo "   - Verify the payment was actually completed in Stripe"