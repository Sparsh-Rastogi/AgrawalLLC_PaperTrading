"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: number;
  reporterHandle?: string;
  content?: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Reports error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (reportId: string, action: "dismiss" | "hide_content") => {
    setActionLoading(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r))
        );
      }
    } catch (err) {
      console.error("Report resolve error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Moderation Queue</h1>
          <p className="text-xs text-zinc-400">
            Posts reported by students (auto-hidden if &gt;= 3 reports)
          </p>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          {pendingReports.length} pending review
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-zinc-500">Loading moderation queue...</div>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-500 bg-transparent border-dashed border-[#282a44]">
          Zero reports in queue. Campus feed is clean.
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card
              key={r.id}
              className={`p-4 space-y-3 ${
                r.status === "pending"
                  ? "bg-[#121320] border-[#25283c]"
                  : "bg-[#0f1019] border-[#1d1f2e] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" size="sm">
                      Target: {r.targetType.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-zinc-400 font-mono">
                      Reported by @{r.reporterHandle || "anonymous"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-rose-300 mt-1">
                    Reason: {r.reason}
                  </p>
                </div>

                <Badge variant={r.status === "pending" ? "danger" : "default"} size="sm">
                  {r.status}
                </Badge>
              </div>

              {r.content && (
                <div className="p-3 rounded-xl bg-[#171827] border border-[#26283d] text-xs text-zinc-300 whitespace-pre-wrap">
                  "{r.content}"
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2134]">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolve(r.id, "dismiss")}
                    disabled={actionLoading === r.id}
                  >
                    Dismiss Report
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleResolve(r.id, "hide_content")}
                    isLoading={actionLoading === r.id}
                  >
                    Confirm & Hide Post
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
