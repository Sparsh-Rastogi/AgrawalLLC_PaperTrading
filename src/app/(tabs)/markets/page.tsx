"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PnLDisplay } from "@/components/pnl-display";
import { Badge } from "@/components/ui/badge";

interface SearchItem {
  ticker: string;
  name: string;
  exchange: string;
  assetType: "stock" | "etf";
  sector?: string;
  lastPrice?: number;
}

interface WatchlistItem {
  id: string;
  ticker: string;
  position: number;
  quote: {
    price: number;
    change: number;
    changePercent: number;
    name?: string;
  } | null;
}

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

  // Fetch Watchlist
  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleWatchlist = async (ticker: string, isCurrentlyWatched: boolean) => {
    try {
      if (isCurrentlyWatched) {
        await fetch(`/api/watchlist?ticker=${ticker}`, { method: "DELETE" });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        });
      }
      fetchWatchlist();
    } catch (err) {
      console.error("Watchlist toggle error:", err);
    }
  };

  const isWatched = (ticker: string) =>
    watchlist.some((w) => w.ticker.toUpperCase() === ticker.toUpperCase());

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">NSE Markets</h1>
        <p className="text-xs text-zinc-400">
          Real-time equities & ETFs eligible for StreetCred league
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder="Search tickers (e.g. RELIANCE, INFY, HDFC, NIFTYBEES)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 glass-panel border border-white/10 text-white placeholder:text-zinc-500 py-3"
        />
        <svg
          className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Search Results Dropdown */}
      {searchQuery.trim().length > 0 && (
        <Card className="p-3 space-y-1 glass-panel-elevated border border-white/20">
          <div className="text-[10px] font-bold text-white uppercase tracking-wider px-2 py-1">
            Search Results ({searchResults.length})
          </div>

          {isSearching ? (
            <div className="p-4 text-center text-xs text-zinc-500">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              No tickers found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            searchResults.map((item) => {
              const watched = isWatched(item.ticker);
              return (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Link href={`/markets/${item.ticker}`} className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.ticker}</span>
                      <Badge variant="neutral" size="sm">
                        {item.assetType.toUpperCase()}
                      </Badge>
                      {item.sector && (
                        <span className="text-[10px] text-zinc-400">{item.sector}</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400">{item.name}</div>
                  </Link>

                  <div className="flex items-center gap-3">
                    {item.lastPrice && (
                      <span className="font-mono text-sm font-semibold text-white">
                        ₹{item.lastPrice.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => toggleWatchlist(item.ticker, watched)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        watched
                          ? "bg-white/10 text-white border-white/20"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:text-white"
                      }`}
                      title={watched ? "Remove from watchlist" : "Add to watchlist"}
                    >
                      {watched ? "★" : "☆"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      )}

      {/* Responsive Grid: Watchlist on Left, Featured Directory on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Watchlist Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Your Watchlist
            </h2>
            <span className="text-xs text-zinc-500 font-mono">{watchlist.length} items</span>
          </div>

          {isLoadingWatchlist ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading watchlist...</div>
          ) : watchlist.length === 0 ? (
            <Card className="p-8 text-center space-y-2 border-dashed border-white/10 bg-transparent">
              <p className="text-sm text-zinc-400">No stocks in your watchlist yet.</p>
              <p className="text-xs text-zinc-500">
                Search above or tap on any stock from the directory to add it.
              </p>
            </Card>
          ) : (
            <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"
                >
                  <Link href={`/markets/${item.ticker}`} className="flex-1">
                    <div className="font-bold text-sm text-white">{item.ticker}</div>
                    <div className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                      {item.quote?.name || item.ticker}
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                    {item.quote && (
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-white">
                          ₹{item.quote.price.toFixed(2)}
                        </div>
                        <PnLDisplay
                          value={item.quote.change}
                          percent={item.quote.changePercent}
                          currency={false}
                          size="sm"
                        />
                      </div>
                    )}

                    <button
                      onClick={() => toggleWatchlist(item.ticker, true)}
                      className="text-zinc-500 hover:text-rose-400 p-1 text-xs transition-colors"
                      title="Remove from watchlist"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Directory & Quick Picks */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Popular NSE Equities & ETFs
            </h2>
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Top 15</span>
          </div>

          <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
            {[
              { ticker: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
              { ticker: "TCS", name: "Tata Consultancy Services", sector: "Technology" },
              { ticker: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking" },
              { ticker: "INFY", name: "Infosys Ltd", sector: "Technology" },
              { ticker: "NIFTYBEES", name: "Nippon India Nifty 50 ETF", sector: "Index ETF" },
              { ticker: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automobile" },
              { ticker: "ITC", name: "ITC Ltd", sector: "Consumer Goods" },
            ].map((stock) => {
              const watched = isWatched(stock.ticker);
              return (
                <div
                  key={stock.ticker}
                  className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                >
                  <Link href={`/markets/${stock.ticker}`} className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{stock.ticker}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                        {stock.sector}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                      {stock.name}
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWatchlist(stock.ticker, watched)}
                      className={`text-xs p-1 rounded-md transition-colors ${
                        watched
                          ? "text-white hover:text-zinc-300"
                          : "text-zinc-500 hover:text-white"
                      }`}
                      title={watched ? "Remove from watchlist" : "Add to watchlist"}
                    >
                      {watched ? "★" : "☆"}
                    </button>
                    <Link href={`/markets/${stock.ticker}`}>
                      <span className="text-[11px] font-semibold text-white hover:text-zinc-300">
                        Trade →
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Helper Banner */}
          <div className="p-4 rounded-2xl glass-panel border border-white/10 text-xs text-zinc-400 space-y-1">
            <span className="text-white font-bold block flex items-center gap-1.5">
              <span>💡</span> Order Types Tip
            </span>
            <p className="text-[11px] leading-relaxed">
              Use Limit Orders to specify the exact maximum price you are willing to pay for these stocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
