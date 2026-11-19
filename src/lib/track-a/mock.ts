import { z } from "zod";
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
  Position,
  CredScore,
  CredScoreSchema,
  SearchResult,
  SearchResultSchema,
  BenchmarkSeries,
  BenchmarkSeriesSchema,
  TradingAccount,
  TradingAccountSchema,
} from "./schemas";
import {
  FIXTURE_TICKERS,
  getFixtureTicker,
  generateCurrentPrice,
  generateHistory,
} from "./fixtures";

// In-memory store for mock accounts & orders
interface MockAccountState {
  accountId: string;
  userId: string;
  leagueId?: string;
  buyingPower: number; // default 10,00,000 INR
  positions: Map<string, { quantity: number; totalCost: number; realizedPnl: number }>;
  orders: OrderResponse[];
  idempotencyKeys: Map<string, OrderResponse>;
  createdAt: number;
}

const mockAccounts = new Map<string, MockAccountState>();

// Helper to seed initial sample positions if fresh account
function getOrCreateAccount(accountIdOrUserId: string, leagueId?: string): MockAccountState {
  let acc = mockAccounts.get(accountIdOrUserId);
  if (!acc) {
    // Check if matching by userId
    for (const a of mockAccounts.values()) {
      if (a.userId === accountIdOrUserId && (!leagueId || a.leagueId === leagueId)) {
        return a;
      }
    }
    // Create new
    const accountId = `acc_${accountIdOrUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}_${Date.now()}`;
    acc = {
      accountId,
      userId: accountIdOrUserId,
      leagueId,
      buyingPower: 1000000, // 10 Lakhs INR starting cash
      positions: new Map(),
      orders: [],
      idempotencyKeys: new Map(),
      createdAt: Math.floor(Date.now() / 1000),
    };

    // Give default demo positions for rich first-time display
    const samplePositions = [
      { ticker: "RELIANCE", qty: 25, costPerShare: 2950.0 },
      { ticker: "INFY", qty: 40, costPerShare: 1750.0 },
      { ticker: "HDFCBANK", qty: 30, costPerShare: 1640.0 },
    ];
    let spent = 0;
    for (const sp of samplePositions) {
      const cost = sp.qty * sp.costPerShare;
      spent += cost;
      acc.positions.set(sp.ticker, {
        quantity: sp.qty,
        totalCost: cost,
        realizedPnl: 0,
      });
    }
    acc.buyingPower -= spent;

    mockAccounts.set(accountId, acc);
    mockAccounts.set(accountIdOrUserId, acc);
  }
  return acc;
}

export class MockTrackAService {
  // 1. Market Status
  async getMarketStatus(): Promise<MarketStatus> {
    const now = new Date();
    // Market hours in IST: 9:15 AM - 3:30 PM (UTC+5:30)
    // Convert to IST
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const istMinutes = utcHours * 60 + utcMinutes + 330;
    const istDay = (now.getUTCDay() + Math.floor(istMinutes / 1440)) % 7;
    const currentIstMinute = istMinutes % 1440;

    const isWeekend = istDay === 0 || istDay === 6;
    const isMarketHours = !isWeekend && currentIstMinute >= 9 * 60 + 15 && currentIstMinute <= 15 * 60 + 30;

    // For testing ease, if query or dev, can default to open
    const status: "open" | "closed" | "halted" = isMarketHours ? "open" : "open"; // Open by default for paper-trading league testing
    const message = status === "open" ? "NSE regular session live" : "Market closed. Next session opens at 09:15 IST";

    return MarketStatusSchema.parse({
      status,
      message,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  // 2. Quotes
  async getQuote(ticker: string): Promise<Quote> {
    const fixture = getFixtureTicker(ticker) || {
      ticker: ticker.toUpperCase(),
      name: ticker.toUpperCase(),
      exchange: "NSE",
      sector: "Diversified",
      assetType: "stock",
      basePrice: 1000,
    };

    const priceInfo = generateCurrentPrice(fixture);
    return QuoteSchema.parse({
      ticker: fixture.ticker,
      name: fixture.name,
      ...priceInfo,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  async getQuotes(tickers: string[]): Promise<Quote[]> {
    return Promise.all(tickers.map((t) => this.getQuote(t)));
  }

  // 3. Price History
  async getPriceHistory(
    ticker: string,
    interval: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" = "1D"
  ): Promise<PriceHistory> {
    const fixture = getFixtureTicker(ticker) || {
      ticker: ticker.toUpperCase(),
      name: ticker.toUpperCase(),
      exchange: "NSE",
      sector: "Diversified",
      assetType: "stock",
      basePrice: 1000,
    };
    const points = generateHistory(fixture, interval);
    return PriceHistorySchema.parse({
      ticker: fixture.ticker,
      interval,
      points,
    });
  }

  // 4. Search Tickers
  async searchTickers(query: string): Promise<SearchResult[]> {
    const q = query.trim().toUpperCase();
    const results = FIXTURE_TICKERS.filter(
      (t) => t.ticker.includes(q) || t.name.toUpperCase().includes(q)
    ).map((t) => {
      const price = generateCurrentPrice(t).price;
      return {
        ticker: t.ticker,
        name: t.name,
        exchange: t.exchange,
        assetType: t.assetType,
        sector: t.sector,
        lastPrice: price,
      };
    });
    return z.array(SearchResultSchema).parse(results);
  }

  // 5. Place Order
  async placeOrder(accountIdOrUserId: string, order: OrderRequest): Promise<OrderResponse> {
    const acc = getOrCreateAccount(accountIdOrUserId);

    // Idempotency check: if key already processed, return existing response
    if (acc.idempotencyKeys.has(order.idempotencyKey)) {
      return acc.idempotencyKeys.get(order.idempotencyKey)!;
    }

    const quote = await this.getQuote(order.ticker);
    const executionPrice = order.type === "limit" ? order.price! : quote.price;
    const totalOrderCost = executionPrice * order.quantity;
    const now = Math.floor(Date.now() / 1000);
    const orderId = `ord_${Math.random().toString(36).substring(2, 9)}_${now}`;

    // Validate order
    if (order.side === "buy") {
      if (acc.buyingPower < totalOrderCost) {
        const rejected: OrderResponse = OrderResponseSchema.parse({
          orderId,
          status: "rejected",
          ticker: order.ticker.toUpperCase(),
          side: "buy",
          type: order.type,
          quantity: order.quantity,
          filledQuantity: 0,
          price: executionPrice,
          reason: `Insufficient buying power. Required ₹${totalOrderCost.toFixed(2)}, Available ₹${acc.buyingPower.toFixed(2)}`,
          createdAt: now,
          updatedAt: now,
        });
        acc.idempotencyKeys.set(order.idempotencyKey, rejected);
        return rejected;
      }
    } else {
      // sell
      const existing = acc.positions.get(order.ticker.toUpperCase());
      const ownedQty = existing ? existing.quantity : 0;
      if (ownedQty < order.quantity) {
        const rejected: OrderResponse = OrderResponseSchema.parse({
          orderId,
          status: "rejected",
          ticker: order.ticker.toUpperCase(),
          side: "sell",
          type: order.type,
          quantity: order.quantity,
          filledQuantity: 0,
          price: executionPrice,
          reason: `Insufficient shares to sell. Owned ${ownedQty}, attempted to sell ${order.quantity}`,
          createdAt: now,
          updatedAt: now,
        });
        acc.idempotencyKeys.set(order.idempotencyKey, rejected);
        return rejected;
      }
    }

    // Execute order
    const isFilledNow = order.type === "market";
    const status: "filled" | "pending" = isFilledNow ? "filled" : "pending";

    if (isFilledNow) {
      if (order.side === "buy") {
        acc.buyingPower -= totalOrderCost;
        const current = acc.positions.get(order.ticker.toUpperCase()) || { quantity: 0, totalCost: 0, realizedPnl: 0 };
        current.quantity += order.quantity;
        current.totalCost += totalOrderCost;
        acc.positions.set(order.ticker.toUpperCase(), current);
      } else {
        // sell
        acc.buyingPower += totalOrderCost;
        const current = acc.positions.get(order.ticker.toUpperCase())!;
        const avgCost = current.totalCost / current.quantity;
        const costBasisSold = avgCost * order.quantity;
        const realizedGain = totalOrderCost - costBasisSold;
        current.quantity -= order.quantity;
        current.totalCost -= costBasisSold;
        current.realizedPnl += realizedGain;
        if (current.quantity <= 0) {
          acc.positions.delete(order.ticker.toUpperCase());
        }
      }
    }

    const response: OrderResponse = OrderResponseSchema.parse({
      orderId,
      status,
      ticker: order.ticker.toUpperCase(),
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      filledQuantity: isFilledNow ? order.quantity : 0,
      price: executionPrice,
      filledPrice: isFilledNow ? executionPrice : undefined,
      createdAt: now,
      updatedAt: now,
    });

    acc.orders.unshift(response);
    acc.idempotencyKeys.set(order.idempotencyKey, response);
    return response;
  }

  // 6. Cancel Order
  async cancelOrder(accountIdOrUserId: string, orderId: string): Promise<OrderResponse> {
    const acc = getOrCreateAccount(accountIdOrUserId);
    const orderIndex = acc.orders.findIndex((o) => o.orderId === orderId);

    if (orderIndex === -1) {
      throw new Error("Order not found");
    }

    const order = acc.orders[orderIndex];
    if (order.status === "filled") {
      const err = new Error("Cannot cancel: order already filled");
      (err as any).status = 409;
      throw err;
    }

    const updated = OrderResponseSchema.parse({
      ...order,
      status: "rejected",
      reason: "Cancelled by user",
      updatedAt: Math.floor(Date.now() / 1000),
    });

    acc.orders[orderIndex] = updated;
    return updated;
  }

  // 7. Orders queries
  async getOpenOrders(accountIdOrUserId: string): Promise<OrderResponse[]> {
    const acc = getOrCreateAccount(accountIdOrUserId);
    return acc.orders.filter((o) => o.status === "pending");
  }

  async getOrderHistory(accountIdOrUserId: string): Promise<OrderResponse[]> {
    const acc = getOrCreateAccount(accountIdOrUserId);
    return acc.orders;
  }

  // 8. Portfolio (Track B NEVER computes PnL - Track A returns ready values!)
  async getPortfolio(accountIdOrUserId: string): Promise<Portfolio> {
    const acc = getOrCreateAccount(accountIdOrUserId);
    const positionsList: Position[] = [];

    let totalMarketValue = 0;
    let totalCost = 0;
    let totalRealized = 0;

    for (const [ticker, pos] of acc.positions.entries()) {
      const quote = await this.getQuote(ticker);
      const fixture = getFixtureTicker(ticker);
      const avgCost = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
      const marketVal = pos.quantity * quote.price;
      const unPnl = marketVal - pos.totalCost;
      const unPnlPercent = pos.totalCost > 0 ? (unPnl / pos.totalCost) * 100 : 0;

      totalMarketValue += marketVal;
      totalCost += pos.totalCost;
      totalRealized += pos.realizedPnl;

      positionsList.push({
        ticker,
        quantity: pos.quantity,
        averageCost: Math.round(avgCost * 100) / 100,
        currentPrice: quote.price,
        marketValue: Math.round(marketVal * 100) / 100,
        unrealizedPnl: Math.round(unPnl * 100) / 100,
        unrealizedPnlPercent: Math.round(unPnlPercent * 100) / 100,
        realizedPnl: Math.round(pos.realizedPnl * 100) / 100,
        sector: fixture?.sector || "Diversified",
        assetType: fixture?.assetType || "stock",
      });
    }

    const totalVal = acc.buyingPower + totalMarketValue;
    const totalUnrealized = totalMarketValue - totalCost;
    const totalUnrealizedPercent = totalCost > 0 ? (totalUnrealized / totalCost) * 100 : 0;

    // Day change calculation
    const dayChange = totalMarketValue * 0.012; // +1.2% day change sample
    const dayChangePercent = 1.2;

    return PortfolioSchema.parse({
      accountId: acc.accountId,
      buyingPower: Math.round(acc.buyingPower * 100) / 100,
      totalValue: Math.round(totalVal * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalUnrealizedPnl: Math.round(totalUnrealized * 100) / 100,
      totalUnrealizedPnlPercent: Math.round(totalUnrealizedPercent * 100) / 100,
      totalRealizedPnl: Math.round(totalRealized * 100) / 100,
      positions: positionsList,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePercent,
    });
  }

  async getBuyingPower(accountIdOrUserId: string): Promise<{ buyingPower: number }> {
    const acc = getOrCreateAccount(accountIdOrUserId);
    return { buyingPower: Math.round(acc.buyingPower * 100) / 100 };
  }

  // 9. Identity & Trading Account
  async ensureTradingAccount(userId: string, leagueId?: string): Promise<TradingAccount> {
    const acc = getOrCreateAccount(userId, leagueId);
    return TradingAccountSchema.parse({
      accountId: acc.accountId,
      userId: acc.userId,
      leagueId: acc.leagueId,
      buyingPower: acc.buyingPower,
      createdAt: acc.createdAt,
    });
  }

  // 10. Cred Score (integer score, confidence range, one-line reason)
  async getCredScore(userId: string, leagueId?: string): Promise<CredScore> {
    // Deterministic realistic score based on userId
    const hash = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = 650 + (hash % 200); // 650 - 849
    const rangeLow = score - 35;
    const rangeHigh = score + 40;

    const reasons = [
      "Consistent Sharpe ratio of 1.45 and disciplined stop-loss execution.",
      "High sector diversification across Technology and Banking; low drawdown.",
      "Well-hedged portfolio with disciplined position sizing (<10% per ticket).",
      "Consistent risk-adjusted returns with strong risk-reward ratio.",
      "Controlled volatility and high win-rate on multi-day swing positions.",
    ];
    const oneLineReason = reasons[hash % reasons.length];

    return CredScoreSchema.parse({
      userId,
      score,
      rangeLow,
      rangeHigh,
      oneLineReason,
      updatedAt: Math.floor(Date.now() / 1000),
    });
  }

  async getCredScoreHistory(userId: string): Promise<CredScore[]> {
    const base = await this.getCredScore(userId);
    const history: CredScore[] = [];
    const now = Math.floor(Date.now() / 1000);
    const daySecs = 86400;

    for (let i = 14; i >= 0; i--) {
      const dayOffset = i * daySecs;
      const variation = Math.round(Math.sin(i * 0.8) * 15);
      history.push({
        userId,
        score: base.score + variation,
        rangeLow: base.rangeLow + variation,
        rangeHigh: base.rangeHigh + variation,
        oneLineReason: base.oneLineReason,
        updatedAt: now - dayOffset,
      });
    }

    return history;
  }

  // 11. Benchmark Series
  async getBenchmarkSeries(symbol = "NIFTY50"): Promise<BenchmarkSeries> {
    const points: Array<{ t: number; portfolioValue: number; benchmarkValue: number }> = [];
    const now = Math.floor(Date.now() / 1000);
    const daySecs = 86400;

    let portVal = 100;
    let benchVal = 100;

    for (let i = 14; i >= 0; i--) {
      const t = now - i * daySecs;
      portVal += (Math.sin(i * 1.1) * 1.5 + 0.4);
      benchVal += (Math.sin(i * 0.9) * 0.9 + 0.2);
      points.push({
        t,
        portfolioValue: Math.round(portVal * 100) / 100,
        benchmarkValue: Math.round(benchVal * 100) / 100,
      });
    }

    return BenchmarkSeriesSchema.parse({
      symbol,
      baseline: 100,
      points,
    });
  }
}
