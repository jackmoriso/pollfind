import axios from 'axios';
import { Telegraf } from 'telegraf';
import { Trade, Alert, AppConfig } from '../types';
import { logger } from '../utils/logger';
import { formatUSD, formatProbability, formatAddress, formatTimestamp } from '../utils/format';

export class Alerter {
  private telegram?: Telegraf;
  private discordWebhook?: string;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;

    // Initialize Telegram bot if configured
    if (config.telegram) {
      try {
        this.telegram = new Telegraf(config.telegram.botToken);
        logger.success('Telegram bot initialized');
      } catch (error) {
        logger.error('Failed to initialize Telegram bot:', error);
      }
    }

    // Store Discord webhook if configured
    if (config.discord) {
      this.discordWebhook = config.discord.webhookUrl;
      logger.success('Discord webhook configured');
    }
  }

  /**
   * Send alert for a large trade
   */
  async alertLargeTrade(trade: Trade, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM') {
    const message = this.formatTradeMessage(trade, severity);

    // Console (always)
    this.logToConsole(trade, severity);

    // Telegram
    if (this.telegram && this.config.telegram) {
      await this.sendToTelegram(message, this.config.telegram.chatId);
    }

    // Discord
    if (this.discordWebhook) {
      await this.sendToDiscord(message);
    }
  }

  /**
   * Send alert for whale activity
   */
  async alertWhaleActivity(trade: Trade, walletLabel: string) {
    const message = `🐋 **WHALE ALERT: ${walletLabel}**\n\n${this.formatTradeMessage(trade, 'HIGH')}`;

    this.logToConsole(trade, 'HIGH', `🐋 Whale: ${walletLabel}`);

    if (this.telegram && this.config.telegram) {
      await this.sendToTelegram(message, this.config.telegram.chatId);
    }

    if (this.discordWebhook) {
      await this.sendToDiscord(message);
    }
  }

  /**
   * Format trade information as a message
   */
  private formatTradeMessage(trade: Trade, severity: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    const emoji = this.getSeverityEmoji(severity);
    const sideEmoji = trade.side === 'BUY' ? '📈' : '📉';

    return `${emoji} **LARGE TRADE DETECTED**

📊 **Market:** ${trade.marketQuestion || 'Unknown'}
💰 **Size:** ${formatUSD(trade.size)}
${sideEmoji} **Side:** ${trade.side} ${trade.outcome} @ ${formatProbability(trade.price)}
👛 **Maker:** ${formatAddress(trade.maker)}
👛 **Taker:** ${formatAddress(trade.taker)}

⏰ **Time:** ${formatTimestamp(trade.timestamp)}
🔗 **TX:** https://polygonscan.com/tx/${trade.txHash}

#polymarket #whale #trading`;
  }

  /**
   * Log trade to console with formatting
   */
  private logToConsole(trade: Trade, severity: 'LOW' | 'MEDIUM' | 'HIGH', prefix?: string) {
    const emoji = this.getSeverityEmoji(severity);
    const message = `${emoji} ${prefix || 'Large trade'}: ${formatUSD(trade.size)} - ${trade.side} ${trade.outcome} @ ${formatProbability(trade.price)} on "${trade.marketQuestion || 'Unknown market'}" - Maker: ${formatAddress(trade.maker)}`;

    if (severity === 'HIGH') {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  }

  /**
   * Send message to Telegram
   */
  private async sendToTelegram(message: string, chatId: string) {
    if (!this.telegram) return;

    try {
      await this.telegram.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        link_preview_options: {
          is_disabled: true,
        },
      });
      logger.debug('Sent alert to Telegram');
    } catch (error) {
      logger.error('Failed to send Telegram message:', error);
    }
  }

  /**
   * Send message to Discord webhook
   */
  private async sendToDiscord(message: string) {
    if (!this.discordWebhook) return;

    try {
      await axios.post(this.discordWebhook, {
        content: message,
      });
      logger.debug('Sent alert to Discord');
    } catch (error) {
      logger.error('Failed to send Discord message:', error);
    }
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (severity) {
      case 'LOW':
        return '📢';
      case 'MEDIUM':
        return '🚨';
      case 'HIGH':
        return '🔥';
      default:
        return '📢';
    }
  }

  /**
   * Send a custom alert message
   */
  async sendCustomAlert(message: string) {
    logger.info(message);

    if (this.telegram && this.config.telegram) {
      await this.sendToTelegram(message, this.config.telegram.chatId);
    }

    if (this.discordWebhook) {
      await this.sendToDiscord(message);
    }
  }
}
