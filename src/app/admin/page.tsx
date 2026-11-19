"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminMetrics {
  verifiedSignUps: number;
  targetSignUps: number;
  activationRate: number;
  targetActivation: number;
  shareWith5Trades: number;
  targetShare5Trades: number;
  week2Retention: number;
  targetRetention: number;
  leagueParticipationRate: number;
  targetLeagueParticipation: number;
  openBugs: number;
  criticalBugs: number;
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Metrics error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading metrics dashboard...</div>;
  }

  const kpis = [
    {
      label: "Verified Sign-ups",
      current: `${metrics.verifiedSignUps}`,
      target: `Goal: ${metrics.targetSignUps}+`,
      status: metrics.verifiedSignUps >= metrics.targetSignUps ? "On Track" : "Recruiting",
      color: "text-emerald-400",
    },
    {
      label: "Activation (Order <48h)",
      current: `${metrics.activationRate}%`,
      target: `Target: ${metrics.targetActivation}%`,
      status: metrics.activationRate >= metrics.targetActivation ? "Exceeded" : "Pending",
      color: "text-white",
    },
    {
      label: "Trades Target (>= 5 Trades)",
      current: `${metrics.shareWith5Trades}%`,
      target: "5 trades/user target",
      status: "Active Nudge",
      color: "text-zinc-300",
    },
    {
      label: "Week 2 Retention",
      current: `${metrics.week2Retention}%`,
      target: `Target: ${metrics.targetRetention}%`,
      status: metrics.week2Retention >= metrics.targetRetention ? "Healthy" : "Watch",
      color: "text-emerald-400",
    },
    {
      label: "League Participation",
      current: `${metrics.leagueParticipationRate}%`,
      target: `Target: ${metrics.targetLeagueParticipation}%`,
      status: metrics.leagueParticipationRate >= metrics.targetLeagueParticipation ? "Strong" : "Growing",
      color: "text-white",
    },
    {
      label: "Critical Bugs (<24h SLA)",
      current: `${metrics.criticalBugs}`,
      target: "Max 0 unassigned",
      status: metrics.criticalBugs === 0 ? "Zero Critical" : "Action Required",
      color: metrics.criticalBugs === 0 ? "text-emerald-400" : "text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Beta League Playbook · 14-Day Dashboard
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Tracking 50+ verified IIT (BHU) students and 2-week competition progress
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="glass-panel border border-white/10 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>{kpi.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300">
                {kpi.status}
              </span>
            </div>
            <div className={`text-3xl font-black font-mono tracking-tight ${kpi.color}`}>
              {kpi.current}
            </div>
            <p className="text-xs text-zinc-500 font-mono">{kpi.target}</p>
          </Card>
        ))}
      </div>

      {/* Playbook Rules Reminder */}
      <Card className="glass-panel border border-white/10 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Operating Rules from StreetCred.md
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="font-bold text-white block">Day 5 Nudge</span>
            <p className="text-zinc-400">
              Send in-app notifications to participants with fewer than 3 completed trades.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="font-bold text-white block">Day 9 Re-engagement</span>
            <p className="text-zinc-400">
              Trigger prompt to students inactive for &gt;48 hours to preserve Week 2 retention.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="font-bold text-emerald-400 block">Day 14 Final Freeze</span>
            <p className="text-zinc-400">
              Freeze final hostel leaderboards, export metrics audit, and distribute prizes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
