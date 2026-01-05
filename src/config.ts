import dotenv from 'dotenv';
import { AppConfig } from './types';

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  // API URLs
  polymarketApiUrl: process.env.POLYMARKET_API_URL || 'https://clob.polymarket.com',
  gammaApiUrl: process.env.GAMMA_API_URL || 'https://gamma-api.polymarket.com',
  polygonRpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',

  // Monitoring
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '5000'),
  minTradeSize: parseInt(process.env.MIN_TRADE_SIZE_USD || '2500'),

  // Markets to watch (empty = all)
  watchMarkets: process.env.WATCH_MARKETS
    ? process.env.WATCH_MARKETS.split(',').map(m => m.trim())
    : [],

  // Wallets to track
  watchWallets: process.env.WATCH_WALLETS
    ? process.env.WATCH_WALLETS.split(',').map(w => w.trim())
    : [],

  // Alert thresholds
  alerts: {
    largeTrade: parseInt(process.env.ALERT_LARGE_TRADE || '10000'),        // $10k+
    whaleTrade: parseInt(process.env.ALERT_WHALE_TRADE || '50000'),        // $50k+
    volumeSpike: parseFloat(process.env.ALERT_VOLUME_SPIKE || '2.0'),      // 2x normal volume
    priceMove: parseFloat(process.env.ALERT_PRICE_MOVE || '0.10'),         // 10% price change
  },

  // Telegram configuration
  telegram: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
    ? {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
      }
    : undefined,

  // Discord configuration
  discord: process.env.DISCORD_WEBHOOK_URL
    ? {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      }
    : undefined,

  // Database
  databasePath: process.env.DATABASE_PATH || './data/trades.db',
};
