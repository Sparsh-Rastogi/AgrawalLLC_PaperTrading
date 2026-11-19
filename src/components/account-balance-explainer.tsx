"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Portfolio } from "@/lib/track-a/schemas";
import { Card } from "@/components/ui/card";
import { PnLDisplay } from "@/components/pnl-display";

interface AccountBalanceExplainerProps {
  portfolio: Portfolio;
  compact?: boolean;
}

export function AccountBalanceExplainer({
  portfolio,
  compact = false,
}: AccountBalanceExplainerProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const stockHoldingsValue = Math.max(
    0,
    portfolio.totalValue - portfolio.buyingPower
  );

  return (
    <Card className="space-y-4">
      {/* Header with Title and Beginner Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Account Balance & Assets
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live ₹ INR
          </span>
        </div>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-[11px] font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>{showExplanation ? "Hide Explanations" : "What is this? ℹ️"}</span>
        </button>
      </div>

      {/* Primary Value Display */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs text-zinc-400 block mb-1">
            Total Account Net Worth (Cash + Stock Holdings)
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
            ₹{portfolio.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <PnLDisplay
              value={portfolio.dayChange}
              percent={portfolio.dayChangePercent}
              size="sm"
            />
            <span className="text-xs text-zinc-500">today&apos;s change</span>
          </div>
        </div>

        {/* Quick Balance Breakdown Badges */}
        <div className="flex items-center gap-2 sm:self-center">
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
            <span className="text-[10px] text-zinc-400 block">Available Cash</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              ₹{portfolio.buyingPower.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
            <span className="text-[10px] text-zinc-400 block">Stock Value</span>
            <span className="text-xs font-mono font-bold text-white">
              ₹{stockHoldingsValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Balance Ratio Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  5,
                  (portfolio.buyingPower / Math.max(1, portfolio.totalValue)) * 100
                )
              )}%`,
            }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title="Available Cash"
          />
          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  (stockHoldingsValue / Math.max(1, portfolio.totalValue)) * 100
                )
              )}%`,
            }}
            className="h-full bg-zinc-500 transition-all duration-500"
            title="Invested Stocks"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Cash:{" "}
            {((portfolio.buyingPower / Math.max(1, portfolio.totalValue)) * 100).toFixed(1)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            Stock Holdings:{" "}
            {((stockHoldingsValue / Math.max(1, portfolio.totalValue)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Profit & Loss Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400">Unrealized PnL</span>
            <span className="text-[9px] px-1 rounded bg-white/10 text-zinc-300">Paper</span>
          </div>
          <PnLDisplay
            value={portfolio.totalUnrealizedPnl}
            percent={portfolio.totalUnrealizedPnlPercent}
            size="sm"
          />
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400">Realized PnL</span>
            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400">Booked</span>
          </div>
          <PnLDisplay value={portfolio.totalRealizedPnl} size="sm" />
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400">Total Invested Cost</span>
            <span className="text-[9px] px-1 rounded bg-white/10 text-zinc-300">Basis</span>
          </div>
          <span className="text-xs font-mono font-bold text-white">
            ₹{portfolio.totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Beginner Explanation Accordion (collapsible or open) */}
      {showExplanation && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>💡</span> Beginner&apos;s Money Breakdown Guide
            </h4>
            <Link
              href="/how-to-use"
              className="text-[11px] font-semibold text-zinc-300 hover:text-white underline"
            >
              Full Guide →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-zinc-300">
            <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
              <span className="font-bold text-white block">
                1. Total Account Net Worth
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                The grand total of everything you own on StreetCred: your cash balance plus the current real-time market value of all stocks you own.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
              <span className="font-bold text-emerald-400 block">
                2. Available Cash (Buying Power)
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Liquid cash sitting in your account that isn&apos;t tied up in shares. You can spend this right now to place new Buy orders.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
              <span className="font-bold text-white block">
                3. Unrealized PnL (&ldquo;Paper Profit/Loss&rdquo;)
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                How much profit or loss you would make <span className="text-white font-medium">if you sold all your open positions right now</span> at market price. It changes every second as market prices move.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 space-y-1">
              <span className="font-bold text-emerald-400 block">
                4. Realized PnL (&ldquo;Booked Profit/Loss&rdquo;)
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Actual profits or losses from past trades that have already been finalized and added to (or subtracted from) your cash balance.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
