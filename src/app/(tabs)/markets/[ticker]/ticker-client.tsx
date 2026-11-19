"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Quote, PriceHistory, MarketStatus, Position, OrderResponse } from "@/lib/track-a/schemas";
import { PnLDisplay } from "@/components/pnl-display";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { v4 as uuidv4 } from "uuid";

interface TickerClientProps {
  ticker: string;
  initialQuote: Quote;
  initialHistory: PriceHistory;
  marketStatus: MarketStatus;
  buyingPower: number;
  existingPosition: Position | null;
  userId: string;
}

export function TickerDetailClient({
  ticker,
  initialQuote,
  initialHistory,
  marketStatus,
  buyingPower: initialBuyingPower,
  existingPosition,
  userId,
}: TickerClientProps) {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [interval, setIntervalState] = useState<"1D" | "1W" | "1M" | "3M" | "6M" | "1Y">("1D");
  const [history, setHistory] = useState<PriceHistory>(initialHistory);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Stale price check (>30 seconds)
  const isStale = Math.floor(Date.now() / 1000) - quote.timestamp > 30;

  // Order Ticket State
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPrice, setLimitPrice] = useState<number>(initialQuote.price);
  const [stopPrice, setStopPrice] = useState<number>(initialQuote.price * 0.95);
  const [buyingPower, setBuyingPower] = useState<number>(initialBuyingPower);

  // Modal & submission state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
  const [orderError, setOrderError] = useState<string>("");

  // Unique idempotency key per ticket instance
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  useEffect(() => {
    setIdempotencyKey(uuidv4());
  }, []);

  // Polling for live price
  useEffect(() => {
    const fetchLatestQuote = async () => {
      try {
        const res = await fetch(`/api/market/${ticker}`);
        if (res.ok) {
          const data = await res.json();
          setQuote(data);
        }
      } catch (err) {
        console.error("Quote poll error:", err);
      }
    };

    const t = setInterval(fetchLatestQuote, 8000); // 8 second polling behind data hook
    return () => clearInterval(t);
  }, [ticker]);

  // Load history on interval switch
  const handleIntervalChange = async (newInterval: typeof interval) => {
    if (newInterval === interval) return;
    setIntervalState(newInterval);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/market/${ticker}/history?interval=${newInterval}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const executionPrice = orderType === "limit" ? limitPrice : quote.price;
  const estimatedCost = Math.round(executionPrice * quantity * 100) / 100;
  const ownedShares = existingPosition ? existingPosition.quantity : 0;

  // Validation
  const canBuy = side === "buy" && estimatedCost <= buyingPower && quantity > 0;
  const canSell = side === "sell" && quantity <= ownedShares && quantity > 0;
  const isMarketHalted = marketStatus.status === "halted";

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    setOrderResult(null);

    if (quantity <= 0) {
      setOrderError("Quantity must be greater than 0");
      return;
    }
    if (side === "buy" && estimatedCost > buyingPower) {
      setOrderError(`Insufficient buying power (Available: ₹${buyingPower.toFixed(2)})`);
      return;
    }
    if (side === "sell" && quantity > ownedShares) {
      setOrderError(`You only own ${ownedShares} shares of ${ticker}`);
      return;
    }

    setIsReviewOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setOrderError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          side,
          type: orderType,
          quantity,
          price: orderType === "limit" ? limitPrice : quote.price,
          stopPrice: orderType === "stop" ? stopPrice : undefined,
          idempotencyKey: idempotencyKey || uuidv4(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order execution failed");
      }

      setOrderResult(data);
      // Refresh buying power
      if (side === "buy" && data.status === "filled") {
        setBuyingPower((prev) => Math.max(0, prev - estimatedCost));
      } else if (side === "sell" && data.status === "filled") {
        setBuyingPower((prev) => prev + estimatedCost);
      }

      // Generate fresh idempotency key for next order
      setIdempotencyKey(uuidv4());
    } catch (err: any) {
      setOrderError(err.message || "Failed to submit order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SVG Chart Calculation
  const points = history.points;
  const minPrice = Math.min(...points.map((p) => p.l));
  const maxPrice = Math.max(...points.map((p) => p.h));
  const priceRange = maxPrice - minPrice || 1;
  const chartHeight = 160;
  const chartWidth = 340;

  const svgPoints = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * chartWidth;
      const y = chartHeight - ((p.c - minPrice) / priceRange) * (chartHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isGreen = points.length > 1 && points[points.length - 1].c >= points[0].c;
  const chartColor = isGreen ? "#10b981" : "#f43f5e";

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Link href="/markets" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
          ← Markets
        </Link>
        {isStale && (
          <Badge variant="warning" size="sm">
            ⚠ Stale price (delayed feed)
          </Badge>
        )}
      </div>

      {/* Ticker Header & Price */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{ticker}</h1>
            <p className="text-xs text-zinc-400">{quote.name || ticker}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-white font-mono">
              ₹{quote.price.toFixed(2)}
            </div>
            <PnLDisplay
              value={quote.change}
              percent={quote.changePercent}
              currency={false}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left for Chart, Stats & Holdings; Right for Sticky Order Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Price Chart & Statistics */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 glass-panel border border-white/10 space-y-3">
            {/* Timeframe Switcher */}
            <div className="flex justify-between border-b border-white/10 pb-2">
              {(["1D", "1W", "1M", "3M", "6M", "1Y"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleIntervalChange(tf)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    interval === tf
                      ? "bg-white text-black shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* SVG Polyline Chart */}
            <div className="relative h-48 w-full flex items-center justify-center">
              {isLoadingHistory ? (
                <div className="text-xs text-zinc-500">Updating chart...</div>
              ) : (
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient id={`grad-${ticker}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <polygon
                    points={`0,${chartHeight} ${svgPoints} ${chartWidth},${chartHeight}`}
                    fill={`url(#grad-${ticker})`}
                  />

                  {/* Main Line */}
                  <polyline
                    fill="none"
                    stroke={chartColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgPoints}
                  />
                </svg>
              )}
            </div>

            {/* Price Extrema */}
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono pt-1 border-t border-white/5">
              <span>Low: ₹{minPrice.toFixed(2)}</span>
              <span>High: ₹{maxPrice.toFixed(2)}</span>
            </div>
          </Card>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl glass-panel border border-white/5">
              <span className="text-[10px] text-zinc-400 block uppercase">Open</span>
              <span className="font-mono font-semibold text-white">₹{quote.open.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded-xl glass-panel border border-white/5">
              <span className="text-[10px] text-zinc-400 block uppercase">High</span>
              <span className="font-mono font-semibold text-emerald-400">₹{quote.high.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded-xl glass-panel border border-white/5">
              <span className="text-[10px] text-zinc-400 block uppercase">Low</span>
              <span className="font-mono font-semibold text-rose-400">₹{quote.low.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded-xl glass-panel border border-white/5">
              <span className="text-[10px] text-zinc-400 block uppercase">Prev Close</span>
              <span className="font-mono font-semibold text-white">₹{quote.previousClose.toFixed(2)}</span>
            </div>
          </div>

          {/* Existing Position Card (if owned) */}
          {existingPosition && existingPosition.quantity > 0 && (
            <Card className="p-4 glass-panel border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Your Active Holding
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {existingPosition.quantity} shares
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-white/10 font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Avg Cost</span>
                  <span className="text-white">₹{existingPosition.averageCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Current Value</span>
                  <span className="text-white font-bold">
                    ₹{existingPosition.marketValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">Unrealized PnL</span>
                  <PnLDisplay
                    value={existingPosition.unrealizedPnl}
                    percent={existingPosition.unrealizedPnlPercent}
                    size="sm"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Beginner Trading Helper Callout */}
          <div className="p-4 rounded-xl glass-panel border border-white/10 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <span>💡</span> Need help choosing Market vs Limit order?
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              <strong>Market orders</strong> fill immediately at the current price. <strong>Limit orders</strong> only execute if the stock reaches your specified target price. <strong>Stop orders</strong> protect your capital by setting an automatic stop-loss.
            </p>
            <Link
              href="/how-to-use"
              className="inline-block text-white hover:text-zinc-300 underline font-semibold text-[11px]"
            >
              Learn more in the How to Use Guide →
            </Link>
          </div>
        </div>

        {/* Right Column: Order Ticket (Sticky on desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <Card className="glass-panel-elevated border border-white/15 p-5 space-y-4 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>⚡</span> Order Ticket
              </h3>
              <span className="text-xs text-zinc-400 font-mono">
                Buying Power: ₹{buyingPower.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>

            {isMarketHalted && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 text-center font-semibold">
                Market Halted · Orders Disabled
              </div>
            )}

        <form onSubmit={handleOpenReview} className="space-y-4">
          {/* Side Tabs: Buy vs Sell */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide("buy")}
              className={`py-2 rounded-xl font-bold text-sm transition-all ${
                side === "buy"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-[#181928] text-zinc-400 hover:text-white"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide("sell")}
              className={`py-2 rounded-xl font-bold text-sm transition-all ${
                side === "sell"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                  : "bg-[#181928] text-zinc-400 hover:text-white"
              }`}
            >
              Sell {ownedShares > 0 ? `(${ownedShares} Owned)` : ""}
            </button>
          </div>

          {/* Order Type: Market / Limit / Stop */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
            {(["market", "limit", "stop"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  orderType === t ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Quantity</span>
              <div className="flex gap-1.5">
                {[5, 10, 25, 50].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f2134] text-zinc-300 hover:bg-[#282b45]"
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="font-mono text-base"
              required
            />
          </div>

          {/* Limit Price Input */}
          {orderType === "limit" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Limit Price (₹)
              </label>
              <Input
                type="number"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                className="font-mono text-base"
                required
              />
            </div>
          )}

          {/* Stop Price Input */}
          {orderType === "stop" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Stop Trigger Price (₹)
              </label>
              <Input
                type="number"
                step="0.05"
                value={stopPrice}
                onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                className="font-mono text-base"
                required
              />
            </div>
          )}

          {/* Estimated Cost Summary */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Estimated Price</span>
              <span className="font-mono text-white">₹{executionPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10">
              <span>Estimated Total</span>
              <span className="font-mono text-sm text-white font-bold">
                ₹{estimatedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {orderError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {orderError}
            </div>
          )}

          {/* Review Order Button (Mandatory review step per spec) */}
          <Button
            type="submit"
            variant={side === "buy" ? "success" : "danger"}
            size="lg"
            className="w-full"
            disabled={isMarketHalted || (side === "buy" ? !canBuy : !canSell)}
          >
            Review {side.toUpperCase()} Order
          </Button>
        </form>
      </Card>
    </div>
  </div>

  {/* Mandatory Order Review Modal */}
  <Modal
        isOpen={isReviewOpen}
        onClose={() => {
          if (!isSubmitting) setIsReviewOpen(false);
        }}
        title="Confirm Order Review"
      >
        {orderResult ? (
          <div className="py-6 text-center space-y-3">
            {orderResult.status === "filled" ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-white">Order Executed & Filled!</h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {orderResult.side.toUpperCase()} {orderResult.filledQuantity} {orderResult.ticker} @ ₹
                  {(orderResult.filledPrice || orderResult.price).toFixed(2)}
                </p>
              </div>
            ) : orderResult.status === "pending" ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto text-2xl font-bold">
                  ⏳
                </div>
                <h4 className="text-lg font-bold text-white">Order Queued / Pending</h4>
                <p className="text-xs text-zinc-400">
                  Your {orderResult.type} order has been queued in the exchange book.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✕
                </div>
                <h4 className="text-lg font-bold text-white">Order Rejected</h4>
                <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-900/50">
                  {orderResult.reason || "Order was rejected by exchange"}
                </p>
              </div>
            )}

            <Button
              className="w-full mt-4"
              onClick={() => {
                setIsReviewOpen(false);
                setOrderResult(null);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Action</span>
                <span className={`font-bold uppercase ${side === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                  {side} {ticker}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Order Type</span>
                <span className="text-white capitalize">{orderType} Order</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Quantity</span>
                <span className="font-mono text-white font-bold">{quantity} shares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Price per Share</span>
                <span className="font-mono text-white">₹{executionPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10 text-sm">
                <span>Estimated Total Cost</span>
                <span className="font-mono text-white">
                  ₹{estimatedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {orderError && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-red-400">
                {orderError}
              </div>
            )}

            <p className="text-[11px] text-zinc-500 text-center">
              Protected by unique idempotency key. Double taps will not duplicate orders.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsReviewOpen(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant={side === "buy" ? "success" : "danger"}
                onClick={handleConfirmOrder}
                isLoading={isSubmitting}
              >
                Confirm {side.toUpperCase()}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
