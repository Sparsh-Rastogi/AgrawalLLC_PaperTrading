import React from "react";

interface PnLDisplayProps {
  value: number; // raw PnL in currency or absolute
  percent?: number; // optional percentage
  currency?: boolean; // format as INR ₹
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PnLDisplay({
  value,
  percent,
  currency = true,
  size = "md",
  className = "",
}: PnLDisplayProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isZero = value === 0;

  const sign = isPositive ? "+" : isNegative ? "−" : "";
  const arrow = isPositive ? "▲" : isNegative ? "▼" : "―";

  const colorClass = isPositive
    ? "text-emerald-400"
    : isNegative
    ? "text-rose-400"
    : "text-zinc-400";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm font-medium",
    lg: "text-base font-semibold",
    xl: "text-2xl font-bold tracking-tight",
  };

  const formattedAbs = Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono ${colorClass} ${sizeClasses[size]} ${className}`}
      aria-label={`${isPositive ? "Profit" : isNegative ? "Loss" : "Flat"} ${value}`}
    >
      <span className="text-[0.75em]" aria-hidden="true">
        {arrow}
      </span>
      <span>
        {sign}
        {currency ? "₹" : ""}
        {formattedAbs}
      </span>
      {percent !== undefined && (
        <span className="text-[0.85em] opacity-90">
          ({sign}
          {Math.abs(percent).toFixed(2)}%)
        </span>
      )}
    </span>
  );
}
