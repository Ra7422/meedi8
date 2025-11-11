#!/bin/bash

echo "Checking Railway deployment status..."
echo ""

# Check if the health endpoint is responding
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://meedi8-production.up.railway.app/health" --max-time 10)
echo "   Health endpoint status: $HEALTH_RESPONSE"

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Backend is healthy!"
else
    echo "   ❌ Backend is not responding properly (HTTP $HEALTH_RESPONSE)"
fi

echo ""
echo "2. Recent git commits:"
git log --oneline -3

echo ""
echo "3. Railway deployment info:"
echo "   Project ID: ec1ccb72-fb04-4d48-b079-3e2eb12af14a"
echo "   URL: https://meedi8-production.up.railway.app"

echo ""
echo "To view logs or trigger redeploy:"
echo "   - Go to Railway dashboard: https://railway.app/dashboard"
echo "   - Or use: railway logs"
