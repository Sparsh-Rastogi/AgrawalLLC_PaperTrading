import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
import { trackA } from "@/lib/track-a";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PnLDisplay } from "@/components/pnl-display";
import { CredScoreDisplay } from "@/components/cred-score";
import { AccountBalanceExplainer } from "@/components/account-balance-explainer";
import { db } from "@/lib/db";
import { watchlists, watchlistItems, leagues, leagueMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function HomePage() {
  const user = await getCurrentUser();
  const userId = user?.userId || "demo-user";

  // Fetch portfolio & Cred Score from Track A
  const portfolio = await trackA.getPortfolio(userId);
  const credScore = await trackA.getCredScore(userId);
  const orderHistory = await trackA.getOrderHistory(userId);

  // Target: At least 5 trades per user over 2-week league
  const tradeCount = orderHistory.filter((o) => o.status === "filled").length;
  const targetTrades = 5;
  const tradesRemaining = Math.max(0, targetTrades - tradeCount);
  const progressPercent = Math.min(100, (tradeCount / targetTrades) * 100);

  // Fetch user's watchlist
  const userWatchlist = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, userId))
    .get();

  let watchedTickers: string[] = ["RELIANCE", "TCS", "INFY", "HDFCBANK"];
  if (userWatchlist) {
    const items = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.watchlistId, userWatchlist.id))
      .all();
    if (items.length > 0) {
      watchedTickers = items.map((i) => i.ticker);
    }
  }

  const quotes = await trackA.getQuotes(watchedTickers.slice(0, 5));

  // Fetch joined leagues
  const joinedLeagues = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      type: leagues.type,
      status: leagues.status,
    })
    .from(leagueMembers)
    .innerJoin(leagues, eq(leagueMembers.leagueId, leagues.id))
    .where(eq(leagueMembers.userId, userId))
    .all();

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Hey, {user?.handle || "Trader"} <span className="text-xl">👋</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {user?.hostel || "IIT BHU"} · Track B Paper Trading League
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/how-to-use"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-colors flex items-center gap-1.5"
          >
            <span>Guide</span>
          </Link>
          <Link
            href="/profile"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl glass-panel border border-white/10 text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            Statement & Profile →
          </Link>
        </div>
      </div>

      {/* Responsive Desktop Grid: 7 cols main, 5 cols sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Account Balance & Money Explainer (Live, Breakdown, Beginner Friendly) */}
          <AccountBalanceExplainer portfolio={portfolio} />

          {/* 5-Trades League Target Progress Ring */}
          <Card className="glass-panel border border-white/10">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  League Target · 2-Week Challenge
                </span>
                <h3 className="text-sm font-bold text-white">
                  {tradeCount >= targetTrades ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span>Target Achieved!</span>
                      <span className="text-xs text-zinc-400">({tradeCount} trades placed)</span>
                    </span>
                  ) : (
                    `${tradeCount} of ${targetTrades} Trades Placed`
                  )}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {tradesRemaining > 0
                    ? `Execute ${tradesRemaining} more ${
                        tradesRemaining === 1 ? "trade" : "trades"
                      } to qualify for final hostel league prize rankings.`
                    : "You are fully qualified for final hostel league leaderboard prize rankings!"}
                </p>
              </div>

              {/* Circular Progress Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#27272a"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke={tradeCount >= targetTrades ? "#10b981" : "#ffffff"}
                    strokeWidth="5"
                    strokeDasharray="163.3"
                    strokeDashoffset={163.3 - (163.3 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-white font-mono">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Link href="/markets">
              <Button variant="secondary" size="sm" className="w-full flex-col py-3.5 gap-1.5 h-auto glass-panel hover:border-white/30">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-xs font-semibold">Trade Now</span>
              </Button>
            </Link>

            <Link href="/leagues">
              <Button variant="secondary" size="sm" className="w-full flex-col py-3.5 gap-1.5 h-auto glass-panel hover:border-white/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-xs font-semibold">Leagues</span>
              </Button>
            </Link>

            <Link href="/profile/orders">
              <Button variant="secondary" size="sm" className="w-full flex-col py-3.5 gap-1.5 h-auto glass-panel hover:border-white/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs font-semibold">Orders</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cred Score Card */}
          <CredScoreDisplay scoreData={credScore} />

          {/* Watchlist Quick View */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Watchlist
              </h3>
              <Link href="/markets" className="text-xs text-zinc-400 hover:text-white transition-colors">
                Explore Markets →
              </Link>
            </div>

            <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
              {quotes.map((q) => (
                <Link
                  key={q.ticker}
                  href={`/markets/${q.ticker}`}
                  className="flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition-colors"
                >
                  <div>
                    <div className="font-bold text-sm text-white">{q.ticker}</div>
                    <div className="text-[11px] text-zinc-400 truncate max-w-[150px] sm:max-w-[200px]">
                      {q.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-white">
                      ₹{q.price.toFixed(2)}
                    </div>
                    <PnLDisplay
                      value={q.change}
                      percent={q.changePercent}
                      currency={false}
                      size="sm"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Joined Leagues Card */}
          {joinedLeagues.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Active Leagues
                </h3>
                <Link href="/leagues" className="text-xs text-zinc-400 hover:text-white">
                  All Leagues →
                </Link>
              </div>

              <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                {joinedLeagues.map((lg) => (
                  <Link
                    key={lg.id}
                    href={`/leagues/${lg.id}`}
                    className="flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-white">{lg.name}</div>
                      <div className="text-[10px] text-zinc-400 capitalize">
                        {lg.type} League
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                      {lg.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Beginner Helper Tip Card */}
          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <span>💡</span> Need help with Market vs Limit orders?
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Check out the beginner-friendly guide to understand order types, portfolio metrics, and how the Cred Score ranks discipline over luck.
            </p>
            <Link
              href="/how-to-use"
              className="inline-block text-xs font-semibold text-white hover:text-zinc-300 underline pt-1"
            >
              Read the Complete Trading Guide →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

