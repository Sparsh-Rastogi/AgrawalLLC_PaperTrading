import { z } from "zod";

export const MarketStatusSchema = z.object({
  status: z.enum(["open", "closed", "halted"]),
  message: z.string(),
  timestamp: z.number(),
});
export type MarketStatus = z.infer<typeof MarketStatusSchema>;

export const QuoteSchema = z.object({
  ticker: z.string(),
  name: z.string().optional(),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  previousClose: z.number(),
  timestamp: z.number(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const CandlePointSchema = z.object({
  t: z.number(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
});
export type CandlePoint = z.infer<typeof CandlePointSchema>;

export const PriceHistorySchema = z.object({
  ticker: z.string(),
  interval: z.enum(["1D", "1W", "1M", "3M", "6M", "1Y"]),
  points: z.array(CandlePointSchema),
});
export type PriceHistory = z.infer<typeof PriceHistorySchema>;

export const OrderRequestSchema = z.object({
  ticker: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  type: z.enum(["market", "limit", "stop"]),
  quantity: z.number().int().positive(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  idempotencyKey: z.string().min(1),
});
export type OrderRequest = z.infer<typeof OrderRequestSchema>;

export const OrderResponseSchema = z.object({
  orderId: z.string(),
  status: z.enum(["filled", "pending", "rejected"]),
  ticker: z.string(),
  side: z.enum(["buy", "sell"]),
  type: z.enum(["market", "limit", "stop"]),
  quantity: z.number(),
  filledQuantity: z.number(),
  price: z.number(),
  filledPrice: z.number().optional(),
  reason: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

export const PositionSchema = z.object({
  ticker: z.string(),
  quantity: z.number(),
  averageCost: z.number(),
  currentPrice: z.number(),
  marketValue: z.number(),
  unrealizedPnl: z.number(),
  unrealizedPnlPercent: z.number(),
  realizedPnl: z.number(),
  sector: z.string().optional(),
  assetType: z.enum(["stock", "etf"]).optional(),
});
export type Position = z.infer<typeof PositionSchema>;

export const PortfolioSchema = z.object({
  accountId: z.string(),
  buyingPower: z.number(),
  totalValue: z.number(),
  totalCost: z.number(),
  totalUnrealizedPnl: z.number(),
  totalUnrealizedPnlPercent: z.number(),
  totalRealizedPnl: z.number(),
  positions: z.array(PositionSchema),
  dayChange: z.number(),
  dayChangePercent: z.number(),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;

export const CredScoreSchema = z.object({
  userId: z.string(),
  score: z.number().int(),
  rangeLow: z.number().int(),
  rangeHigh: z.number().int(),
  oneLineReason: z.string(),
  updatedAt: z.number(),
});
export type CredScore = z.infer<typeof CredScoreSchema>;

export const SearchResultSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  exchange: z.string(),
  assetType: z.enum(["stock", "etf"]),
  sector: z.string().optional(),
  lastPrice: z.number().optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const BenchmarkPointSchema = z.object({
  t: z.number(),
  portfolioValue: z.number(),
  benchmarkValue: z.number(),
});
export type BenchmarkPoint = z.infer<typeof BenchmarkPointSchema>;

export const BenchmarkSeriesSchema = z.object({
  symbol: z.string(),
  baseline: z.number().default(100),
  points: z.array(BenchmarkPointSchema),
});
export type BenchmarkSeries = z.infer<typeof BenchmarkSeriesSchema>;

export const TradingAccountSchema = z.object({
  accountId: z.string(),
  userId: z.string(),
  leagueId: z.string().optional(),
  buyingPower: z.number(),
  createdAt: z.number(),
});
export type TradingAccount = z.infer<typeof TradingAccountSchema>;
