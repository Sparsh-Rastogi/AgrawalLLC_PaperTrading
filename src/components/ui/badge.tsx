import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "info" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  children,
  className = "",
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-white/10 text-white border border-white/15",
    success: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60",
    danger: "bg-rose-950/60 text-rose-400 border border-rose-800/60",
    warning: "bg-white/10 text-white border border-white/20",
    info: "bg-white/10 text-white border border-white/20",
    neutral: "bg-zinc-900 text-zinc-300 border border-zinc-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-lg ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
