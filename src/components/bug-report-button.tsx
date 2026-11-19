"use client";

import React, { useState } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { usePathname } from "next/navigation";

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe what went wrong");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: pathname,
          description: description.trim(),
          severity,
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit bug report");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setDescription("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 sm:right-8 z-40 flex items-center gap-1.5 px-3 py-2 bg-black/80 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-semibold rounded-full border border-white/20 shadow-xl backdrop-blur-md transition-all active:scale-95"
        title="Report a bug"
      >
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="hidden xs:inline">Bug?</span>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Report a Bug">
        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h4 className="text-base font-bold text-white">Report Received</h4>
            <p className="text-xs text-zinc-400">
              Our engineering team fixes critical beta bugs within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs text-zinc-400 bg-white/[0.04] p-2.5 rounded-xl border border-white/10">
              <span className="font-semibold text-zinc-300">Auto-captured route:</span>{" "}
              <code className="text-white font-mono">{pathname}</code>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Severity
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["low", "medium", "high", "critical"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border capitalize transition-all ${
                      severity === lvl
                        ? lvl === "critical" || lvl === "high"
                          ? "bg-red-950/80 border-red-500 text-red-300"
                          : "bg-white text-black border-white"
                        : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                What happened?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bug, steps to reproduce, or unexpected behavior..."
                rows={4}
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Submit Bug Report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
