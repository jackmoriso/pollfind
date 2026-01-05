# Development Standards & Guidelines

**Project:** Polymarket Trade Analyzer
**Version:** 1.0
**Last Updated:** 2026-01-06
**Status:** Active

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [Code Standards](#2-code-standards)
3. [Module Design Standards](#3-module-design-standards)
4. [API Design Standards](#4-api-design-standards)
5. [Frontend Standards](#5-frontend-standards)
6. [Database Standards](#6-database-standards)
7. [Testing Standards](#7-testing-standards)
8. [Documentation Standards](#8-documentation-standards)
9. [Git Workflow](#9-git-workflow)
10. [Code Review Checklist](#10-code-review-checklist)

---

## 1. General Principles

### 1.1 Mandatory Requirements

✅ **ALL code, comments, and documentation MUST be in English**
- No Chinese characters in code, variable names, or comments
- All documentation in English
- Commit messages in English
- API responses in English

✅ **Documentation-First Development**
- Write/update design document BEFORE coding
- Update progress document AFTER each task
- Update test document with every feature
- Never skip documentation updates

✅ **Test-Driven Development (TDD)**
- Write tests before or alongside implementation
- Minimum 80% code coverage target
- All tests must pass before commit
- Regression tests for bug fixes

### 1.2 Code Quality Principles

1. **Readability over Cleverness**: Clear code > clever code
2. **DRY (Don't Repeat Yourself)**: Extract common logic
3. **SOLID Principles**: Especially Single Responsibility
4. **Fail Fast**: Validate inputs early, throw meaningful errors
5. **Type Safety**: Use TypeScript strictly, avoid `any`

---

## 2. Code Standards

### 2.1 TypeScript Standards

#### Naming Conventions

```typescript
// ✅ CORRECT

// Classes: PascalCase
class TradePoller {}
class PolymarketAPI {}

// Interfaces: PascalCase with 'I' prefix (optional) or plain PascalCase
interface Trade {}
interface IAlertConfig {}

// Functions/Methods: camelCase, verb-based
function fetchTrades() {}
async function sendAlert() {}

// Variables: camelCase, descriptive
const tradeSize = 1000;
let isRunning = false;
const marketData: Market[] = [];

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_POLL_INTERVAL = 5000;
const API_BASE_URL = 'https://api.example.com';

// Enums: PascalCase for enum, UPPER_CASE for values
enum AlertType {
  LARGE_TRADE = 'LARGE_TRADE',
  WHALE_ACTIVITY = 'WHALE_ACTIVITY'
}

// Private members: prefix with underscore (optional)
class Example {
  private _internalState: string;
  private seenIds: Set<string>; // or without underscore
}

// ❌ INCORRECT
class trade_poller {}           // Wrong case
function FetchTrades() {}       // Wrong case
const TradeSize = 1000;         // Wrong case for variable
const max_retries = 3;          // Wrong case for constant
```

#### Type Annotations

```typescript
// ✅ CORRECT: Always annotate function parameters and return types
function calculateTotal(trades: Trade[]): number {
  return trades.reduce((sum, trade) => sum + trade.size, 0);
}

async function fetchData(url: string, timeout: number): Promise<Trade[]> {
  // implementation
}

// ✅ CORRECT: Annotate complex variables
const config: AppConfig = loadConfig();
const tradeMap: Map<string, Trade> = new Map();

// ✅ ACCEPTABLE: Simple initializations can omit type
const count = 0;  // clearly number
const name = "Alice";  // clearly string

// ❌ INCORRECT: Using 'any'
function processData(data: any): any {  // Never do this!
  return data;
}

// ✅ CORRECT: Use unknown or proper type
function processData(data: unknown): Trade {
  if (isValidTrade(data)) {
    return data as Trade;
  }
  throw new Error('Invalid trade data');
}
```

#### Error Handling

```typescript
// ✅ CORRECT: Specific error types
class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ CORRECT: Try-catch with specific handling
async function fetchTrades(): Promise<Trade[]> {
  try {
    const response = await api.get('/trades');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`API error: ${error.response?.status}`, error.message);
      throw new NetworkError('Failed to fetch trades', error.response?.status);
    }
    throw error;
  }
}

// ❌ INCORRECT: Silent failure
async function fetchTrades(): Promise<Trade[]> {
  try {
    const response = await api.get('/trades');
    return response.data;
  } catch (error) {
    return []; // Never silently fail!
  }
}
```

### 2.2 File Organization

```
src/
├── index.ts                 # Entry point only
├── config.ts                # Configuration loader
├── api/                     # External API clients
│   ├── polymarket.ts        # One file per API
│   ├── gamma.ts
│   └── polygon.ts
├── core/                    # Business logic
│   ├── poller.ts            # One class per file
│   ├── analyzer.ts
│   ├── tracker.ts
│   └── alerter.ts
├── db/                      # Database layer
│   ├── client.ts            # DB connection
│   ├── schema.ts            # Table definitions
│   └── queries.ts           # Query builders
├── utils/                   # Pure utility functions
│   ├── logger.ts
│   ├── format.ts
│   └── sleep.ts
└── types/                   # Type definitions
    └── index.ts             # All interfaces/types
```

**File Naming Rules:**
- `camelCase.ts` for single-purpose files
- `PascalCase.ts` for class files (optional)
- `index.ts` for barrel exports
- One primary export per file

### 2.3 Import Standards

```typescript
// ✅ CORRECT: Import order

// 1. Node built-ins
import fs from 'fs';
import path from 'path';

// 2. External dependencies
import axios from 'axios';
import { Telegraf } from 'telegraf';

// 3. Internal - types
import { Trade, Market, AppConfig } from './types';

// 4. Internal - modules
import { logger } from './utils/logger';
import { PolymarketAPI } from './api/polymarket';

// 5. Internal - relative
import { config } from '../config';

// ❌ INCORRECT: Mixed order
import { logger } from './utils/logger';
import axios from 'axios';
import { Trade } from './types';
import fs from 'fs';
```

### 2.4 Comments & Documentation

```typescript
// ✅ CORRECT: JSDoc for public APIs
/**
 * Fetches recent trades from the Polymarket CLOB API
 *
 * @param marketId - Optional market ID to filter trades
 * @param limit - Maximum number of trades to return (default: 100)
 * @returns Array of Trade objects
 * @throws {NetworkError} If API request fails
 *
 * @example
 * ```typescript
 * const trades = await api.fetchTrades('market-123', 50);
 * console.log(`Fetched ${trades.length} trades`);
 * ```
 */
async fetchTrades(marketId?: string, limit: number = 100): Promise<Trade[]> {
  // Implementation
}

// ✅ CORRECT: Inline comments for complex logic
// Calculate weighted average price across all trades
// Formula: Σ(price * size) / Σ(size)
const avgPrice = trades.reduce((sum, t) => sum + t.price * t.size, 0) /
                 trades.reduce((sum, t) => sum + t.size, 0);

// ❌ INCORRECT: Obvious comments
const count = 0; // initialize count to zero

// ❌ INCORRECT: Commented-out code (use git history instead)
// const oldMethod = () => {
//   // old implementation
// }
```

---

## 3. Module Design Standards

### 3.1 Module Structure Template

Every module must follow this structure:

```typescript
/**
 * Module: [MODULE_NAME]
 * Purpose: [DESCRIPTION]
 * Dependencies: [LIST]
 * Author: [NAME]
 * Created: [DATE]
 */

// Imports (ordered as per 2.3)
import ...

// Constants
const MAX_RETRIES = 3;

// Types (if module-specific)
interface ModuleConfig {
  // ...
}

// Main class/function
export class ModuleName {
  // Private properties
  private config: ModuleConfig;

  // Constructor
  constructor(config: ModuleConfig) {
    // Validate inputs
    this.validateConfig(config);
    this.config = config;
  }

  // Public methods
  public async mainMethod(): Promise<void> {
    // Implementation
  }

  // Private methods
  private validateConfig(config: ModuleConfig): void {
    // Validation logic
  }
}

// Helper functions (if any)
function helperFunction(): void {
  // Implementation
}
```

### 3.2 Module Requirements Checklist

For each new module, document:

- [ ] **Purpose**: What problem does this module solve?
- [ ] **Dependencies**: What does it depend on?
- [ ] **Inputs**: What parameters does it accept?
- [ ] **Outputs**: What does it return?
- [ ] **Side Effects**: What external state does it modify?
- [ ] **Error Cases**: What errors can it throw?
- [ ] **Flow Diagram**: Visual representation of logic
- [ ] **Example Usage**: Code snippet showing usage

### 3.3 Module Design Example: Analyzer

**Purpose:** Analyze trades and determine alert severity

**Dependencies:**
- Types: `Trade`, `AppConfig`
- Utils: `logger`

**Inputs:**
- `trade: Trade` - Trade to analyze
- `config: AppConfig` - Alert thresholds

**Outputs:**
- `severity: 'LOW' | 'MEDIUM' | 'HIGH' | null` - Alert level or null if no alert

**Flow Diagram:**

```
                 ┌─────────────┐
                 │   Trade     │
                 └──────┬──────┘
                        │
                        ▼
          ┌─────────────────────────┐
          │ Check Watched Wallets   │
          └────┬────────────────┬───┘
               │                │
          YES  │                │ NO
               ▼                ▼
        ┌──────────┐    ┌──────────────┐
        │  HIGH    │    │ Check Size   │
        │  Alert   │    │ >= $50k?     │
        └──────────┘    └──┬───────┬───┘
                           │       │
                      YES  │       │ NO
                           ▼       ▼
                    ┌──────────┐  ┌──────────┐
                    │  HIGH    │  │  Size    │
                    │  Alert   │  │ >= $10k? │
                    └──────────┘  └──┬───┬───┘
                                     │   │
                                YES  │   │ NO
                                     ▼   ▼
                              ┌──────────┐ ┌──────────┐
                              │  MEDIUM  │ │ Size >=  │
                              │  Alert   │ │ $2.5k?   │
                              └──────────┘ └──┬───┬───┘
                                              │   │
                                         YES  │   │ NO
                                              ▼   ▼
                                       ┌──────────┐ ┌──────┐
                                       │   LOW    │ │ NULL │
                                       │  Alert   │ │      │
                                       └──────────┘ └──────┘
```

**Example Usage:**

```typescript
const analyzer = new TradeAnalyzer(config);
const severity = analyzer.analyze(trade);

if (severity) {
  await alerter.send(trade, severity);
}
```

---

## 4. API Design Standards

### 4.1 REST API Conventions (Future Phase 4)

**Endpoint Naming:**
```
GET    /api/v1/trades           # List trades
GET    /api/v1/trades/:id       # Get single trade
POST   /api/v1/trades           # Create trade (admin)
PUT    /api/v1/trades/:id       # Update trade (admin)
DELETE /api/v1/trades/:id       # Delete trade (admin)

GET    /api/v1/markets          # List markets
GET    /api/v1/markets/:id      # Get single market

GET    /api/v1/wallets/:address # Get wallet info
POST   /api/v1/wallets/watch    # Add to watch list
```

**Response Format:**

```typescript
// Success Response
{
  "success": true,
  "data": {
    // Actual data
  },
  "meta": {
    "timestamp": "2026-01-06T12:00:00Z",
    "version": "1.0"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid trade ID",
    "details": {
      "field": "id",
      "value": "invalid"
    }
  },
  "meta": {
    "timestamp": "2026-01-06T12:00:00Z",
    "version": "1.0"
  }
}
```

### 4.2 API Documentation (Swagger/OpenAPI)

**Required for Each Endpoint:**

```yaml
/api/v1/trades:
  get:
    summary: Fetch recent trades
    description: |
      Returns a list of recent trades from the database.
      Supports filtering by market, wallet, and time range.

    parameters:
      - name: market
        in: query
        description: Filter by market ID
        required: false
        schema:
          type: string
          example: "market-123"

      - name: limit
        in: query
        description: Maximum number of results
        required: false
        schema:
          type: integer
          minimum: 1
          maximum: 1000
          default: 100

      - name: since
        in: query
        description: Return trades after this timestamp
        required: false
        schema:
          type: string
          format: date-time
          example: "2026-01-06T00:00:00Z"

    responses:
      200:
        description: Successful response
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/Trade'

      400:
        description: Bad request
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

      500:
        description: Server error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

components:
  schemas:
    Trade:
      type: object
      required:
        - id
        - marketId
        - side
        - price
        - size
      properties:
        id:
          type: string
          description: Unique trade identifier
        marketId:
          type: string
          description: Market identifier
        side:
          type: string
          enum: [BUY, SELL]
        outcome:
          type: string
          enum: [YES, NO]
        price:
          type: number
          minimum: 0
          maximum: 1
        size:
          type: number
          minimum: 0
        maker:
          type: string
          pattern: '^0x[a-fA-F0-9]{40}$'
        taker:
          type: string
          pattern: '^0x[a-fA-F0-9]{40}$'
        timestamp:
          type: string
          format: date-time
```

### 4.3 Internal API Client Standards

**Every API client must implement:**

```typescript
interface APIClient {
  // Base configuration
  readonly baseURL: string;
  readonly timeout: number;

  // Request methods
  get<T>(path: string, params?: Record<string, any>): Promise<T>;
  post<T>(path: string, data?: any): Promise<T>;

  // Error handling
  handleError(error: unknown): never;

  // Retry logic
  retry<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T>;
}
```

**Example Implementation:**

```typescript
export class PolymarketAPI implements APIClient {
  readonly baseURL: string;
  readonly timeout: number = 10000;

  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.retry(async () => {
      const response = await this.client.get<T>(path, { params });
      return response.data;
    }, 3);
  }

  async retry<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
    // Implementation from utils/sleep.ts
  }

  handleError(error: unknown): never {
    // Standardized error handling
  }
}
```

---

## 5. Frontend Standards

### 5.1 React Component Standards (Future Phase 4)

**Component Structure:**

```typescript
// src/components/TradeList/TradeList.tsx

import React, { useState, useEffect } from 'react';
import { Trade } from '../../types';
import { TradeItem } from './TradeItem';
import styles from './TradeList.module.css';

/**
 * TradeList Component
 *
 * Displays a list of recent trades with filtering capabilities.
 *
 * @param trades - Array of trades to display
 * @param onTradeClick - Callback when trade is clicked
 */
interface TradeListProps {
  trades: Trade[];
  onTradeClick?: (trade: Trade) => void;
}

export const TradeList: React.FC<TradeListProps> = ({
  trades,
  onTradeClick
}) => {
  const [filter, setFilter] = useState<string>('');

  const filteredTrades = trades.filter(trade =>
    trade.marketQuestion.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Filter trades..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className={styles.filterInput}
      />

      <div className={styles.tradeList}>
        {filteredTrades.map(trade => (
          <TradeItem
            key={trade.id}
            trade={trade}
            onClick={() => onTradeClick?.(trade)}
          />
        ))}
      </div>
    </div>
  );
};
```

**Component Requirements:**
- [ ] TypeScript with proper prop types
- [ ] JSDoc comment explaining purpose
- [ ] CSS Modules for styling (not inline styles)
- [ ] Accessible (proper ARIA labels)
- [ ] Responsive design
- [ ] Loading/error states
- [ ] Unit tests

**File Structure:**
```
src/components/TradeList/
├── TradeList.tsx          # Main component
├── TradeList.test.tsx     # Unit tests
├── TradeList.module.css   # Styles
├── TradeItem.tsx          # Sub-component
└── index.ts               # Barrel export
```

### 5.2 State Management

**Use Context for global state:**

```typescript
// src/contexts/AppContext.tsx

import React, { createContext, useContext, useReducer } from 'react';

interface AppState {
  trades: Trade[];
  markets: Market[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_TRADES'; payload: Trade[] }
  | { type: 'SET_MARKETS'; payload: Market[] }
  | { type: 'SET_LOADING'; payload: boolean };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TRADES':
      return { ...state, trades: action.payload };
    case 'SET_MARKETS':
      return { ...state, markets: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    trades: [],
    markets: [],
    isLoading: false,
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

---

## 6. Database Standards

### 6.1 Schema Design (Phase 2)

**Table Naming:**
- Lowercase with underscores: `trades`, `watched_wallets`, `alert_history`
- Plural for collections: `trades` not `trade`

**Column Naming:**
- Lowercase with underscores: `market_id`, `created_at`
- Foreign keys: `{table}_id` (e.g., `market_id`)
- Timestamps: `created_at`, `updated_at`
- Booleans: `is_active`, `has_alert`

**Example Schema:**

```sql
-- trades table
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  market_slug TEXT,
  market_question TEXT,

  side TEXT NOT NULL CHECK(side IN ('BUY', 'SELL')),
  outcome TEXT NOT NULL CHECK(outcome IN ('YES', 'NO')),
  price REAL NOT NULL CHECK(price >= 0 AND price <= 1),
  size REAL NOT NULL CHECK(size > 0),

  maker TEXT NOT NULL,
  taker TEXT NOT NULL,

  timestamp INTEGER NOT NULL,  -- Unix timestamp
  tx_hash TEXT NOT NULL,
  block_number INTEGER,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  UNIQUE(tx_hash, maker, taker)
);

CREATE INDEX idx_trades_market ON trades(market_id);
CREATE INDEX idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX idx_trades_maker ON trades(maker);
CREATE INDEX idx_trades_taker ON trades(taker);
CREATE INDEX idx_trades_size ON trades(size DESC);

-- watched_wallets table
CREATE TABLE watched_wallets (
  address TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  notes TEXT,
  added_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  total_trades INTEGER DEFAULT 0,
  total_volume REAL DEFAULT 0,
  win_rate REAL DEFAULT 0,

  is_active BOOLEAN DEFAULT 1
);

-- alerts table
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('LARGE_TRADE', 'WHALE_ACTIVITY', 'VOLUME_SPIKE', 'PRICE_MOVE')),
  severity TEXT NOT NULL CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH')),

  market_id TEXT NOT NULL,
  trade_id TEXT,
  wallet_address TEXT,

  message TEXT NOT NULL,
  data TEXT,  -- JSON string

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  sent_at INTEGER,
  acknowledged BOOLEAN DEFAULT 0,

  FOREIGN KEY (trade_id) REFERENCES trades(id)
);

CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_type ON alerts(type);
```

### 6.2 Query Standards

**Use parameterized queries:**

```typescript
// ✅ CORRECT: Parameterized query
const trades = db.prepare(`
  SELECT * FROM trades
  WHERE market_id = ?
  AND size >= ?
  ORDER BY timestamp DESC
  LIMIT ?
`).all(marketId, minSize, limit);

// ❌ INCORRECT: String concatenation (SQL injection risk!)
const trades = db.prepare(`
  SELECT * FROM trades
  WHERE market_id = '${marketId}'
`).all();
```

**Query organization:**

```typescript
// src/db/queries.ts

export class TradeQueries {
  constructor(private db: Database) {}

  /**
   * Insert a new trade
   */
  insert(trade: Trade): void {
    const stmt = this.db.prepare(`
      INSERT INTO trades (
        id, market_id, side, outcome, price, size,
        maker, taker, timestamp, tx_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      trade.id,
      trade.marketId,
      trade.side,
      trade.outcome,
      trade.price,
      trade.size,
      trade.maker,
      trade.taker,
      trade.timestamp.getTime(),
      trade.txHash
    );
  }

  /**
   * Find trades by market ID
   */
  findByMarket(marketId: string, limit: number = 100): Trade[] {
    const stmt = this.db.prepare(`
      SELECT * FROM trades
      WHERE market_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(marketId, limit);
    return rows.map(this.rowToTrade);
  }

  private rowToTrade(row: any): Trade {
    return {
      id: row.id,
      marketId: row.market_id,
      marketSlug: row.market_slug,
      marketQuestion: row.market_question,
      side: row.side as 'BUY' | 'SELL',
      outcome: row.outcome as 'YES' | 'NO',
      price: row.price,
      size: row.size,
      maker: row.maker,
      taker: row.taker,
      timestamp: new Date(row.timestamp),
      txHash: row.tx_hash,
      blockNumber: row.block_number,
    };
  }
}
```

---

## 7. Testing Standards

### 7.1 Test File Organization

```
src/
├── api/
│   ├── polymarket.ts
│   └── polymarket.test.ts      # Tests alongside source
├── core/
│   ├── poller.ts
│   ├── poller.test.ts
│   ├── alerter.ts
│   └── alerter.test.ts
└── utils/
    ├── format.ts
    └── format.test.ts
```

### 7.2 Test Structure

```typescript
// src/utils/format.test.ts

import { describe, it, expect } from '@jest/globals';
import { formatUSD, formatProbability, formatAddress } from './format';

describe('format utilities', () => {
  describe('formatUSD', () => {
    it('should format positive numbers with 2 decimals', () => {
      expect(formatUSD(1234.56)).toBe('$1,234.56');
      expect(formatUSD(1000)).toBe('$1,000.00');
    });

    it('should format large numbers with commas', () => {
      expect(formatUSD(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle zero', () => {
      expect(formatUSD(0)).toBe('$0.00');
    });

    it('should handle small decimals', () => {
      expect(formatUSD(0.01)).toBe('$0.01');
    });
  });

  describe('formatProbability', () => {
    it('should convert 0-1 to percentage', () => {
      expect(formatProbability(0.5)).toBe('50.0%');
      expect(formatProbability(0.654)).toBe('65.4%');
    });

    it('should handle edge cases', () => {
      expect(formatProbability(0)).toBe('0.0%');
      expect(formatProbability(1)).toBe('100.0%');
    });
  });

  describe('formatAddress', () => {
    it('should shorten valid Ethereum addresses', () => {
      const addr = '0x1234567890abcdef1234567890abcdef12345678';
      expect(formatAddress(addr)).toBe('0x1234...5678');
    });

    it('should return short addresses unchanged', () => {
      expect(formatAddress('0x123')).toBe('0x123');
    });
  });
});
```

### 7.3 Testing Checklist

For each function/method:

- [ ] Happy path test (normal input)
- [ ] Edge cases (empty, null, undefined, zero)
- [ ] Error cases (invalid input, exceptions)
- [ ] Boundary values (min, max)
- [ ] Integration test (if applicable)

---

## 8. Documentation Standards

### 8.1 Document Update Rule

**MANDATORY:** Update documents after completing each:
- Module
- Feature
- Phase
- Bug fix that changes behavior
- API change

### 8.2 Document Checklist

After completing ANY task, update:

- [ ] **Technical Design Document** - If architecture/data model changed
- [ ] **Development Standards** - If new patterns/conventions introduced
- [ ] **Roadmap & Progress** - Mark task complete, update progress %
- [ ] **Testing Document** - Add new test cases
- [ ] **Code Comments** - Update JSDoc if function signature changed
- [ ] **README** - If user-facing features changed

### 8.3 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Build process, dependencies

**Examples:**

```
feat(poller): add support for filtering by market

Implemented market filtering in TradePoller to allow
monitoring specific markets instead of all trades.

Updated config to accept WATCH_MARKETS env variable.

Closes #12
```

```
fix(alerter): prevent duplicate telegram messages

Fixed race condition where rapid trades could cause
duplicate alerts to be sent to Telegram.

Added message deduplication using Set with 1-minute TTL.
```

```
docs(api): update swagger spec for /trades endpoint

Added examples and clarified parameter descriptions.
```

---

## 9. Git Workflow

### 9.1 Branch Strategy

```
main (production-ready)
  ↓
develop (integration branch)
  ↓
feature/trade-analysis    # Feature branches
feature/whale-tracking
fix/alert-duplication     # Bug fix branches
docs/api-swagger          # Documentation branches
```

### 9.2 Workflow Steps

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/market-filtering

# 2. Make changes, commit frequently
git add .
git commit -m "feat(poller): implement market filtering"

# 3. Update documentation before final commit
# Edit docs/03_ROADMAP_PROGRESS.md
git add docs/
git commit -m "docs: update progress for market filtering"

# 4. Push and create PR
git push origin feature/market-filtering

# 5. After PR approval, merge to develop
# 6. Periodically merge develop → main for releases
```

### 9.3 Pre-Commit Checklist

Before every commit:

- [ ] Code compiles without errors (`npm run typecheck`)
- [ ] All tests pass (`npm test`)
- [ ] New code has tests
- [ ] Documentation updated
- [ ] No console.log() statements (use logger)
- [ ] No commented-out code
- [ ] Commit message follows format

---

## 10. Code Review Checklist

### 10.1 Reviewer Checklist

**Functionality:**
- [ ] Does it solve the stated problem?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?

**Code Quality:**
- [ ] Follows naming conventions?
- [ ] Uses TypeScript properly (no `any`)?
- [ ] DRY - no code duplication?
- [ ] Functions are single-purpose?
- [ ] Comments explain "why" not "what"?

**Testing:**
- [ ] Has unit tests?
- [ ] Tests cover edge cases?
- [ ] Integration tests if needed?

**Documentation:**
- [ ] JSDoc for public APIs?
- [ ] Design docs updated?
- [ ] Progress tracker updated?
- [ ] Test docs updated?

**Performance:**
- [ ] No obvious performance issues?
- [ ] Async operations handled properly?
- [ ] Memory leaks prevented?

**Security:**
- [ ] No hardcoded secrets?
- [ ] Input validation present?
- [ ] SQL injection prevented?
- [ ] XSS prevented (frontend)?

---

## Document Maintenance

**This document must be updated when:**
- New coding patterns are introduced
- API standards change
- Testing practices evolve
- New tools are added to stack

**Update Checklist:**
- [ ] Version number incremented
- [ ] Last Updated date changed
- [ ] New sections added to TOC
- [ ] Examples updated
- [ ] Team notified of changes

**Last Updated:** 2026-01-06
**Next Review:** After Phase 2 completion

---

*End of Development Standards Document*
