"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminBug {
  id: string;
  route: string;
  description: string;
  appVersion: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved";
  createdAt: number;
  resolvedAt?: number;
}

export default function AdminBugsPage() {
  const [bugs, setBugs] = useState<AdminBug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBugs = async () => {
    try {
      const res = await fetch("/api/admin/bugs");
      if (res.ok) {
        const data = await res.json();
        setBugs(data);
      }
    } catch (err) {
      console.error("Bugs fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, []);

  const handleUpdateStatus = async (bugId: string, status: "open" | "investigating" | "resolved") => {
    setUpdatingId(bugId);
    try {
      const res = await fetch("/api/admin/bugs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bugId, status }),
      });
      if (res.ok) {
        setBugs((prev) =>
          prev.map((b) => (b.id === bugId ? { ...b, status } : b))
        );
      }
    } catch (err) {
      console.error("Bug update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Bug Triage Loop</h1>
          <p className="text-xs text-zinc-400">
            Same-day fixes during beta · Target: &lt;24 hour turnaround for critical bugs
          </p>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          {bugs.filter((b) => b.status === "open").length} open issues
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-zinc-500">Loading bug reports...</div>
      ) : bugs.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-500 bg-transparent border-dashed border-[#282a44]">
          Zero bugs reported. Everything operational!
        </Card>
      ) : (
        <div className="space-y-3">
          {bugs.map((bug) => {
            const isResolved = bug.status === "resolved";

            return (
              <Card
                key={bug.id}
                className={`p-4 space-y-3 ${
                  isResolved
                    ? "bg-black/40 border-white/5 opacity-60"
                    : "glass-panel border border-white/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          bug.severity === "critical"
                            ? "danger"
                            : bug.severity === "high"
                            ? "warning"
                            : "default"
                        }
                        size="sm"
                      >
                        {bug.severity.toUpperCase()}
                      </Badge>

                      <code className="text-xs text-white/80 font-mono">
                        {bug.route}
                      </code>

                      <span className="text-[10px] text-zinc-500 font-mono">
                        v{bug.appVersion}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-200 mt-2 font-medium">
                      {bug.description}
                    </p>
                  </div>

                  <Badge
                    variant={
                      bug.status === "resolved"
                        ? "success"
                        : bug.status === "investigating"
                        ? "warning"
                        : "default"
                    }
                    size="sm"
                  >
                    {bug.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1f2134] text-xs">
                  <span suppressHydrationWarning className="text-zinc-500 font-mono">
                    Reported {new Date(bug.createdAt * 1000).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>

                  <div className="flex gap-2">
                    {bug.status !== "investigating" && bug.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateStatus(bug.id, "investigating")}
                        isLoading={updatingId === bug.id}
                      >
                        Mark Investigating
                      </Button>
                    )}

                    {bug.status !== "resolved" ? (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleUpdateStatus(bug.id, "resolved")}
                        isLoading={updatingId === bug.id}
                      >
                        Resolve & Close
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(bug.id, "open")}
                        isLoading={updatingId === bug.id}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
