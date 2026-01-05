# Technical Design Document - Polymarket Trade Analyzer

**Version:** 1.0
**Last Updated:** 2026-01-06
**Status:** In Development - Phase 1 Complete

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Design](#2-architecture-design)
3. [Technology Stack](#3-technology-stack)
4. [Data Models](#4-data-models)
5. [API Integration](#5-api-integration)
6. [Core Components](#6-core-components)
7. [Data Flow](#7-data-flow)
8. [Security Considerations](#8-security-considerations)
9. [Performance & Scalability](#9-performance--scalability)
10. [Error Handling Strategy](#10-error-handling-strategy)

---

## 1. System Overview

### 1.1 Purpose
The Polymarket Trade Analyzer is a real-time monitoring system designed to detect and analyze trading patterns on the Polymarket prediction market platform. It identifies large trades, whale wallet activity, and unusual market movements.

### 1.2 Key Objectives
- **Real-time Monitoring**: Poll trade data every 5 seconds
- **Pattern Detection**: Identify whale activity and unusual trading patterns
- **Multi-channel Alerts**: Send notifications via Telegram, Discord, and console
- **Historical Analysis**: Store trade data for backtesting (future phase)
- **Extensibility**: Modular design for easy feature additions

### 1.3 Target Users
- Crypto traders seeking market intelligence
- Researchers analyzing prediction market behavior
- Institutional investors tracking whale movements
- Market makers monitoring liquidity events

---

## 2. Architecture Design

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Polymarket Trade Analyzer                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ TradePoller  │───▶│   Analyzer   │───▶│   Alerter    │      │
│  │  (5s loop)   │    │  (Filters)   │    │ (TG/Discord) │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │ PolymarketAPI│    │   Database   │                          │
│  │   Client     │    │  (Future)    │                          │
│  └──────────────┘    └──────────────┘                          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────┐                          │
│  │    External APIs                 │                          │
│  │  - CLOB API (trades)             │                          │
│  │  - Gamma API (markets)           │                          │
│  │  - Polygon RPC (on-chain)        │                          │
│  └──────────────────────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility | Input | Output |
|-----------|---------------|-------|--------|
| **TradePoller** | Orchestrates polling loop, deduplication | Config, API Client | New trades |
| **PolymarketAPI** | API communication, data transformation | HTTP requests | Typed trade/market objects |
| **Alerter** | Notification dispatch | Trade objects, severity | Sent messages |
| **Logger** | Centralized logging | Log messages | Console output |
| **Config** | Environment management | .env file | Typed config object |

### 2.3 Design Patterns Used

- **Repository Pattern**: API client abstracts data source
- **Observer Pattern**: Alerter notifies multiple channels
- **Strategy Pattern**: Configurable alert thresholds
- **Singleton Pattern**: Single config instance
- **Factory Pattern**: Trade/market object transformation

---

## 3. Technology Stack

### 3.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | 5.0+ | Type-safe development |
| **Node.js** | 20+ | Runtime environment |
| **tsx** | 4.0+ | Development runtime |
| **axios** | 1.6+ | HTTP client |
| **dotenv** | 16.0+ | Environment variables |

### 3.2 Notification Services

| Service | Library | Purpose |
|---------|---------|---------|
| **Telegram** | telegraf 4.15+ | Bot messaging |
| **Discord** | axios (webhooks) | Server notifications |

### 3.3 Future Technologies

| Technology | Purpose | Phase |
|------------|---------|-------|
| **better-sqlite3** | Local database | Phase 2 |
| **PostgreSQL** | Production database | Phase 3 |
| **ethers.js** | On-chain queries | Phase 3 |
| **Express** | REST API server | Phase 4 |
| **React** | Web dashboard | Phase 4 |

---

## 4. Data Models

### 4.1 Trade Model

```typescript
interface Trade {
  // Identifiers
  id: string;                    // Unique trade ID from API
  marketId: string;              // Market identifier
  marketSlug: string;            // Human-readable market slug
  marketQuestion: string;        // Market question text

  // Trade Details
  side: 'BUY' | 'SELL';         // Trade direction
  outcome: 'YES' | 'NO';        // Outcome being traded
  price: number;                 // Price (0-1 range)
  size: number;                  // Trade size in USD

  // Participants
  maker: string;                 // Maker wallet address (0x...)
  taker: string;                 // Taker wallet address (0x...)

  // Metadata
  timestamp: Date;               // Trade execution time
  txHash: string;                // Polygon transaction hash
  blockNumber?: number;          // Block number (optional)
}
```

**Field Validation Rules:**
- `id`: Non-empty string, unique
- `price`: 0 ≤ price ≤ 1
- `size`: size > 0
- `maker/taker`: Valid Ethereum address (0x + 40 hex chars)
- `timestamp`: Valid ISO 8601 date

### 4.2 Market Model

```typescript
interface Market {
  // Identifiers
  id: string;                    // Unique market ID
  slug: string;                  // URL-friendly identifier
  question: string;              // Market question
  description: string;           // Detailed description

  // Outcomes
  outcomes: string[];            // e.g., ['Yes', 'No']
  outcomePrices: number[];       // Current prices (0-1)

  // Statistics
  volume: number;                // Total volume in USD
  liquidity: number;             // Available liquidity

  // Timing
  endDate: Date;                 // Market close date
  createdAt: Date;               // Creation timestamp

  // Status
  active: boolean;               // Currently trading
  closed: boolean;               // Trading ended
  resolved: boolean;             // Outcome determined
  resolutionOutcome?: string;    // Winning outcome
}
```

### 4.3 Alert Model

```typescript
interface Alert {
  id: string;                    // UUID
  type: AlertType;               // Alert category
  severity: Severity;            // Priority level

  // Context
  marketId: string;
  tradeId?: string;
  walletAddress?: string;

  // Content
  message: string;               // Alert message
  data: Record<string, any>;     // Additional metadata

  // Status
  createdAt: Date;
  sentAt?: Date;
  acknowledged: boolean;
}

enum AlertType {
  LARGE_TRADE = 'LARGE_TRADE',
  WHALE_ACTIVITY = 'WHALE_ACTIVITY',
  VOLUME_SPIKE = 'VOLUME_SPIKE',
  PRICE_MOVE = 'PRICE_MOVE'
}

enum Severity {
  LOW = 'LOW',       // $2.5k - $10k
  MEDIUM = 'MEDIUM', // $10k - $50k
  HIGH = 'HIGH'      // $50k+
}
```

---

## 5. API Integration

### 5.1 Polymarket CLOB API

**Base URL:** `https://clob.polymarket.com`

#### Endpoint: GET /trades

**Purpose:** Fetch recent trades

**Request Parameters:**
```typescript
interface TradeQueryParams {
  market?: string;    // Filter by market ID (optional)
  limit?: number;     // Max results (default: 100, max: 1000)
}
```

**Response Format:**
```typescript
interface TradeResponse {
  id: string;
  market: string;
  asset_id: string;
  side: 'BUY' | 'SELL';
  price: string;              // Decimal string
  size: string;               // USD value as string
  maker_address: string;
  taker_address: string;
  timestamp: string;          // ISO 8601
  transaction_hash: string;
  outcome: string;
  status?: string;
}
```

**Rate Limits:**
- 100 requests per minute
- Retry with exponential backoff on 429

**Error Handling:**
- 429: Wait and retry (exponential backoff)
- 500/502/503: Retry up to 3 times
- 404: Market not found (skip)
- Network errors: Log and continue

### 5.2 Gamma API

**Base URL:** `https://gamma-api.polymarket.com`

#### Endpoint: GET /markets

**Purpose:** Fetch market information

**Request Parameters:**
```typescript
interface MarketQueryParams {
  closed?: boolean;   // Include closed markets
  limit?: number;     // Max results (default: 100)
}
```

**Response Format:**
```typescript
interface MarketResponse {
  id: string;
  question: string;
  slug: string;
  description?: string;
  outcomePrices: string;      // JSON string: "[0.65, 0.35]"
  outcomes: string;           // JSON string: ["Yes", "No"]
  volume: string;
  liquidity: string;
  endDate: string;            // ISO 8601
  createdAt: string;
  active: boolean;
  closed: boolean;
  resolved?: boolean;
}
```

#### Endpoint: GET /markets/{id}

**Purpose:** Fetch single market details

**Path Parameters:**
- `id`: Market identifier

**Response:** Same as MarketResponse above

---

## 6. Core Components

### 6.1 TradePoller

**File:** `src/core/poller.ts`

**Purpose:** Orchestrates the polling loop and trade processing

**Key Responsibilities:**
1. Poll API at configured intervals
2. Deduplicate trades using in-memory Set
3. Enrich trades with market data
4. Analyze trades against thresholds
5. Trigger alerts for significant events

**State Management:**
```typescript
class TradePoller {
  private seenTradeIds: Set<string>;      // Deduplication
  private watchedWallets: Map<string, string>; // address -> label
  private isRunning: boolean;             // Loop control
}
```

**Core Loop:**
```
START
  ↓
[Fetch Trades from API]
  ↓
[Enrich with Market Data]
  ↓
[Filter New Trades] → (deduplicate using seenTradeIds)
  ↓
[Analyze Each Trade]
  ↓
  ├─ Whale Wallet? → [Send HIGH Alert]
  ├─ Size >= $50k? → [Send HIGH Alert]
  ├─ Size >= $10k? → [Send MEDIUM Alert]
  └─ Size >= $2.5k? → [Send LOW Alert]
  ↓
[Wait Poll Interval]
  ↓
LOOP BACK
```

### 6.2 PolymarketAPI

**File:** `src/api/polymarket.ts`

**Purpose:** Abstract API communication and data transformation

**Key Methods:**

```typescript
class PolymarketAPI {
  // Fetch trades with automatic retry
  async fetchTrades(marketId?: string, limit?: number): Promise<Trade[]>

  // Fetch all markets
  async fetchMarkets(closed?: boolean, limit?: number): Promise<Market[]>

  // Fetch single market
  async fetchMarket(marketId: string): Promise<Market | null>

  // Enrich trades with market metadata
  async enrichTradesWithMarkets(trades: Trade[]): Promise<Trade[]>

  // Transform API response to internal model
  private transformTrade(raw: TradeResponse): Trade
  private transformMarket(raw: MarketResponse): Market
  private parseOutcome(outcomeStr: string): 'YES' | 'NO'
}
```

**Retry Logic:**
- Max attempts: 3
- Initial delay: 1000ms
- Backoff multiplier: 2x
- Retries on: Network errors, 5xx responses

### 6.3 Alerter

**File:** `src/core/alerter.ts`

**Purpose:** Send notifications through multiple channels

**Supported Channels:**
- Console (always active)
- Telegram (optional)
- Discord (optional)

**Key Methods:**

```typescript
class Alerter {
  // Send alert for large trade
  async alertLargeTrade(trade: Trade, severity: Severity): Promise<void>

  // Send alert for whale activity
  async alertWhaleActivity(trade: Trade, walletLabel: string): Promise<void>

  // Send custom message
  async sendCustomAlert(message: string): Promise<void>

  // Format trade as message
  private formatTradeMessage(trade: Trade, severity: Severity): string

  // Channel-specific sending
  private async sendToTelegram(message: string, chatId: string): Promise<void>
  private async sendToDiscord(message: string): Promise<void>
}
```

**Message Format:**
```
🚨 LARGE TRADE DETECTED

📊 Market: {question}
💰 Size: ${amount}
📈 Side: {BUY/SELL} {YES/NO} @ {price}%
👛 Maker: {address}
👛 Taker: {address}

⏰ Time: {timestamp}
🔗 TX: https://polygonscan.com/tx/{hash}

#polymarket #whale #trading
```

---

## 7. Data Flow

### 7.1 Startup Sequence

```
1. Load .env → Config object
2. Validate configuration
3. Initialize API client (CLOB + Gamma)
4. Initialize Alerter (Telegram/Discord)
5. Initialize TradePoller
6. Register signal handlers (SIGINT/SIGTERM)
7. Start polling loop
8. Send startup notification
```

### 7.2 Trade Processing Flow

```
API Response → Transform → Deduplicate → Analyze → Alert

┌──────────────┐
│ CLOB API     │
│ /trades      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Transform    │ TradeResponse[] → Trade[]
│ to Trade[]   │ - Parse strings to numbers
└──────┬───────┘ - Extract outcome
       │
       ▼
┌──────────────┐
│ Enrich with  │ Fetch market metadata
│ Market Data  │ - Question text
└──────┬───────┘ - Slug
       │
       ▼
┌──────────────┐
│ Deduplicate  │ Filter using seenTradeIds Set
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Analyze      │ Check against:
│ Trade        │ - Watched wallets
└──────┬───────┘ - Size thresholds
       │
       ▼
┌──────────────┐
│ Determine    │ LOW / MEDIUM / HIGH
│ Severity     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Send Alerts  │ → Console
│              │ → Telegram
│              │ → Discord
└──────────────┘
```

### 7.3 Error Recovery Flow

```
API Error
  ↓
Log Error
  ↓
Retry? (< 3 attempts)
  ├─ YES → Wait (exponential backoff) → Retry
  └─ NO → Log failure → Continue polling
```

---

## 8. Security Considerations

### 8.1 API Key Management
- **Storage**: Environment variables (.env file)
- **Git**: .env excluded via .gitignore
- **Access**: Read-only at startup
- **Rotation**: Manual process (update .env, restart)

### 8.2 Webhook Security
- **Discord**: Webhook URLs kept secret
- **Telegram**: Bot token never exposed in logs
- **HTTPS**: All API calls use encrypted transport

### 8.3 Input Validation
- **API Responses**: Validate before parsing
- **Addresses**: Check Ethereum address format
- **Numbers**: Validate range (prices 0-1, sizes > 0)
- **Strings**: Sanitize before display

### 8.4 Rate Limiting
- **Respect API limits**: 100 req/min for CLOB
- **Exponential backoff**: On 429 responses
- **Circuit breaker**: Stop after N consecutive failures (future)

---

## 9. Performance & Scalability

### 9.1 Current Performance Metrics

| Metric | Current Value | Target |
|--------|--------------|--------|
| Polling interval | 5s | 5s |
| API response time | ~200-500ms | <1s |
| Trade processing | <50ms | <100ms |
| Memory usage | ~50MB | <200MB |
| Deduplication | O(1) Set lookup | O(1) |

### 9.2 Optimization Strategies

**Memory Management:**
- Limit seenTradeIds Set size (rotate after 10k entries)
- Lazy load market data (cache frequently accessed markets)

**API Efficiency:**
- Batch market fetches when possible
- Cache market metadata (5-minute TTL)
- Use conditional requests (ETag/If-Modified-Since) - future

**Concurrency:**
- Parallel market enrichment (Promise.all)
- Non-blocking alert sending
- Async/await throughout

### 9.3 Scalability Path

**Phase 2 (Database):**
- Store trades in SQLite/PostgreSQL
- Query for historical analysis
- Reduce memory footprint

**Phase 3 (Distributed):**
- Multiple poller instances (market sharding)
- Redis for shared deduplication
- Message queue for alert dispatch (RabbitMQ/SQS)

**Phase 4 (Production):**
- Load balancer for API server
- Read replicas for database
- CDN for dashboard assets

---

## 10. Error Handling Strategy

### 10.1 Error Categories

| Category | Examples | Handling |
|----------|----------|----------|
| **Network** | DNS failure, timeout | Retry with backoff |
| **API** | 4xx, 5xx responses | Log, retry if 5xx |
| **Parsing** | Invalid JSON | Log, skip record |
| **Validation** | Invalid address | Log, skip record |
| **System** | Out of memory | Crash and restart |

### 10.2 Error Logging

```typescript
// All errors logged with:
- Timestamp
- Error type/category
- Context (market ID, trade ID)
- Stack trace (for exceptions)
- Attempted retries
```

### 10.3 Graceful Degradation

**Telegram unavailable:**
- Log to console
- Continue monitoring
- Send Discord if available

**API rate limited:**
- Increase poll interval temporarily
- Log warning
- Resume normal interval after cooldown

**Market data unavailable:**
- Send alert with partial data
- Log missing information
- Continue monitoring

---

## Document Maintenance

**Update Frequency:** After each phase completion or significant feature addition

**Update Checklist:**
- [ ] Update version and date
- [ ] Add new components/modules
- [ ] Update architecture diagrams
- [ ] Document API changes
- [ ] Add new data models
- [ ] Update performance metrics
- [ ] Review security considerations

**Last Updated By:** Claude Code AI
**Next Review Date:** After Phase 2 completion

---

*End of Technical Design Document*
