import { PolymarketAPI } from '../api/polymarket';
import { Alerter } from './alerter';
import { Trade, AppConfig } from '../types';
import { logger } from '../utils/logger';
import { sleep } from '../utils/sleep';

export class TradePoller {
  private api: PolymarketAPI;
  private alerter: Alerter;
  private config: AppConfig;
  private seenTradeIds: Set<string>;
  private isRunning: boolean = false;
  private watchedWallets: Map<string, string>; // address -> label

  constructor(api: PolymarketAPI, alerter: Alerter, config: AppConfig) {
    this.api = api;
    this.alerter = alerter;
    this.config = config;
    this.seenTradeIds = new Set();
    this.watchedWallets = new Map();

    // Initialize watched wallets
    config.watchWallets.forEach((address, index) => {
      this.watchedWallets.set(address.toLowerCase(), `Whale #${index + 1}`);
    });
  }

  /**
   * Start the polling loop
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Poller is already running');
      return;
    }

    this.isRunning = true;
    logger.success('🚀 Trade poller started');
    logger.info(`Polling interval: ${this.config.pollIntervalMs}ms`);
    logger.info(`Min trade size: $${this.config.minTradeSize}`);
    logger.info(`Watched wallets: ${this.watchedWallets.size}`);

    await this.alerter.sendCustomAlert('🚀 Polymarket Analyzer started monitoring trades');

    while (this.isRunning) {
      try {
        await this.poll();
      } catch (error) {
        logger.error('Error in polling loop:', error);
      }

      await sleep(this.config.pollIntervalMs);
    }
  }

  /**
   * Stop the polling loop
   */
  stop() {
    this.isRunning = false;
    logger.info('Trade poller stopped');
  }

  /**
   * Single poll iteration
   */
  private async poll() {
    let trades: Trade[] = [];

    // Fetch trades for specific markets if configured
    if (this.config.watchMarkets.length > 0) {
      for (const marketId of this.config.watchMarkets) {
        const marketTrades = await this.api.fetchTrades(marketId, 100);
        trades.push(...marketTrades);
      }
    } else {
      // Fetch all recent trades
      trades = await this.api.fetchTrades(undefined, 100);
    }

    // Enrich trades with market information
    trades = await this.api.enrichTradesWithMarkets(trades);

    // Process new trades
    let newTradesCount = 0;
    for (const trade of trades) {
      if (this.seenTradeIds.has(trade.id)) {
        continue;
      }

      this.seenTradeIds.add(trade.id);
      newTradesCount++;

      // Analyze and potentially alert
      await this.analyzeTrade(trade);
    }

    if (newTradesCount > 0) {
      logger.debug(`Processed ${newTradesCount} new trades`);
    }
  }

  /**
   * Analyze a trade and send alerts if needed
   */
  private async analyzeTrade(trade: Trade) {
    let alerted = false;

    // Check for whale wallet activity
    const makerLabel = this.watchedWallets.get(trade.maker.toLowerCase());
    const takerLabel = this.watchedWallets.get(trade.taker.toLowerCase());

    if (makerLabel || takerLabel) {
      const label = makerLabel || takerLabel || 'Unknown';
      await this.alerter.alertWhaleActivity(trade, label);
      alerted = true;
      return; // Don't send duplicate alerts
    }

    // Check for whale-sized trade
    if (trade.size >= this.config.alerts.whaleTrade) {
      await this.alerter.alertLargeTrade(trade, 'HIGH');
      alerted = true;
      return;
    }

    // Check for large trade
    if (trade.size >= this.config.alerts.largeTrade) {
      await this.alerter.alertLargeTrade(trade, 'MEDIUM');
      alerted = true;
      return;
    }

    // Check for trades above minimum threshold
    if (trade.size >= this.config.minTradeSize) {
      await this.alerter.alertLargeTrade(trade, 'LOW');
      alerted = true;
    }
  }

  /**
   * Add a wallet to watch list
   */
  addWatchedWallet(address: string, label: string) {
    this.watchedWallets.set(address.toLowerCase(), label);
    logger.info(`Added watched wallet: ${label} (${address})`);
  }

  /**
   * Remove a wallet from watch list
   */
  removeWatchedWallet(address: string) {
    const label = this.watchedWallets.get(address.toLowerCase());
    this.watchedWallets.delete(address.toLowerCase());
    logger.info(`Removed watched wallet: ${label || address}`);
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      seenTrades: this.seenTradeIds.size,
      watchedWallets: this.watchedWallets.size,
      pollInterval: this.config.pollIntervalMs,
    };
  }
}
