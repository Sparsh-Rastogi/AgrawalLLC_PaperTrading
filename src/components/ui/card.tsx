import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
}

export function Card({
  children,
  className = "",
  variant = "default",
  ...props
}: CardProps) {
  const variantStyles = {
    default:
      "glass-panel border border-white/10 shadow-lg shadow-black/60",
    elevated:
      "glass-panel-elevated border border-white/15 shadow-2xl shadow-black/80",
    interactive:
      "glass-panel border border-white/10 hover:border-white/30 hover:shadow-white/5 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.99]",
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 text-white ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

