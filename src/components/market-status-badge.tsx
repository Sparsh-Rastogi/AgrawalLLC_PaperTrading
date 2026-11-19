"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";

interface MarketStatusBadgeProps {
  initialStatus?: "open" | "closed" | "halted";
  className?: string;
}

export function MarketStatusBadge({
  initialStatus = "open",
  className = "",
}: MarketStatusBadgeProps) {
  const [status, setStatus] = useState<"open" | "closed" | "halted">(initialStatus);
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/market/status");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setStatus(data.status);
            setIsDelayed(false);
          }
        } else {
          if (mounted) setIsDelayed(true);
        }
      } catch {
        if (mounted) setIsDelayed(true);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Check every 15s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isDelayed) {
    return (
      <Badge variant="default" size="sm" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        Delayed Feed
      </Badge>
    );
  }

  if (status === "open") {
    return (
      <Badge variant="success" size="sm" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 -ml-2.5" />
        Live NSE
      </Badge>
    );
  }

  if (status === "halted") {
    return (
      <Badge variant="danger" size="sm" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Market Halted
      </Badge>
    );
  }

  return (
    <Badge variant="default" size="sm" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
      Closed
    </Badge>
  );
}
