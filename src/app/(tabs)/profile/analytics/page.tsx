"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CredHistoryPoint {
  score: number;
  rangeLow: number;
  rangeHigh: number;
  updatedAt: number;
  oneLineReason: string;
}

interface DiversificationItem {
  sector: string;
  value: number;
  percentage: number;
}

interface BenchmarkData {
  symbol: string;
  baseline: number;
  points: Array<{ t: number; portfolioValue: number; benchmarkValue: number }>;
}

export default function AnalyticsHubPage() {
  const [credHistory, setCredHistory] = useState<CredHistoryPoint[]>([]);
  const [diversification, setDiversification] = useState<DiversificationItem[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const data = await res.json();
          setCredHistory(data.credHistory || []);
          setDiversification(data.diversification || []);
          setBenchmark(data.benchmark || null);
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading Analytics Hub...</div>;
  }

  // 1. Cred History SVG calculations
  const chartWidth = 340;
  const chartHeight = 150;
  const scores = credHistory.map((c) => c.score);
  const minScore = Math.min(...credHistory.map((c) => c.rangeLow), 500);
  const maxScore = Math.max(...credHistory.map((c) => c.rangeHigh), 900);
  const scoreRange = maxScore - minScore || 1;

  const scorePoints = credHistory
    .map((c, idx) => {
      const x = (idx / (credHistory.length - 1 || 1)) * chartWidth;
      const y = chartHeight - ((c.score - minScore) / scoreRange) * (chartHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Shaded Confidence Range Polygon
  const rangeHighPoints = credHistory.map((c, idx) => {
    const x = (idx / (credHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((c.rangeHigh - minScore) / scoreRange) * (chartHeight - 20) - 10;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const rangeLowPoints = credHistory
    .slice()
    .reverse()
    .map((c, idx) => {
      const originalIdx = credHistory.length - 1 - idx;
      const x = (originalIdx / (credHistory.length - 1 || 1)) * chartWidth;
      const y = chartHeight - ((c.rangeLow - minScore) / scoreRange) * (chartHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

  const rangePolygon = [...rangeHighPoints, ...rangeLowPoints].join(" ");

  // 2. Benchmark Comparison Line Chart
  const bPoints = benchmark?.points || [];
  const allBenchVals = bPoints.flatMap((p) => [p.portfolioValue, p.benchmarkValue]);
  const minBench = Math.min(...allBenchVals, 90);
  const maxBench = Math.max(...allBenchVals, 110);
  const benchRange = maxBench - minBench || 1;

  const portfolioPoly = bPoints
    .map((p, idx) => {
      const x = (idx / (bPoints.length - 1 || 1)) * chartWidth;
      const y = chartHeight - ((p.portfolioValue - minBench) / benchRange) * (chartHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const benchmarkPoly = bPoints
    .map((p, idx) => {
      const x = (idx / (bPoints.length - 1 || 1)) * chartWidth;
      const y = chartHeight - ((p.benchmarkValue - minBench) / benchRange) * (chartHeight - 20) - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const latestScore = credHistory[credHistory.length - 1];

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/profile" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
          ← Profile
        </Link>
        <Badge variant="info" size="sm">
          Track A Verified Analytics
        </Badge>
      </div>

      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Analytics Hub</h1>
        <p className="text-xs text-zinc-400">
          Risk metrics, historical Cred Score & benchmark relative alpha
        </p>
      </div>

      {/* Chart 1: Cred Score Over Time with Confidence Range */}
      <Card className="glass-panel border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Cred Score Trajectory</h2>
            <p className="text-[11px] text-zinc-400">
              Shaded band reflects the Track A confidence interval
            </p>
          </div>
          {latestScore && (
            <span className="font-mono text-base font-extrabold text-white">
              {latestScore.score}
            </span>
          )}
        </div>

        <div className="h-40 w-full relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            {/* Shaded confidence band */}
            <polygon points={rangePolygon} fill="#ffffff" fillOpacity="0.08" />

            {/* Score line */}
            <polyline
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={scorePoints}
            />
          </svg>
        </div>

        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>14 days ago</span>
          <span>Today</span>
        </div>

        {latestScore && (
          <p className="text-xs text-zinc-400 italic bg-white/[0.04] p-2.5 rounded-xl border border-white/10">
            "{latestScore.oneLineReason}"
          </p>
        )}
      </Card>

      {/* Chart 2: Portfolio vs Benchmark Indexed to 100 */}
      <Card className="glass-panel border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Relative Alpha vs Index</h2>
            <p className="text-[11px] text-zinc-400">
              Both series normalized to 100 at league start
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> You
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-500" /> Nifty 50
            </span>
          </div>
        </div>

        <div className="h-40 w-full relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            {/* Benchmark line (grey) */}
            <polyline
              fill="none"
              stroke="#71717a"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              points={benchmarkPoly}
            />

            {/* Portfolio line (emerald) */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={portfolioPoly}
            />
          </svg>
        </div>

        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>Baseline: 100.00</span>
          {bPoints.length > 0 && (
            <span className="text-emerald-400 font-bold">
              Current: {bPoints[bPoints.length - 1].portfolioValue.toFixed(2)}
            </span>
          )}
        </div>
      </Card>

      {/* Chart 3: Sector Diversification Breakdown */}
      <Card className="glass-panel border border-white/10 p-4 space-y-3">
        <h2 className="text-sm font-bold text-white">Asset & Sector Allocation</h2>

        <div className="space-y-2">
          {diversification.map((item) => (
            <div key={item.sector} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">{item.sector}</span>
                <span className="font-mono text-zinc-400 font-semibold">
                  {item.percentage}% (₹{item.value.toLocaleString("en-IN")})
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
