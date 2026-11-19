import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How to Use & Trading Guide · StreetCred IIT BHU",
  description:
    "Beginner-friendly guide to reading your portfolio, understanding market vs limit orders, and mastering the StreetCred Score.",
};

export default function HowToUsePage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
          <span>🎓</span> IIT (BHU) Paper Trading Academy
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          How to Use StreetCred & Trade Like a Pro
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Master the fundamentals of your portfolio ledger, order types, risk control, and how the StreetCred scoring system rewards disciplined strategy over blind luck.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/markets">
            <Button variant="primary" size="md" className="gap-1.5">
              <span>Go to Markets</span>
              <span>→</span>
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="secondary" size="md">
              View Your Statement
            </Button>
          </Link>
        </div>
      </div>

      {/* Chapter 1: How to Read Your Portfolio */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold text-xs flex items-center justify-center border border-white/15">
            1
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            How to Read Your Account & Portfolio Numbers
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          When you trade on StreetCred, your virtual capital is divided into two primary buckets: liquid cash ready to trade, and equity tied up in shares of companies. Here is how every metric works together:
        </p>

        {/* Formula Diagram */}
        <div className="p-4 sm:p-6 rounded-2xl glass-panel-elevated border border-white/10 text-center space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            The Fundamental Balance Equation
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono text-sm sm:text-lg font-black text-white">
            <span className="p-2 sm:p-3 rounded-xl bg-white/10 border border-white/20 text-white">
              Total Net Worth
            </span>
            <span className="text-zinc-500">=</span>
            <span className="p-2 sm:p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              Available Cash
            </span>
            <span className="text-zinc-500">+</span>
            <span className="p-2 sm:p-3 rounded-xl bg-white/10 border border-white/20 text-zinc-300">
              Stock Market Value
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            If you start with ₹1,00,000 cash and buy ₹25,000 worth of TCS shares, your Available Cash becomes ₹75,000 and your Stock Value is ₹25,000. Your Total Net Worth remains ₹1,00,000 until TCS stock price fluctuates.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="text-emerald-400">●</span> Available Cash (Buying Power)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                Liquid Capital
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This is the uninvested cash currently sitting in your account. You can use it right away to place new <strong>BUY</strong> orders. When you sell shares, the proceeds instantly flow back into your Available Cash.
            </p>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="text-white">●</span> Stock Market Value
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                Open Positions
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The real-time market value of all shares you currently hold: <em>(Quantity × Live Current Price)</em>. This number ticks up and down continuously during Indian market trading hours (09:15 to 15:30 IST).
            </p>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="text-emerald-400">●</span> Unrealized PnL (&ldquo;Paper Gain/Loss&rdquo;)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                Floating
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The profit or loss you <em>would</em> make if you sold all your open positions right now at the current market price. It is called &ldquo;unrealized&rdquo; because it is not locked in yet until you hit Sell.
            </p>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="text-emerald-400">●</span> Realized PnL (&ldquo;Booked Return&rdquo;)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                Locked In
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The permanent profit or loss from trades you have closed and exited. Once booked, this money is permanently settled in your cash balance and no longer fluctuates with that stock&apos;s price.
            </p>
          </Card>
        </div>
      </section>

      {/* Chapter 2: Order Types Explained */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold text-xs flex items-center justify-center border border-white/15">
            2
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Order Types Demystified: Market vs Limit vs Stop
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Choosing the right order type is the first step of institutional risk management. StreetCred supports 3 primary order types:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Market Order */}
          <Card className="space-y-3 p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">Market Order</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                  Instant Fill
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                Executes immediately at whatever best price is currently available in the market.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>Speed:</strong> Guaranteed instant execution.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-zinc-400">⚠</span>
                  <span><strong>Price Risk:</strong> In volatile sessions, final execution price may slightly vary due to slippage.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-white">●</span>
                  <span><strong>When to use:</strong> When you need to enter or exit a trade right now without waiting.</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-500 font-mono">
              Formula: Fill Price ≈ Current Ask / Bid
            </div>
          </Card>

          {/* Limit Order */}
          <Card className="space-y-3 p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">Limit Order</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white uppercase border border-white/15">
                  Price Bound
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                Executes only if the price hits your target price or better.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>Price Protection:</strong> You will never pay more than your Buy Limit or receive less than your Sell Limit.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-zinc-400">⚠</span>
                  <span><strong>Execution Risk:</strong> If market price never reaches your limit, order stays pending.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-white">●</span>
                  <span><strong>When to use:</strong> When you have a disciplined entry target and refuse to overpay.</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-500 font-mono">
              Rule: Buy ≤ Limit Price, Sell ≥ Limit Price
            </div>
          </Card>

          {/* Stop Order */}
          <Card className="space-y-3 p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">Stop Order</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 uppercase border border-rose-500/30">
                  Stop Loss
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                Automatically triggers a market order once the stock drops to your stop threshold.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 pt-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>Loss Prevention:</strong> Protects your portfolio from disastrous drawdowns while you sleep.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-400">⚠</span>
                  <span><strong>Trigger:</strong> Once touched, it turns into an active market order.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-white">●</span>
                  <span><strong>When to use:</strong> Essential risk management on every speculative stock.</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-500 font-mono">
              Trigger: Market Price crosses Stop Price
            </div>
          </Card>
        </div>
      </section>

      {/* Chapter 3: What is StreetCred Score? */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold text-xs flex items-center justify-center border border-white/15">
            3
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Understanding the StreetCred Score (300 to 900)
          </h2>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl glass-panel-elevated border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Institutional Quality Metric
              </span>
              <h3 className="text-lg font-black text-white">
                Why Returns Alone Don&apos;t Win Hostel Leagues
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                850+ Elite
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono font-bold border border-white/20">
                750-849 Pro
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-mono font-bold border border-zinc-700">
                650-749 Disciplined
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            In typical amateur trading competitions, a player who gambles 100% of their cash into a single volatile stock can get lucky and sit at #1 temporarily, only to crash into bankruptcy the next day. StreetCred penalizes reckless gambling and rewards the traits of real hedge fund managers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-white block">
                1. Sharpe & Sortino Ratio
              </span>
              <h4 className="text-xs font-bold text-white">Risk-Adjusted Consistency</h4>
              <p className="text-[11px] text-zinc-400">
                Measures how much excess return you produce per unit of volatility taken.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-400 block">
                2. Max Drawdown Control
              </span>
              <h4 className="text-xs font-bold text-white">Capital Preservation</h4>
              <p className="text-[11px] text-zinc-400">
                Traders who limit their worst peak-to-trough drop receive massive score boosts.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                3. Sector Diversification
              </span>
              <h4 className="text-xs font-bold text-white">Balanced Asset Allocation</h4>
              <p className="text-[11px] text-zinc-400">
                Holding positions across IT, Banking, Energy, and Index ETFs lowers vulnerability.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-white block">
                4. Qualifying Trades
              </span>
              <h4 className="text-xs font-bold text-white">Active Participation</h4>
              <p className="text-[11px] text-zinc-400">
                Execute at least 5 trades per 2-week league to qualify for leaderboard prizes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 4: Hostel Leagues & Rules */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold text-xs flex items-center justify-center border border-white/15">
            4
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            IIT (BHU) Hostel Leagues & Leaderboard Rules
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>🏰</span> Hostel Rivalries
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every student belongs to an official IIT (BHU) hostel (Aryabhata, Dhanrajgiri, Morvi, Rajputana, Limbdi, Vishvesvaraya, etc.). Compete individually and contribute to your hostel&apos;s collective average score to take home the semester campus trophy.
            </p>
          </Card>

          <Card className="space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>⏱️</span> 14-Day Sprint Cycles
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Leagues run for exactly 14 calendar days. When the countdown timer hits zero, the leaderboard freezes permanently, awards medals (🥇 First, 🥈 Second, 🥉 Third), and records historic standings.
            </p>
          </Card>
        </div>
      </section>

      {/* Call to Action Banner */}
      <div className="p-6 rounded-2xl glass-panel-elevated border border-white/15 text-center space-y-3">
        <h3 className="text-xl font-extrabold text-white">
          Ready to put theory into practice?
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Explore real-time quotes, inspect interactive charts, and execute your qualifying trades now.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link href="/markets">
            <Button variant="primary" size="md">
              Start Trading on Markets →
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="secondary" size="md">
              Download Official Statement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
