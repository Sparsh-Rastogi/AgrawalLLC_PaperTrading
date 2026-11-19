"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
  id: string;
  email: string;
  handle: string;
  displayName?: string;
  hostel?: string;
  role: string;
  status: "active" | "suspended";
  createdAt: number;
  tradeCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Users error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: "active" | "suspended") => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const confirmPrompt = confirm(`Are you sure you want to ${nextStatus} this student account?`);
    if (!confirmPrompt) return;

    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.handle.toLowerCase().includes(search.toLowerCase()) ||
      (u.hostel && u.hostel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Verified Students</h1>
          <p className="text-xs text-zinc-400">
            One-person-one-account audit and 5-trade league progress
          </p>
        </div>

        <Input
          placeholder="Filter by email, handle, hostel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 bg-white/[0.04] border-white/10"
        />
      </div>

      <Card className="glass-panel border border-white/10 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Student / Handle</th>
                <th className="p-3.5">Email (@itbhu.ac.in)</th>
                <th className="p-3.5">Hostel</th>
                <th className="p-3.5">Trades (Goal: 5)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-zinc-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">
                    Loading student list...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">
                    No matching students found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const needsNudge = u.tradeCount < 5;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{u.handle}</div>
                        <div className="text-[10px] text-zinc-500">ID: {u.id.slice(0, 8)}...</div>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-300">{u.email}</td>
                      <td className="p-3.5 text-zinc-400">{u.hostel || "Campus"}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            needsNudge
                              ? "bg-white/10 text-zinc-300 border border-white/20"
                              : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                          }`}
                        >
                          {u.tradeCount} / 5 trades
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge variant={u.status === "active" ? "success" : "danger"} size="sm">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant={u.status === "active" ? "danger" : "outline"}
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          isLoading={actionLoading === u.id}
                        >
                          {u.status === "active" ? "Suspend" : "Unsuspend"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
