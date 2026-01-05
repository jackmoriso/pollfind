# Polymarket Trade Analyzer

Real-time trade monitoring and analysis tool for Polymarket prediction markets. Detect whale movements, large trades, and unusual trading activity.

## Features

- 🔍 **Real-time Trade Monitoring** - Poll Polymarket trades every 5 seconds
- 🐋 **Whale Tracking** - Monitor specific wallet addresses for trading activity
- 📊 **Large Trade Alerts** - Get notified when significant trades occur
- 📱 **Multi-channel Notifications** - Telegram, Discord, and console logging
- 🎯 **Market Filtering** - Focus on specific markets or monitor all

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install
```

### 2. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` and set your preferences:

```bash
# Required: API endpoints (defaults provided)
POLYMARKET_API_URL=https://clob.polymarket.com
GAMMA_API_URL=https://gamma-api.polymarket.com

# Required: Monitoring settings
POLL_INTERVAL_MS=5000
MIN_TRADE_SIZE_USD=2500

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Optional: Discord notifications
DISCORD_WEBHOOK_URL=your_webhook_url_here

# Optional: Watch specific wallets (comma-separated)
WATCH_WALLETS=0x1234...,0x5678...
```

### 3. Run

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

## Configuration Options

### Alert Thresholds

Configure different alert levels in `.env`:

```bash
ALERT_LARGE_TRADE=10000    # Trades >= $10k
ALERT_WHALE_TRADE=50000    # Trades >= $50k (higher priority)
```

### Watch Specific Markets

To monitor only specific markets, add their IDs to `.env`:

```bash
WATCH_MARKETS=market_id_1,market_id_2,market_id_3
```

Leave empty to monitor all markets.

### Track Whale Wallets

Add wallet addresses you want to track:

```bash
WATCH_WALLETS=0x1234567890abcdef,0xfedcba0987654321
```

You'll receive alerts whenever these addresses make trades.

## Notification Setup

### Telegram

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your chat ID from [@userinfobot](https://t.me/userinfobot)
3. Add to `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_CHAT_ID=123456789
   ```

### Discord

1. Go to Server Settings > Integrations > Webhooks
2. Create a new webhook
3. Copy the webhook URL
4. Add to `.env`:
   ```bash
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

## Project Structure

```
polymarket-analyzer/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration loader
│   ├── api/
│   │   └── polymarket.ts     # Polymarket API client
│   ├── core/
│   │   ├── poller.ts         # Trade polling loop
│   │   └── alerter.ts        # Notification system
│   ├── utils/
│   │   ├── logger.ts         # Logging utility
│   │   ├── format.ts         # Data formatting
│   │   └── sleep.ts          # Async utilities
│   └── types/
│       └── index.ts          # TypeScript types
├── data/
│   └── trades.db             # SQLite database (future)
├── .env                      # Your configuration
├── package.json
└── README.md
```

## Alert Format

When a large trade is detected, you'll receive:

```
🚨 LARGE TRADE DETECTED

📊 Market: Will X happen by Y?
💰 Size: $25,000
📈 Side: BUY YES @ 65.0%
👛 Maker: 0x1234...5678
👛 Taker: 0xabcd...ef90

⏰ Time: 2026-01-05 14:30:00 UTC
🔗 TX: polygonscan.com/tx/0x...

#polymarket #whale #trading
```

## Development

```bash
# Run in dev mode with auto-reload
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build
```

## Roadmap

- [x] Phase 1: MVP - Trade monitoring and alerts
- [ ] Phase 2: Database persistence (SQLite)
- [ ] Phase 3: Pattern analysis and volume spike detection
- [ ] Phase 4: Web dashboard

## API Endpoints Used

- **CLOB API**: `https://clob.polymarket.com`
  - `/trades` - Fetch recent trades
- **Gamma API**: `https://gamma-api.polymarket.com`
  - `/markets` - Get market information
  - `/markets/{id}` - Get specific market details

## Troubleshooting

### No trades appearing

- Check if `POLYMARKET_API_URL` is correct
- Ensure your internet connection is stable
- Try increasing `POLL_INTERVAL_MS` if rate-limited

### Telegram not working

- Verify `TELEGRAM_BOT_TOKEN` is correct
- Ensure you've started a chat with your bot
- Check `TELEGRAM_CHAT_ID` is your actual chat ID

### Discord not working

- Verify webhook URL is complete and correct
- Ensure webhook hasn't been deleted from Discord

## License

MIT

## Disclaimer

This tool is for educational and research purposes. Always comply with Polymarket's Terms of Service and API usage guidelines.
