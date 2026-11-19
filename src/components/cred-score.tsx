import React from "react";
import { CredScore } from "@/lib/track-a/schemas";

interface CredScoreDisplayProps {
  scoreData?: CredScore | null;
  score?: number;
  rangeLow?: number;
  rangeHigh?: number;
  reason?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CredScoreDisplay({
  scoreData,
  score: propScore,
  rangeLow: propRangeLow,
  rangeHigh: propRangeHigh,
  reason: propReason,
  size = "md",
  className = "",
}: CredScoreDisplayProps) {
  const score = scoreData ? scoreData.score : propScore ?? 750;
  const rangeLow = scoreData ? scoreData.rangeLow : propRangeLow ?? score - 30;
  const rangeHigh = scoreData ? scoreData.rangeHigh : propRangeHigh ?? score + 35;
  const reason =
    scoreData?.oneLineReason ||
    propReason ||
    "Strong diversification and disciplined risk management.";

  // Score categorization (strictly black, white, green, red)
  const tier =
    score >= 750
      ? { label: "Elite", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" }
      : score >= 650
      ? { label: "Standard", color: "text-white border-white/20 bg-white/10" }
      : { label: "Developing", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" };

  return (
    <div
      className={`rounded-2xl glass-panel border border-white/10 p-4 sm:p-5 text-white ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
          StreetCred Score
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}
        >
          {tier.label}
        </span>
      </div>

      <div className="flex items-baseline gap-2.5">
        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
          {score}
        </span>
        <span className="text-xs text-zinc-400 font-mono">
          range: {rangeLow}–{rangeHigh}
        </span>
      </div>

      {/* Visual range bar */}
      <div className="my-2.5 w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full ${score >= 650 ? "bg-emerald-500" : "bg-rose-500"}`}
          style={{
            width: `${Math.min(100, Math.max(10, ((score - 300) / 600) * 100))}%`,
          }}
        />
      </div>

      {/* One-line reason (mandatory per spec) */}
      <p className="text-xs text-zinc-300 italic border-l-2 border-white/30 pl-2.5 py-0.5 mt-2">
        &ldquo;{reason}&rdquo;
      </p>
    </div>
  );
}
