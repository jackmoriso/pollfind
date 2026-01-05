#!/bin/bash

# Pollfind Production Startup Script
# Loads environment variables from .env before starting the analyzer

set -e

echo "🚀 Starting Polyfind Trade Analyzer..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "📝 Creating .env from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
    exit 1
  else
    echo "❌ Error: .env.example not found"
    exit 1
  fi
fi

# Load environment variables
echo "📦 Loading environment variables from .env..."
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)

# Verify critical variables
if [ -z "$POLYMARKET_API_URL" ]; then
  echo "❌ Error: POLYMARKET_API_URL not set"
  exit 1
fi

if [ -z "$GAMMA_API_URL" ]; then
  echo "❌ Error: GAMMA_API_URL not set"
  exit 1
fi

echo "✅ Environment variables loaded successfully"
echo "   POLYMARKET_API_URL: ${POLYMARKET_API_URL}"
echo "   GAMMA_API_URL: ${GAMMA_API_URL}"
echo "   POLL_INTERVAL_MS: ${POLL_INTERVAL_MS:-5000}"
echo "   MIN_TRADE_SIZE_USD: ${MIN_TRADE_SIZE_USD:-2500}"

# Check if Telegram is configured
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
  echo "   📱 Telegram: Enabled"
else
  echo "   📱 Telegram: Disabled"
fi

# Check if Discord is configured
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
  echo "   💬 Discord: Enabled"
else
  echo "   💬 Discord: Disabled"
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "⚠️  dist/ directory not found, running build..."
  npm run build
fi

# Start the application
echo "🌐 Starting Polymarket Trade Analyzer..."
exec node dist/index.js
