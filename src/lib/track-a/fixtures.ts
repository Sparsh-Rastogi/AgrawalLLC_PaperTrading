export interface StockFixture {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  assetType: "stock" | "etf";
  basePrice: number;
}

export const FIXTURE_TICKERS: StockFixture[] = [
  { ticker: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE", sector: "Energy", assetType: "stock", basePrice: 2980.5 },
  { ticker: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "Technology", assetType: "stock", basePrice: 4120.0 },
  { ticker: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE", sector: "Financial Services", assetType: "stock", basePrice: 1680.25 },
  { ticker: "INFY", name: "Infosys Ltd", exchange: "NSE", sector: "Technology", assetType: "stock", basePrice: 1790.8 },
  { ticker: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE", sector: "Financial Services", assetType: "stock", basePrice: 1225.4 },
  { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom", assetType: "stock", basePrice: 1540.6 },
  { ticker: "SBIN", name: "State Bank of India", exchange: "NSE", sector: "Financial Services", assetType: "stock", basePrice: 840.1 },
  { ticker: "ITC", name: "ITC Ltd", exchange: "NSE", sector: "Consumer Goods", assetType: "stock", basePrice: 475.3 },
  { ticker: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Industrials", assetType: "stock", basePrice: 3620.0 },
  { ticker: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE", sector: "Automobile", assetType: "stock", basePrice: 980.75 },
  { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", exchange: "NSE", sector: "Financial Services", assetType: "stock", basePrice: 1740.0 },
  { ticker: "MARUTI", name: "Maruti Suzuki India", exchange: "NSE", sector: "Automobile", assetType: "stock", basePrice: 11450.0 },
  { ticker: "WIPRO", name: "Wipro Ltd", exchange: "NSE", sector: "Technology", assetType: "stock", basePrice: 560.2 },
  { ticker: "NIFTYBEES", name: "Nippon India Nifty 50 ETF", exchange: "NSE", sector: "Broad Market", assetType: "etf", basePrice: 275.5 },
  { ticker: "GOLDBEES", name: "Nippon India Gold ETF", exchange: "NSE", sector: "Commodities", assetType: "etf", basePrice: 68.2 },
];

export function getFixtureTicker(ticker: string): StockFixture | undefined {
  return FIXTURE_TICKERS.find((t) => t.ticker.toUpperCase() === ticker.toUpperCase());
}

// Generate realistic pseudo-random price variation based on timestamp
export function generateCurrentPrice(fixture: StockFixture): {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
} {
  const now = Math.floor(Date.now() / 1000);
  // deterministic wobble based on ticker chars & current 5-second interval
  const hash = fixture.ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cycle = Math.sin((now / 60) + hash) * 0.015; // +/- 1.5%
  const noise = (Math.sin(now * 3 + hash) * 0.003);
  const factor = 1 + cycle + noise;

  const price = Math.round(fixture.basePrice * factor * 100) / 100;
  const previousClose = fixture.basePrice;
  const change = Math.round((price - previousClose) * 100) / 100;
  const changePercent = Math.round((change / previousClose) * 10000) / 100;
  const open = Math.round((previousClose * (1 + (hash % 10 - 5) * 0.002)) * 100) / 100;
  const high = Math.round(Math.max(price, open, previousClose * 1.012) * 100) / 100;
  const low = Math.round(Math.min(price, open, previousClose * 0.988) * 100) / 100;
  const volume = 250000 + (hash * 1337) % 500000;

  return { price, change, changePercent, open, high, low, previousClose, volume };
}

// Generate candle points for intervals
export function generateHistory(
  fixture: StockFixture,
  interval: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y"
) {
  const points: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> = [];
  const now = Date.now();
  let numBars = 30;
  let barDuration = 15 * 60 * 1000; // 15 mins

  switch (interval) {
    case "1D":
      numBars = 26; // 6.5 hours trading day
      barDuration = 15 * 60 * 1000;
      break;
    case "1W":
      numBars = 35;
      barDuration = 60 * 60 * 1000; // 1 hour
      break;
    case "1M":
      numBars = 22; // trading days
      barDuration = 24 * 60 * 60 * 1000;
      break;
    case "3M":
      numBars = 65;
      barDuration = 24 * 60 * 60 * 1000;
      break;
    case "6M":
      numBars = 130;
      barDuration = 24 * 60 * 60 * 1000;
      break;
    case "1Y":
      numBars = 250;
      barDuration = 24 * 60 * 60 * 1000;
      break;
  }

  let currentPrice = fixture.basePrice * (interval === "1Y" ? 0.82 : interval === "6M" ? 0.9 : 0.98);
  const startTime = now - numBars * barDuration;

  for (let i = 0; i < numBars; i++) {
    const t = Math.floor((startTime + i * barDuration) / 1000);
    const stepSeed = Math.sin(i * 1.3 + fixture.ticker.length);
    const delta = (stepSeed * 0.02 + 0.001) * currentPrice;
    const o = Math.round(currentPrice * 100) / 100;
    const c = Math.round((currentPrice + delta) * 100) / 100;
    const h = Math.round(Math.max(o, c) * (1 + Math.abs(stepSeed) * 0.008) * 100) / 100;
    const l = Math.round(Math.min(o, c) * (1 - Math.abs(stepSeed) * 0.008) * 100) / 100;
    const v = Math.round(10000 + Math.abs(stepSeed) * 50000);
    points.push({ t, o, h, l, c, v });
    currentPrice = c;
  }

  return points;
}
