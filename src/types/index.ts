/**
 * Core Type Definitions for Polymarket Analyzer
 */

export interface Trade {
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
  blockNumber?: number;
}

export interface Market {
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

export interface WatchedWallet {
  address: string;
  label: string;              // e.g., "Whale #1", "Insider suspect"
  notes: string;
  addedAt: Date;
  totalTrades: number;
  totalVolume: number;
  winRate: number;
}

export interface Alert {
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

// Configuration Interfaces
export interface TradeMonitorConfig {
  pollIntervalMs: number;      // Default: 5000 (5s)
  minTradeSize: number;        // Default: 2500 (USD)
  markets: string[];           // Market IDs to watch (empty = all)
}

export interface WhaleConfig {
  watchedAddresses: string[];  // Specific wallets to track
  minTradeSize: number;        // Threshold for "whale" trade
  alertOnAny: boolean;         // Alert on any trade from watched addresses
}

export interface MarketAnalyzerConfig {
  volumeThreshold: number;     // Alert if volume spikes X%
  priceChangeThreshold: number; // Alert if price moves X%
  timeWindowMinutes: number;   // Analysis window
}

export interface AlertConfig {
  telegram?: {
    botToken: string;
    chatId: string;
  };
  discord?: {
    webhookUrl: string;
  };
  console: boolean;            // Always log to console
}

// API Response Types
export interface MarketResponse {
  id: string;
  question: string;
  slug: string;
  description?: string;
  outcomePrices: string;  // JSON string: "[0.65, 0.35]"
  outcomes: string;       // JSON string: ["Yes", "No"]
  volume: string;
  liquidity: string;
  endDate: string;
  createdAt: string;
  active: boolean;
  closed: boolean;
  resolved?: boolean;
}

export interface TradeResponse {
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
  outcome: string;
  status?: string;
}

export interface AppConfig {
  // API URLs
  polymarketApiUrl: string;
  gammaApiUrl: string;
  polygonRpcUrl: string;

  // Monitoring
  pollIntervalMs: number;
  minTradeSize: number;

  // Markets & Wallets
  watchMarkets: string[];
  watchWallets: string[];

  // Alert thresholds
  alerts: {
    largeTrade: number;        // $10k+
    whaleTrade: number;        // $50k+
    volumeSpike: number;       // 2x normal volume
    priceMove: number;         // 10% price change
  };

  // Notification config
  telegram?: {
    botToken: string;
    chatId: string;
  };
  discord?: {
    webhookUrl: string;
  };

  // Database
  databasePath: string;
}
