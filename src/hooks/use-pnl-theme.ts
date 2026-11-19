"use client";

import { useEffect, useState } from "react";

export function usePnLTheme(unrealizedPnlPercent: number = 0) {
  const [neutralMode, setNeutralMode] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("streetcred-neutral-theme") === "true";
    if (saved) {
      setNeutralMode(true);
    }
  }, []);

  const toggleNeutralMode = () => {
    const next = !neutralMode;
    setNeutralMode(next);
    localStorage.setItem("streetcred-neutral-theme", String(next));
  };

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (neutralMode) {
      // Accessible neutral gray theme
      root.style.setProperty("--pnl-color", "#9496b0");
      root.style.setProperty("--pnl-bg", "rgba(148, 150, 176, 0.05)");
      return;
    }

    // Clamped between -10% and +10%
    const clampedPercent = Math.max(-10, Math.min(10, unrealizedPnlPercent));

    if (clampedPercent > 0) {
      // Emerald green scale: hue 142
      const intensity = Math.min(1, clampedPercent / 5);
      const bgOpacity = 0.04 + intensity * 0.08;
      root.style.setProperty("--pnl-color", "#10b981");
      root.style.setProperty("--pnl-bg", `rgba(16, 185, 129, ${bgOpacity.toFixed(2)})`);
    } else if (clampedPercent < 0) {
      // Rose red scale: hue 350
      const intensity = Math.min(1, Math.abs(clampedPercent) / 5);
      const bgOpacity = 0.04 + intensity * 0.08;
      root.style.setProperty("--pnl-color", "#f43f5e");
      root.style.setProperty("--pnl-bg", `rgba(244, 63, 94, ${bgOpacity.toFixed(2)})`);
    } else {
      // Flat neutral
      root.style.setProperty("--pnl-color", "#9496b0");
      root.style.setProperty("--pnl-bg", "transparent");
    }
  }, [unrealizedPnlPercent, neutralMode]);

  return { neutralMode, toggleNeutralMode };
}
