#!/bin/bash

echo "🔧 Adding Telegram environment variables to Railway..."
echo ""

# Project ID from check_railway_status.sh
PROJECT_ID="ec1ccb72-fb04-4d48-b079-3e2eb12af14a"

# Read values from backend/.env
TELEGRAM_API_ID=$(grep "TELEGRAM_API_ID=" backend/.env | cut -d '=' -f2)
TELEGRAM_API_HASH=$(grep "TELEGRAM_API_HASH=" backend/.env | cut -d '=' -f2)
TELEGRAM_SESSION_ENCRYPTION_KEY=$(grep "TELEGRAM_SESSION_ENCRYPTION_KEY=" backend/.env | cut -d '=' -f2)

echo "Found values from backend/.env:"
echo "  TELEGRAM_API_ID=$TELEGRAM_API_ID"
echo "  TELEGRAM_API_HASH=$TELEGRAM_API_HASH"
echo "  TELEGRAM_SESSION_ENCRYPTION_KEY=$TELEGRAM_SESSION_ENCRYPTION_KEY"
echo ""

if [ -z "$TELEGRAM_API_ID" ] || [ -z "$TELEGRAM_API_HASH" ] || [ -z "$TELEGRAM_SESSION_ENCRYPTION_KEY" ]; then
    echo "❌ Error: Could not read all values from backend/.env"
    exit 1
fi

echo "Adding variables to Railway..."
echo ""

# Use Railway CLI to set environment variables
# Note: This requires the project to be linked first
railway variables set "TELEGRAM_API_ID=$TELEGRAM_API_ID" \
                      "TELEGRAM_API_HASH=$TELEGRAM_API_HASH" \
                      "TELEGRAM_SESSION_ENCRYPTION_KEY=$TELEGRAM_SESSION_ENCRYPTION_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Environment variables added successfully!"
    echo ""
    echo "Railway will automatically redeploy with the new variables."
    echo "This usually takes 30-60 seconds."
    echo ""
    echo "You can check deployment status at:"
    echo "https://railway.app/dashboard"
else
    echo ""
    echo "❌ Failed to add environment variables."
    echo "You may need to:"
    echo "  1. Run 'railway link' first to connect to the project"
    echo "  2. Or add them manually in the Railway dashboard:"
    echo "     https://railway.app/project/$PROJECT_ID"
fi
