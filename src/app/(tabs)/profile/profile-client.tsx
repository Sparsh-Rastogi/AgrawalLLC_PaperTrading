"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Portfolio, CredScore, OrderResponse } from "@/lib/track-a/schemas";
import { SessionUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PnLDisplay } from "@/components/pnl-display";
import { CredScoreDisplay } from "@/components/cred-score";
import { usePnLTheme } from "@/hooks/use-pnl-theme";
import { AccountBalanceExplainer } from "@/components/account-balance-explainer";
import { PortfolioStatement } from "./components/portfolio-statement";

interface ProfileClientProps {
  user: SessionUser | null;
  portfolio: Portfolio;
  credScore: CredScore;
  orders: OrderResponse[];
}

export function ProfileClient({
  user,
  portfolio,
  credScore,
  orders,
}: ProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"positions" | "orders" | "statement">("positions");
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Dynamic PnL theming (clamped, smoothed, with neutral accessibility toggle)
  const { neutralMode, toggleNeutralMode } = usePnLTheme(portfolio.totalUnrealizedPnlPercent);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section: User Profile & Dynamic PnL Toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Profile Card */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-lg">
                {user?.handle ? user.handle.slice(0, 2).toUpperCase() : "SC"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {user?.handle || "BHU Trader"}
                  </h1>
                  <Badge variant="default" size="sm">
                    {user?.role === "admin" ? "Admin" : "Verified Student"}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="text-zinc-400">Hostel:</span>
                    <strong className="text-white">{user?.hostel || "IIT BHU"}</strong>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-400">League:</span>
                    <strong className="text-white">Active</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                isLoading={isSigningOut}
                className="text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        {/* Dynamic PnL Banner & Accessibility Toggle */}
        <Card className="flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Display Theme
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white">
                Accessibility
              </span>
            </div>
            <div className="mt-2 text-xs text-zinc-300">
              Current Mode:{" "}
              <strong className="text-white">
                {neutralMode ? "Neutral (High Contrast)" : "Adaptive PnL Color"}
              </strong>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Reactive background tint reflects portfolio trajectory smoothly.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              onClick={toggleNeutralMode}
              className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-200 transition-colors"
            >
              {neutralMode ? "Switch to Adaptive Colors" : "Enable High Contrast Neutral"}
            </button>
          </div>
        </Card>
      </div>

      {/* Account Balance Explainer (Total Money, Cash, Stock Value, Unrealized vs Realized PnL) */}
      <AccountBalanceExplainer portfolio={portfolio} />

      {/* Cred Score & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CredScoreDisplay scoreData={credScore} />
        </div>

        {/* Quick Nav Card */}
        <Card className="flex flex-col justify-center space-y-3 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Deep-Dive Portals
          </span>
          <Link href="/profile/analytics">
            <Button variant="secondary" size="md" className="w-full justify-between text-xs py-2.5">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics & Risk Hub
              </span>
              <span>→</span>
            </Button>
          </Link>
          <Link href="/profile/orders">
            <Button variant="secondary" size="md" className="w-full justify-between text-xs py-2.5">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Order History & Cancel
              </span>
              <span className="font-mono text-zinc-400">({orders.length}) →</span>
            </Button>
          </Link>
          <Link href="/how-to-use">
            <Button variant="secondary" size="md" className="w-full justify-between text-xs py-2.5">
              <span className="flex items-center gap-2">
                <span>💡</span>
                How to Use & Trading Guide
              </span>
              <span>→</span>
            </Button>
          </Link>
        </Card>
      </div>

      {/* Main Tabs: Open Positions | Recent Orders | Official Statement & PDF */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("positions")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "positions"
                ? "border-b-2 border-white text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Open Positions</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-mono">
              {portfolio.positions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-b-2 border-white text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Recent Orders</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-mono">
              {orders.slice(0, 10).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("statement")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "statement"
                ? "border-b-2 border-white text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Official Statement</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
              PDF Export
            </span>
          </button>
        </div>

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div className="space-y-3">
            {portfolio.positions.length === 0 ? (
              <Card className="p-8 text-center text-xs text-zinc-500 border-dashed border-white/10">
                <p>No open positions yet. Go to Markets to execute your first trade!</p>
                <Link href="/markets" className="inline-block mt-3">
                  <Button variant="primary" size="sm">
                    Browse Markets →
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                {portfolio.positions.map((pos) => (
                  <Link
                    key={pos.ticker}
                    href={`/markets/${pos.ticker}`}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{pos.ticker}</span>
                        {pos.sector && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400">
                            {pos.sector}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {pos.quantity} shares · avg ₹{pos.averageCost.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-white">
                        ₹{pos.marketValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <PnLDisplay
                        value={pos.unrealizedPnl}
                        percent={pos.unrealizedPnlPercent}
                        currency={false}
                        size="sm"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <Card className="p-8 text-center text-xs text-zinc-500 border-dashed border-white/10">
                No orders placed yet.
              </Card>
            ) : (
              <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                {orders.slice(0, 10).map((ord) => (
                  <div key={ord.orderId} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase ${ord.side === "buy" ? "text-emerald-400" : "text-rose-400"}`}>
                          {ord.side}
                        </span>
                        <span className="font-bold text-sm text-white">{ord.ticker}</span>
                        <Badge
                          variant={
                            ord.status === "filled"
                              ? "success"
                              : ord.status === "pending"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          {ord.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {ord.quantity} qty · {ord.type} order
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs text-white">
                        ₹{(ord.filledPrice || ord.price).toFixed(2)}
                      </div>
                      {ord.reason && (
                        <div className="text-[10px] text-rose-400 max-w-[200px] truncate">
                          {ord.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Official Statement & PDF Tab */}
        {activeTab === "statement" && (
          <PortfolioStatement
            user={user}
            portfolio={portfolio}
            credScore={credScore}
            orders={orders}
          />
        )}
      </div>
    </div>
  );
}

