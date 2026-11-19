import {
  MarketStatus,
  MarketStatusSchema,
  Quote,
  QuoteSchema,
  PriceHistory,
  PriceHistorySchema,
  OrderRequest,
  OrderResponse,
  OrderResponseSchema,
  Portfolio,
  PortfolioSchema,
  CredScore,
  CredScoreSchema,
  SearchResult,
  SearchResultSchema,
  BenchmarkSeries,
  BenchmarkSeriesSchema,
  TradingAccount,
  TradingAccountSchema,
} from "./schemas";
import { MockTrackAService } from "./mock";
import { z } from "zod";

const mockService = new MockTrackAService();

export class TrackAClient {
  private baseUrl: string;
  private apiKey?: string;
  private isMock: boolean;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.TRACK_A_BASE_URL || "http://localhost:4000/api";
    this.apiKey = apiKey || process.env.TRACK_A_API_KEY;
    // Default to true unless explicitly set to 'false'
    this.isMock = process.env.USE_MOCK_TRACK_A !== "false";
  }

  private async fetchTrackA<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const error = new Error(`Track A error (${res.status}): ${errBody}`);
      (error as any).status = res.status;
      throw error;
    }

    return res.json();
  }

  async getMarketStatus(): Promise<MarketStatus> {
    if (this.isMock) return mockService.getMarketStatus();
    const data = await this.fetchTrackA("/market/status");
    return MarketStatusSchema.parse(data);
  }

  async getQuote(ticker: string): Promise<Quote> {
    if (this.isMock) return mockService.getQuote(ticker);
    const data = await this.fetchTrackA(`/market/quotes/${encodeURIComponent(ticker)}`);
    return QuoteSchema.parse(data);
  }

  async getQuotes(tickers: string[]): Promise<Quote[]> {
    if (this.isMock) return mockService.getQuotes(tickers);
    const data = await this.fetchTrackA(`/market/quotes?tickers=${tickers.map(encodeURIComponent).join(",")}`);
    return z.array(QuoteSchema).parse(data);
  }

  async getPriceHistory(
    ticker: string,
    interval: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" = "1D"
  ): Promise<PriceHistory> {
    if (this.isMock) return mockService.getPriceHistory(ticker, interval);
    const data = await this.fetchTrackA(`/market/history/${encodeURIComponent(ticker)}?interval=${interval}`);
    return PriceHistorySchema.parse(data);
  }

  async searchTickers(query: string): Promise<SearchResult[]> {
    if (this.isMock) return mockService.searchTickers(query);
    const data = await this.fetchTrackA(`/market/search?q=${encodeURIComponent(query)}`);
    return z.array(SearchResultSchema).parse(data);
  }

  async placeOrder(accountIdOrUserId: string, order: OrderRequest): Promise<OrderResponse> {
    if (this.isMock) return mockService.placeOrder(accountIdOrUserId, order);
    const data = await this.fetchTrackA(`/orders`, {
      method: "POST",
      body: JSON.stringify({ accountId: accountIdOrUserId, ...order }),
    });
    return OrderResponseSchema.parse(data);
  }

  async cancelOrder(accountIdOrUserId: string, orderId: string): Promise<OrderResponse> {
    if (this.isMock) return mockService.cancelOrder(accountIdOrUserId, orderId);
    const data = await this.fetchTrackA(`/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ accountId: accountIdOrUserId }),
    });
    return OrderResponseSchema.parse(data);
  }

  async getOpenOrders(accountIdOrUserId: string): Promise<OrderResponse[]> {
    if (this.isMock) return mockService.getOpenOrders(accountIdOrUserId);
    const data = await this.fetchTrackA(`/accounts/${accountIdOrUserId}/orders?status=pending`);
    return z.array(OrderResponseSchema).parse(data);
  }

  async getOrderHistory(accountIdOrUserId: string): Promise<OrderResponse[]> {
    if (this.isMock) return mockService.getOrderHistory(accountIdOrUserId);
    const data = await this.fetchTrackA(`/accounts/${accountIdOrUserId}/orders`);
    return z.array(OrderResponseSchema).parse(data);
  }

  async getPortfolio(accountIdOrUserId: string): Promise<Portfolio> {
    if (this.isMock) return mockService.getPortfolio(accountIdOrUserId);
    const data = await this.fetchTrackA(`/accounts/${accountIdOrUserId}/portfolio`);
    return PortfolioSchema.parse(data);
  }

  async getBuyingPower(accountIdOrUserId: string): Promise<{ buyingPower: number }> {
    if (this.isMock) return mockService.getBuyingPower(accountIdOrUserId);
    const data = await this.fetchTrackA(`/accounts/${accountIdOrUserId}/buying-power`);
    return z.object({ buyingPower: z.number() }).parse(data);
  }

  async ensureTradingAccount(userId: string, leagueId?: string): Promise<TradingAccount> {
    if (this.isMock) return mockService.ensureTradingAccount(userId, leagueId);
    const data = await this.fetchTrackA(`/accounts/ensure`, {
      method: "POST",
      body: JSON.stringify({ userId, leagueId }),
    });
    return TradingAccountSchema.parse(data);
  }

  async getCredScore(userId: string, leagueId?: string): Promise<CredScore> {
    if (this.isMock) return mockService.getCredScore(userId, leagueId);
    const query = leagueId ? `?leagueId=${encodeURIComponent(leagueId)}` : "";
    const data = await this.fetchTrackA(`/cred/${userId}${query}`);
    return CredScoreSchema.parse(data);
  }

  async getCredScoreHistory(userId: string): Promise<CredScore[]> {
    if (this.isMock) return mockService.getCredScoreHistory(userId);
    const data = await this.fetchTrackA(`/cred/${userId}/history`);
    return z.array(CredScoreSchema).parse(data);
  }

  async getBenchmarkSeries(symbol = "NIFTY50"): Promise<BenchmarkSeries> {
    if (this.isMock) return mockService.getBenchmarkSeries(symbol);
    const data = await this.fetchTrackA(`/benchmark?symbol=${encodeURIComponent(symbol)}`);
    return BenchmarkSeriesSchema.parse(data);
  }
}

// Global singleton instance
export const trackA = new TrackAClient();
