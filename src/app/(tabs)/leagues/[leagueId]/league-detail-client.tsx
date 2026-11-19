"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  handle: string;
  displayName?: string;
  hostel?: string;
  score: number;
  rangeLow: number;
  rangeHigh: number;
  oneLineReason: string;
  portfolioValue: number;
  totalUnrealizedPnlPercent: number;
  isCurrentUser: boolean;
}

interface LeagueInfo {
  id: string;
  name: string;
  type: string;
  startsAt: number;
  endsAt: number;
  startingCash: number;
  inviteCode: string;
  status: string;
  isEnded: boolean;
}

export function LeagueDetailClient({ leagueId }: { leagueId: string }) {
  const [league, setLeague] = useState<LeagueInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        const res = await fetch(`/api/leagues/${leagueId}`);
        if (res.ok) {
          const data = await res.json();
          setLeague(data.league);
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error("League fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueId]);

  const handleCopyInvite = () => {
    if (!league) return;
    navigator.clipboard.writeText(league.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading leaderboard...</div>;
  }

  if (!league) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-sm text-zinc-400">Competition not found</p>
        <Link href="/leagues" className="text-xs text-white/80 hover:text-white underline">
          ← Back to Competitions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/leagues" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
          ← Competitions
        </Link>

        {league.isEnded ? (
          <Badge variant="default" size="sm">
            🔒 Rankings Frozen (Concluded)
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            Live Leaderboard
          </Badge>
        )}
      </div>

      {/* League Card Summary */}
      <Card className="glass-panel border border-white/10 p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{league.name}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Type: <span className="capitalize text-zinc-300">{league.type}</span> · Starting Capital: ₹{(league.startingCash / 100000).toFixed(0)}L
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyInvite}
            className="text-xs"
          >
            {copied ? "Copied!" : `Code: ${league.inviteCode}`}
          </Button>
        </div>

        <div className="text-[11px] text-zinc-400 bg-white/[0.03] p-3 rounded-xl border border-white/10">
          Rankings are calculated strictly from the <strong className="text-white">Track A Cred Score</strong> (risk-adjusted consistency), not raw gamble PnL.
        </div>
      </Card>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-white tracking-tight">
            Standings ({leaderboard.length} traders)
          </h2>
          <span className="text-[11px] text-zinc-500">Sorted by Cred Score</span>
        </div>

        {leaderboard.length === 0 ? (
          <Card className="p-8 text-center text-xs text-zinc-500 bg-transparent border-dashed border-white/10">
            No participants in this competition yet.
          </Card>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const medal =
                entry.rank === 1
                  ? "🥇"
                  : entry.rank === 2
                  ? "🥈"
                  : entry.rank === 3
                  ? "🥉"
                  : `#${entry.rank}`;

              return (
                <Card
                  key={entry.userId}
                  className={`p-3.5 space-y-2 transition-all ${
                    entry.isCurrentUser
                      ? "glass-panel-elevated border-white/40 shadow-xl"
                      : "glass-panel border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1b1d2e] flex items-center justify-center font-bold text-sm text-white font-mono">
                        {medal}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {entry.handle}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/30">
                              YOU
                            </span>
                          )}
                        </div>
                        {entry.hostel && (
                          <span className="text-[11px] text-zinc-500">
                            {entry.hostel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {/* Score as number + range together (per spec rule) */}
                      <div className="font-mono text-base font-extrabold text-white">
                        {entry.score}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        ({entry.rangeLow}–{entry.rangeHigh})
                      </div>
                    </div>
                  </div>

                  {/* One line reason verbatim (per spec rule) */}
                  <div className="text-[11px] text-zinc-400 border-l-2 border-white/40 pl-2 pt-0.5 italic">
                    "{entry.oneLineReason}"
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
