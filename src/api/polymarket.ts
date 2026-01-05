import axios, { AxiosInstance } from 'axios';
import { Trade, Market, TradeResponse, MarketResponse } from '../types';
import { logger } from '../utils/logger';
import { retry } from '../utils/sleep';

export class PolymarketAPI {
  private clobClient: AxiosInstance;
  private gammaClient: AxiosInstance;

  constructor(clobBaseUrl: string, gammaBaseUrl: string) {
    this.clobClient = axios.create({
      baseURL: clobBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.gammaClient = axios.create({
      baseURL: gammaBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch recent trades from CLOB API
   */
  async fetchTrades(marketId?: string, limit: number = 100): Promise<Trade[]> {
    try {
      const params: any = { limit };
      if (marketId) {
        params.market = marketId;
      }

      const response = await retry(() =>
        this.clobClient.get<TradeResponse[]>('/trades', { params })
      );

      const trades = response.data.map(this.transformTrade);
      logger.debug(`Fetched ${trades.length} trades${marketId ? ` for market ${marketId}` : ''}`);
      return trades;
    } catch (error) {
      logger.error('Failed to fetch trades:', error);
      return [];
    }
  }

  /**
   * Fetch markets from Gamma API
   */
  async fetchMarkets(closed: boolean = false, limit: number = 100): Promise<Market[]> {
    try {
      const response = await retry(() =>
        this.gammaClient.get<MarketResponse[]>('/markets', {
          params: { closed, limit },
        })
      );

      const markets = response.data.map(this.transformMarket);
      logger.debug(`Fetched ${markets.length} markets`);
      return markets;
    } catch (error) {
      logger.error('Failed to fetch markets:', error);
      return [];
    }
  }

  /**
   * Fetch a specific market by ID
   */
  async fetchMarket(marketId: string): Promise<Market | null> {
    try {
      const response = await retry(() =>
        this.gammaClient.get<MarketResponse>(`/markets/${marketId}`)
      );

      return this.transformMarket(response.data);
    } catch (error) {
      logger.error(`Failed to fetch market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Transform API trade response to internal Trade model
   */
  private transformTrade(raw: TradeResponse): Trade {
    // Determine outcome from asset_id or outcome field
    const outcome = this.parseOutcome(raw.outcome || raw.asset_id);

    return {
      id: raw.id,
      marketId: raw.market,
      marketSlug: '',  // Will be enriched later
      marketQuestion: '',  // Will be enriched later

      side: raw.side,
      outcome,
      price: parseFloat(raw.price),
      size: parseFloat(raw.size),

      maker: raw.maker_address,
      taker: raw.taker_address,

      timestamp: new Date(raw.timestamp),
      txHash: raw.transaction_hash,
    };
  }

  /**
   * Transform API market response to internal Market model
   */
  private transformMarket(raw: MarketResponse): Market {
    let outcomes: string[] = [];
    let outcomePrices: number[] = [];

    try {
      outcomes = typeof raw.outcomes === 'string' ? JSON.parse(raw.outcomes) : raw.outcomes;
      outcomePrices = typeof raw.outcomePrices === 'string'
        ? JSON.parse(raw.outcomePrices).map((p: string) => parseFloat(p))
        : raw.outcomePrices;
    } catch (e) {
      logger.warn(`Failed to parse market data for ${raw.id}`);
      outcomes = ['Yes', 'No'];
      outcomePrices = [0.5, 0.5];
    }

    return {
      id: raw.id,
      slug: raw.slug,
      question: raw.question,
      description: raw.description || '',

      outcomes,
      outcomePrices,

      volume: parseFloat(raw.volume || '0'),
      liquidity: parseFloat(raw.liquidity || '0'),

      endDate: new Date(raw.endDate),
      createdAt: new Date(raw.createdAt),

      active: raw.active,
      closed: raw.closed,
      resolved: raw.resolved || false,
    };
  }

  /**
   * Parse outcome from asset_id or outcome string
   */
  private parseOutcome(outcomeStr: string): 'YES' | 'NO' {
    const normalized = outcomeStr.toLowerCase();
    if (normalized.includes('yes') || normalized === '1') {
      return 'YES';
    }
    return 'NO';
  }

  /**
   * Enrich trades with market information
   */
  async enrichTradesWithMarkets(trades: Trade[]): Promise<Trade[]> {
    const marketIds = [...new Set(trades.map(t => t.marketId))];
    const markets = new Map<string, Market>();

    // Fetch all unique markets
    await Promise.all(
      marketIds.map(async (id) => {
        const market = await this.fetchMarket(id);
        if (market) {
          markets.set(id, market);
        }
      })
    );

    // Enrich trades
    return trades.map(trade => {
      const market = markets.get(trade.marketId);
      if (market) {
        trade.marketSlug = market.slug;
        trade.marketQuestion = market.question;
      }
      return trade;
    });
  }
}
