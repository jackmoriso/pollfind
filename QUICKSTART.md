# Quick Start Guide

**Get the Polymarket Trade Analyzer running in 5 minutes!**

---

## Prerequisites

- Node.js 20+ installed
- npm or yarn

---

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Edit .env (optional for testing)
# - Set POLL_INTERVAL_MS (default: 5000)
# - Set MIN_TRADE_SIZE_USD (default: 2500)
# - Add Telegram/Discord credentials if desired
```

---

## Running the Application

### Development Mode (Recommended)

```bash
npm run dev
```

This will:
- Start the monitoring system
- Display logs in color
- Auto-reload on code changes
- Show all configuration
- Begin polling trades

### Production Mode

```bash
# Build first
npm run build

# Then run
npm start
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test:coverage

# Type checking only
npm run typecheck
```

---

## Configuration

Edit `.env` file:

```bash
# Required - API URLs (defaults work)
POLYMARKET_API_URL=https://clob.polymarket.com
GAMMA_API_URL=https://gamma-api.polymarket.com

# Monitoring
POLL_INTERVAL_MS=5000          # Poll every 5 seconds
MIN_TRADE_SIZE_USD=2500        # Minimum trade size to track

# Alert Thresholds
ALERT_LARGE_TRADE=10000        # $10k+ = MEDIUM alert
ALERT_WHALE_TRADE=50000        # $50k+ = HIGH alert

# Optional - Watch specific markets
WATCH_MARKETS=                 # Empty = all markets

# Optional - Watch specific wallets
WATCH_WALLETS=0xabc...,0xdef...

# Optional - Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Optional - Discord
DISCORD_WEBHOOK_URL=
```

---

## Expected Behavior

When you run the app, you should see:

```
🔍 Polymarket Trade Analyzer
============================================================

Configuration:
  - Polymarket API: https://clob.polymarket.com
  - Gamma API: https://gamma-api.polymarket.com
  - Poll Interval: 5000ms
  - Min Trade Size: $2500
  - Telegram: ✗ Disabled
  - Discord: ✗ Disabled

🚀 Trade poller started
Polling interval: 5000ms
```

---

## Known Issue: API Authentication

Currently, the Polymarket CLOB API returns:
```
Error: 401 Unauthorized - Invalid api key
```

**This is expected!** The API now requires authentication.

**Options:**
1. Get API key from Polymarket (recommended)
2. Use alternative endpoints
3. Test with mock data

The application handles this gracefully and continues running.

---

## Stopping the Application

Press `Ctrl+C` - the application will shut down gracefully.

---

## Next Steps

1. **Read the docs:**
   - `docs/00_PROJECT_SUMMARY.md` - Overview
   - `README.md` - Full user guide

2. **Get API access:**
   - Contact Polymarket for API key
   - Or explore Gamma API as alternative

3. **Set up notifications:**
   - Configure Telegram bot (see README)
   - Or configure Discord webhook

4. **Monitor trades:**
   - Run application 24/7
   - Receive alerts on large trades
   - Track whale wallets

---

## Troubleshooting

**Dependencies fail to install:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
npm run typecheck
```

**Tests failing:**
```bash
npm test -- --verbose
```

**App won't start:**
- Check `.env` file exists
- Verify Node.js version: `node --version` (need 20+)
- Check logs for errors

---

## Documentation

| Document | Purpose |
|----------|---------|
| `QUICKSTART.md` | This file - get started fast |
| `README.md` | Full user guide |
| `docs/00_PROJECT_SUMMARY.md` | Project overview |
| `docs/01_TECHNICAL_DESIGN.md` | Architecture & design |
| `docs/02_DEVELOPMENT_STANDARDS.md` | Code standards |
| `docs/03_ROADMAP_PROGRESS.md` | Progress tracking |
| `docs/04_TESTING.md` | Testing guide |

---

## Commands Cheat Sheet

```bash
# Development
npm run dev              # Run with auto-reload
npm run build            # Compile TypeScript
npm start                # Run compiled code

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run typecheck        # Type checking only

# Useful commands
npm run dev > logs.txt 2>&1 &  # Run in background
tail -f logs.txt               # Watch logs
ps aux | grep tsx              # Find process
kill <PID>                     # Stop process
```

---

**Ready to go! Run `npm run dev` to start monitoring.** 🚀
