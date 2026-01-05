#!/usr/bin/env node

import { config } from './config';
import { PolymarketAPI } from './api/polymarket';
import { Alerter } from './core/alerter';
import { TradePoller } from './core/poller';
import { logger } from './utils/logger';

/**
 * Main entry point for Polymarket Analyzer
 */
async function main() {
  logger.info('='.repeat(60));
  logger.info('🔍 Polymarket Trade Analyzer');
  logger.info('='.repeat(60));
  logger.info('');

  // Display configuration
  logger.info('Configuration:');
  logger.info(`  - Polymarket API: ${config.polymarketApiUrl}`);
  logger.info(`  - Gamma API: ${config.gammaApiUrl}`);
  logger.info(`  - Poll Interval: ${config.pollIntervalMs}ms`);
  logger.info(`  - Min Trade Size: $${config.minTradeSize}`);
  logger.info(`  - Large Trade Alert: $${config.alerts.largeTrade}`);
  logger.info(`  - Whale Trade Alert: $${config.alerts.whaleTrade}`);
  logger.info(`  - Watched Markets: ${config.watchMarkets.length || 'All'}`);
  logger.info(`  - Watched Wallets: ${config.watchWallets.length}`);
  logger.info(`  - Telegram: ${config.telegram ? '✓ Enabled' : '✗ Disabled'}`);
  logger.info(`  - Discord: ${config.discord ? '✓ Enabled' : '✗ Disabled'}`);
  logger.info('');

  // Validate configuration
  if (!config.polymarketApiUrl || !config.gammaApiUrl) {
    logger.error('Missing required API URLs in configuration');
    process.exit(1);
  }

  // Initialize components
  logger.info('Initializing components...');
  const api = new PolymarketAPI(config.polymarketApiUrl, config.gammaApiUrl);
  const alerter = new Alerter(config);
  const poller = new TradePoller(api, alerter, config);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('');
    logger.info('Received SIGINT, shutting down gracefully...');
    poller.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('');
    logger.info('Received SIGTERM, shutting down gracefully...');
    poller.stop();
    process.exit(0);
  });

  // Start monitoring
  logger.info('');
  logger.info('Starting trade monitoring...');
  logger.info('Press Ctrl+C to stop');
  logger.info('');

  await poller.start();
}

// Run the application
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
