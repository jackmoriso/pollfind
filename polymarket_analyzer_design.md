# Polymarket Trade Analyzer - Technical Design Document

## 1. Project Overview

### 1.1 Purpose
Build a real-time trade monitoring and analysis tool for Polymarket prediction markets to detect potential insider trading patterns, whale movements, and unusual trading activity.

### 1.2 Goals
- Monitor real-time trades on Polymarket markets
- Detect and alert on large trades (whale activity)
- Track specific wallet addresses ("smart money")
- Analyze trading patterns before major events
- Store historical data for backtesting

### 1.3 Tech Stack
- **Language:** TypeScript (Node.js)
- **Database:** SQLite (local) or PostgreSQL (production)
- **Blockchain:** Polygon (MATIC)
- **Notification:** Telegram Bot / Discord Webhook
- **Runtime:** Node.js with tsx

---

## 2. Data Sources

### 2.1 Polymarket API (Primary)
```
Base URL: https://clob.polymarket.com
```

| Endpoint | Description |
|----------|-------------|
| `GET /markets` | List all markets |
| `GET /markets/{id}` | Get specific market details |
| `GET /trades` | Get recent trades |
| `GET /prices` | Get current prices |

### 2.2 Gamma API (Market Data)
```
Base URL: https://gamma-api.polymarket.com
```

| Endpoint | Description |
|----------|-------------|
| `GET /events` | List events with markets |
| `GET /markets` | Detailed market info |

### 2.3 Polygon Chain (On-chain Data)
- **CTF Exchange Contract:** `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
- **USDC Contract:** `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- Use: ethers.js / viem for direct blockchain queries

### 2.4 The Graph (Historical Data)
- Subgraph for Polymarket historical trades
- Useful for backtesting and pattern analysis

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Polymarket Analyzer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Poller     │───▶│   Analyzer   │───▶│   Alerter    │       │
│  │  (5s loop)   │    │  (filters)   │    │ (TG/Discord) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │  API Client  │    │   Database   │                           │
│  │ (Polymarket) │    │   (SQLite)   │                           │
│  └──────────────┘    └──────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Features

### 4.1 Trade Monitor (MVP)
```typescript
interface TradeMonitorConfig {
  pollIntervalMs: number;      // Default: 5000 (5s)
  minTradeSize: number;        // Default: 2500 (USD)
  markets: string[];           // Market IDs to watch (empty = all)
}
```

**Features:**
- [x] Poll trades every N seconds
- [x] Filter by minimum trade size
- [x] Deduplicate seen trades
- [x] Log trade details

### 4.2 Whale Tracker
```typescript
interface WhaleConfig {
  watchedAddresses: string[];  // Specific wallets to track
  minTradeSize: number;        // Threshold for "whale" trade
  alertOnAny: boolean;         // Alert on any trade from watched addresses
}
```

**Features:**
- [x] Track specific wallet addresses
- [x] Alert when watched wallet trades
- [x] Calculate wallet PnL

### 4.3 Market Analyzer
```typescript
interface MarketAnalyzerConfig {
  volumeThreshold: number;     // Alert if volume spikes X%
  priceChangeThreshold: number; // Alert if price moves X%
  timeWindowMinutes: number;   // Analysis window
}
```

**Features:**
- [x] Detect volume spikes
- [x] Detect sudden price movements
- [x] Compare against historical averages

### 4.4 Alerts
```typescript
interface AlertConfig {
  telegram?: {
    botToken: string;
    chatId: string;
  };
  discord?: {
    webhookUrl: string;
  };
  console: boolean;            // Always log to console
}
```

---

## 5. Data Models

### 5.1 Trade
```typescript
interface Trade {
  id: string;
  marketId: string;
  marketSlug: string;
  marketQuestion: string;
  
  // Trade details
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  price: number;              // 0-1
  size: number;               // USD value
  
  // Parties
  maker: string;              // Wallet address
  taker: string;              // Wallet address
  
  // Metadata
  timestamp: Date;
  txHash: string;
  blockNumber: number;
}
```

### 5.2 Market
```typescript
interface Market {
  id: string;
  slug: string;
  question: string;
  description: string;
  
  // Outcomes
  outcomes: string[];         // e.g., ['Yes', 'No']
  outcomePrices: number[];    // e.g., [0.65, 0.35]
  
  // Stats
  volume: number;
  liquidity: number;
  
  // Timing
  endDate: Date;
  createdAt: Date;
  
  // Status
  active: boolean;
  closed: boolean;
  resolved: boolean;
  resolutionOutcome?: string;
}
```

### 5.3 WatchedWallet
```typescript
interface WatchedWallet {
  address: string;
  label: string;              // e.g., "Whale #1", "Insider suspect"
  notes: string;
  addedAt: Date;
  totalTrades: number;
  totalVolume: number;
  winRate: number;
}
```

### 5.4 Alert
```typescript
interface Alert {
  id: string;
  type: 'LARGE_TRADE' | 'WHALE_ACTIVITY' | 'VOLUME_SPIKE' | 'PRICE_MOVE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Context
  marketId: string;
  tradeId?: string;
  walletAddress?: string;
  
  // Details
  message: string;
  data: Record<string, any>;
  
  // Status
  createdAt: Date;
  sentAt?: Date;
  acknowledged: boolean;
}
```

---

## 6. Project Structure

```
polymarket-analyzer/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration
│   │
│   ├── api/
│   │   ├── polymarket.ts     # Polymarket API client
│   │   ├── gamma.ts          # Gamma API client
│   │   └── polygon.ts        # On-chain data client
│   │
│   ├── core/
│   │   ├── poller.ts         # Trade polling loop
│   │   ├── analyzer.ts       # Trade analysis logic
│   │   ├── tracker.ts        # Wallet tracking
│   │   └── alerter.ts        # Notification system
│   │
│   ├── db/
│   │   ├── client.ts         # Database client
│   │   ├── schema.ts         # Table definitions
│   │   └── queries.ts        # Common queries
│   │
│   ├── utils/
│   │   ├── logger.ts         # Logging utility
│   │   ├── format.ts         # Data formatting
│   │   └── sleep.ts          # Async utilities
│   │
│   └── types/
│       └── index.ts          # TypeScript interfaces
│
├── data/
│   └── trades.db             # SQLite database
│
├── .env                      # Environment variables
├── .env.example              # Example env file
├── package.json
├── tsconfig.json
└── README.md
```

---

## 7. Configuration

### 7.1 Environment Variables (.env)
```bash
# Polymarket
POLYMARKET_API_URL=https://clob.polymarket.com
GAMMA_API_URL=https://gamma-api.polymarket.com

# Polygon RPC
POLYGON_RPC_URL=https://polygon-rpc.com

# Monitoring
POLL_INTERVAL_MS=5000
MIN_TRADE_SIZE_USD=2500

# Alerts - Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Alerts - Discord (optional)
DISCORD_WEBHOOK_URL=your_webhook_url

# Database
DATABASE_PATH=./data/trades.db
```

### 7.2 Runtime Config (config.ts)
```typescript
export const config = {
  // Polling
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '5000'),
  
  // Filters
  minTradeSize: parseInt(process.env.MIN_TRADE_SIZE_USD || '2500'),
  
  // Markets to watch (empty = all)
  watchMarkets: [
    // Add specific market IDs or slugs
  ],
  
  // Wallets to track
  watchWallets: [
    // Add known whale/insider addresses
  ],
  
  // Alert thresholds
  alerts: {
    largeTrade: 10000,        // $10k+
    whaleTrade: 50000,        // $50k+
    volumeSpike: 2.0,         // 2x normal volume
    priceMove: 0.10,          // 10% price change
  }
};
```

---

## 8. Implementation Phases

### Phase 1: MVP (Core Monitoring)
- [x] Project setup (TypeScript, dependencies)
- [x] Polymarket API client
- [x] Trade polling loop
- [x] Large trade filter
- [x] Console logging
- [x] Basic deduplication (in-memory Set)

**Deliverable:** Script that logs large trades to console

### Phase 2: Persistence & Alerts
- [ ] SQLite database setup
- [ ] Store all trades
- [ ] Telegram bot integration
- [ ] Discord webhook integration
- [ ] Duplicate detection from DB

**Deliverable:** Persistent storage + notifications

### Phase 3: Analysis
- [ ] Wallet tracking
- [ ] Volume spike detection
- [ ] Price movement alerts
- [ ] Historical pattern analysis

**Deliverable:** Smart alerts based on patterns

### Phase 4: Dashboard (Optional)
- [ ] Web UI for monitoring
- [ ] Trade history view
- [ ] Wallet PnL tracking
- [ ] Market overview

**Deliverable:** Visual dashboard

---

## 9. Key API Examples

### 9.1 Fetch Markets
```typescript
// GET https://gamma-api.polymarket.com/markets?closed=false&limit=100

interface MarketResponse {
  id: string;
  question: string;
  slug: string;
  outcomePrices: string;  // JSON string: "[0.65, 0.35]"
  volume: string;
  liquidity: string;
  endDate: string;
  active: boolean;
}
```

### 9.2 Fetch Trades
```typescript
// GET https://clob.polymarket.com/trades?market={marketId}&limit=100

interface TradeResponse {
  id: string;
  market: string;
  asset_id: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  maker_address: string;
  taker_address: string;
  timestamp: string;
  transaction_hash: string;
}
```

### 9.3 Sample Polling Code
```typescript
async function pollTrades() {
  const seenTrades = new Set<string>();
  
  while (true) {
    try {
      const trades = await fetchRecentTrades();
      
      for (const trade of trades) {
        if (seenTrades.has(trade.id)) continue;
        seenTrades.add(trade.id);
        
        const sizeUsd = parseFloat(trade.size);
        if (sizeUsd >= config.minTradeSize) {
          console.log(`🐋 Large trade: $${sizeUsd.toFixed(2)}`);
          await sendAlert(trade);
        }
      }
    } catch (err) {
      console.error('Poll error:', err);
    }
    
    await sleep(config.pollIntervalMs);
  }
}
```

---

## 10. Alert Message Format

### Telegram/Discord Message Template
```
🚨 LARGE TRADE DETECTED

📊 Market: Will X happen by Y?
💰 Size: $25,000
📈 Side: BUY YES @ $0.65
👛 Trader: 0x1234...5678

⏰ Time: 2026-01-05 14:30:00 UTC
🔗 TX: polygonscan.com/tx/0x...

#polymarket #whale #trading
```

---

## 11. Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "better-sqlite3": "^9.0.0",
    "dotenv": "^16.0.0",
    "ethers": "^6.0.0",
    "telegraf": "^4.15.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 12. Commands

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Run production
npm start
```

---

## 13. Future Enhancements

1. **Machine Learning** - Train model to detect insider patterns
2. **Social Integration** - Monitor Twitter/Discord for context
3. **Multi-platform** - Support other prediction markets (Kalshi, etc.)
4. **API Server** - Expose data via REST API
5. **Mobile App** - Push notifications to phone

---

## 14. References

- Polymarket Docs: https://docs.polymarket.com/
- Polygon Docs: https://docs.polygon.technology/
- CTF Exchange: https://polygonscan.com/address/0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E

---

*Document Version: 1.0*  
*Created: January 5, 2026*
