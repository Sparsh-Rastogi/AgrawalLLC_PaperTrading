"use client";

import React, { useRef } from "react";
import { Portfolio, CredScore, OrderResponse } from "@/lib/track-a/schemas";
import { SessionUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PnLDisplay } from "@/components/pnl-display";

interface PortfolioStatementProps {
  user: SessionUser | null;
  portfolio: Portfolio;
  credScore: CredScore;
  orders: OrderResponse[];
}

export function PortfolioStatement({
  user,
  portfolio,
  credScore,
  orders,
}: PortfolioStatementProps) {
  const statementRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalStockValue = Math.max(
    0,
    portfolio.totalValue - portfolio.buyingPower
  );

  const scoreTier =
    credScore.score >= 850
      ? "Elite"
      : credScore.score >= 750
      ? "Pro"
      : credScore.score >= 650
      ? "Disciplined"
      : "Developing";

  return (
    <div className="space-y-4">
      {/* Action Header for PDF Download */}
      <div className="no-print flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📄</span> Official Portfolio Statement
          </h3>
          <p className="text-xs text-zinc-400">
            Export a certified IIT (BHU) paper trading ledger for your records or CV.
          </p>
        </div>

        <Button
          onClick={handlePrint}
          variant="primary"
          size="sm"
          className="gap-2 shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF / Print
        </Button>
      </div>

      {/* Statement Document Container */}
      <div
        ref={statementRef}
        className="p-6 sm:p-8 rounded-2xl glass-panel-elevated border border-white/10 space-y-6 text-white"
      >
        {/* Institutional Header */}
        <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm shadow-md shrink-0">
              IIT
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Indian Institute of Technology (BHU) Varanasi
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                StreetCred · Official Portfolio Statement
              </h2>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">
                Statement Date: {currentDate} · Track B League Verification
              </div>
            </div>
          </div>

          <div className="text-right sm:self-center">
            <Badge variant="default" size="sm" className="font-mono">
              STATUS: VERIFIED
            </Badge>
          </div>
        </div>

        {/* Student Trader Profile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Trader Handle</span>
            <span className="font-bold text-white text-sm">{user?.handle || "BHU Student"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Institute Email</span>
            <span className="font-mono text-zinc-300 truncate block">{user?.email || "student@iitbhu.ac.in"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Hostel Affiliation</span>
            <span className="font-semibold text-white">{user?.hostel || "IIT BHU"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">StreetCred Score</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {credScore.score} · {scoreTier} Tier
            </span>
          </div>
        </div>

        {/* Portfolio Net Worth Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div>
            <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Total Net Worth</span>
            <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
              ₹{portfolio.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Cash Balance</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-0.5">
              ₹{portfolio.buyingPower.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Stock Holdings</span>
            <div className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
              ₹{totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Unrealized PnL</span>
            <div className="mt-0.5">
              <PnLDisplay
                value={portfolio.totalUnrealizedPnl}
                percent={portfolio.totalUnrealizedPnlPercent}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Detailed Positions Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Active Stock Positions ({portfolio.positions.length})
            </h4>
            <span className="text-[11px] text-zinc-500 font-mono">
              Valued at real-time market prices
            </span>
          </div>

          {portfolio.positions.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 rounded-xl border border-dashed border-white/10">
              No active holdings on this statement date.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 border-b border-white/10 text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Asset / Symbol</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Avg Cost</th>
                    <th className="p-3 text-right">Market Price</th>
                    <th className="p-3 text-right">Cost Basis</th>
                    <th className="p-3 text-right">Current Value</th>
                    <th className="p-3 text-right">Unrealized PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {portfolio.positions.map((pos) => {
                    const costBasis = pos.quantity * pos.averageCost;
                    return (
                      <tr key={pos.ticker} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-sans font-bold text-white">
                          {pos.ticker}
                        </td>
                        <td className="p-3 font-sans text-zinc-400 text-[11px]">
                          {pos.sector || "General"}
                        </td>
                        <td className="p-3 text-right text-zinc-200">
                          {pos.quantity}
                        </td>
                        <td className="p-3 text-right text-zinc-300">
                          ₹{pos.averageCost.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-white font-semibold">
                          ₹{pos.currentPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-zinc-400">
                          ₹{costBasis.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-white font-bold">
                          ₹{pos.marketValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right">
                          <PnLDisplay
                            value={pos.unrealizedPnl}
                            percent={pos.unrealizedPnlPercent}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Executed Orders History Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Recent Trade Execution Log
            </h4>
            <span className="text-[11px] text-zinc-500 font-mono">
              Last {Math.min(5, orders.length)} orders
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500 rounded-xl border border-dashed border-white/10">
              No trade executions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 border-b border-white/10 text-zinc-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Side</th>
                    <th className="p-3">Ticker</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Executed Price</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.slice(0, 8).map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-[10px] text-zinc-500">
                        {ord.orderId.slice(0, 8)}...
                      </td>
                      <td className="p-3 uppercase font-bold font-sans">
                        <span
                          className={
                            ord.side === "buy"
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {ord.side}
                        </span>
                      </td>
                      <td className="p-3 font-sans font-bold text-white">
                        {ord.ticker}
                      </td>
                      <td className="p-3 text-zinc-400 capitalize">
                        {ord.type}
                      </td>
                      <td className="p-3 text-right text-zinc-200">
                        {ord.quantity}
                      </td>
                      <td className="p-3 text-right text-white">
                        ₹{(ord.filledPrice || ord.price).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            ord.status === "filled"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : ord.status === "pending"
                              ? "bg-white/10 text-zinc-300"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statement Disclaimer Footer */}
        <div className="pt-4 border-t border-white/10 text-[10px] text-zinc-500 leading-relaxed space-y-1">
          <p>
            <strong>Certification Disclaimer:</strong> This official simulated paper trading statement is issued by StreetCred for educational and benchmarking purposes within the Indian Institute of Technology (BHU) Varanasi. No actual legal currency or real-world equity ownership is represented.
          </p>
          <p>
            Risk and score metrics are computed in real time via the Track A market simulation engine adhering to standard Sharpe, Sortino, and drawdown formulations.
          </p>
        </div>
      </div>
    </div>
  );
}
