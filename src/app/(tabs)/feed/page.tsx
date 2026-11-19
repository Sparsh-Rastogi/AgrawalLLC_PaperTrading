"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface FeedPost {
  id: string;
  body: string;
  createdAt: number;
  authorId: string;
  authorHandle: string;
  authorHostel?: string;
  tickers: Array<{ ticker: string; sentiment: "bullish" | "bearish" | "neutral" }>;
  likesCount: number;
  hasLiked: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Post form
  const [content, setContent] = useState("");
  const [ticker, setTicker] = useState("");
  const [sentiment, setSentiment] = useState<"bullish" | "bearish" | "neutral">("bullish");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Feed fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsPosting(true);
    setError("");

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          ticker: ticker.trim().toUpperCase(),
          sentiment,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to post");
      }

      setContent("");
      setTicker("");
      fetchFeed();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/react`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  hasLiked: data.liked,
                  likesCount: data.liked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleReport = async (postId: string) => {
    const reason = prompt("Reason for reporting this post to IIT BHU moderators:");
    if (!reason) return;

    try {
      const res = await fetch(`/api/feed/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hidden) {
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          alert("Post has been hidden from feed following community moderation thresholds.");
        } else {
          alert("Thank you. Report flagged for administrator review.");
        }
      }
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Campus Feed</h1>
        <p className="text-xs text-zinc-400">
          Stock discussions, trade rationales & sentiment across IIT BHU hostels
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Post Composer */}
          <Card className="glass-panel border border-white/10 p-4 space-y-3">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your trade setup, earnings thesis, or market observation..."
                rows={3}
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ticker (e.g. INFY)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="w-28 rounded-lg bg-white/[0.05] border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 uppercase font-mono focus:outline-none focus:border-white/40"
                  />

                  {/* Sentiment Selector */}
                  <div className="flex rounded-lg bg-white/[0.05] border border-white/10 p-0.5 text-xs">
                    {(["bullish", "bearish", "neutral"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSentiment(s)}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                          sentiment === s
                            ? s === "bullish"
                              ? "bg-emerald-600 text-white"
                              : s === "bearish"
                              ? "bg-rose-600 text-white"
                              : "bg-zinc-700 text-white"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" size="sm" isLoading={isPosting} disabled={!content.trim()}>
                  Post to Feed
                </Button>
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}
            </form>
          </Card>

          {/* Feed List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading feed...</div>
            ) : posts.length === 0 ? (
              <Card className="p-8 text-center text-xs text-zinc-500 bg-transparent border-dashed border-white/10">
                No posts yet. Be the first to share an analysis with your hostel!
              </Card>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className="glass-panel border border-white/10 hover:border-white/20 p-4 space-y-3 transition-colors"
                >
                  {/* Author & Ticker Tags */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xs shadow-md">
                        {post.authorHandle.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white">
                          {post.authorHandle}
                        </span>
                        {post.authorHostel && (
                          <span className="text-[11px] text-zinc-500 block">
                            {post.authorHostel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {post.tickers.map((t) => (
                        <Badge
                          key={t.ticker}
                          variant={
                            t.sentiment === "bullish"
                              ? "success"
                              : t.sentiment === "bearish"
                              ? "danger"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {t.ticker} {t.sentiment === "bullish" ? "▲" : t.sentiment === "bearish" ? "▼" : "―"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {post.body}
                  </p>

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                    <span suppressHydrationWarning>
                      {new Date(post.createdAt * 1000).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                          post.hasLiked
                            ? "text-rose-400 bg-rose-950/40"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{post.hasLiked ? "♥" : "♡"}</span>
                        <span>{post.likesCount}</span>
                      </button>

                      <button
                        onClick={() => handleReport(post.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 text-[11px] transition-colors"
                        title="Report post (auto-hides on 3 reports)"
                      >
                        🚩 Report
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar on Desktop */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="glass-panel border border-white/10 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🛡️</span> Community Guidelines
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              StreetCred is an educational platform for IIT (BHU) students. Posts should focus on trade rationale, risk analysis, and macro themes.
            </p>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Tag relevant ticker symbol when sharing setups</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>State clear Bullish / Bearish / Neutral sentiment</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-rose-400">✕</span>
                <span>Spam and abusive content will be automatically hidden at 3 reports</span>
              </li>
            </ul>
          </Card>

          <Card className="glass-panel border border-white/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <span>💡</span> Curious about Cred Score impact?
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Discussion in feed does not affect your score directly, but tracking your thesis against real market outcomes builds long-term trader intuition.
            </p>
            <Link
              href="/how-to-use"
              className="inline-block text-xs font-semibold text-white hover:text-zinc-300 underline pt-1"
            >
              Learn about Cred Score mechanics →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
