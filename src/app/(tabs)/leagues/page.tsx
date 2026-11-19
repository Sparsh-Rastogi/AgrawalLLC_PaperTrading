"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface LeagueItem {
  id: string;
  name: string;
  type: "hostel" | "club" | "campus";
  startsAt: number;
  endsAt: number;
  startingCash: number;
  inviteCode: string;
  status: string;
  isJoined: boolean;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Join form
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [type, setType] = useState<"hostel" | "club" | "campus">("hostel");
  const [durationDays, setDurationDays] = useState(14);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchLeagues = async () => {
    try {
      const res = await fetch("/api/leagues");
      if (res.ok) {
        const data = await res.json();
        setLeagues(data);
      }
    } catch (err) {
      console.error("Failed to load leagues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    setIsJoining(true);

    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join league");
      }

      setIsJoinOpen(false);
      setInviteCode("");
      fetchLeagues();
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setIsCreating(true);

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, durationDays }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create league");
      }

      setIsCreateOpen(false);
      setName("");
      fetchLeagues();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Competitions</h1>
          <p className="text-xs text-zinc-400">
            Hostel & club trading leagues ranked by Cred Score
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsJoinOpen(true)}>
            Enter Code
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            + Create
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-zinc-500">Loading leagues...</div>
      ) : leagues.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-transparent border-dashed border-white/10">
          <div className="text-3xl">🏆</div>
          <h3 className="text-sm font-bold text-white">No active leagues yet</h3>
          <p className="text-xs text-zinc-400">
            Create a hostel or club league and share the invite code with your batchmates.
          </p>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Create First League
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leagues.map((lg) => {
            const now = Math.floor(Date.now() / 1000);
            const isEnded = now >= lg.endsAt;
            const daysLeft = Math.max(0, Math.ceil((lg.endsAt - now) / 86400));

            return (
              <Card
                key={lg.id}
                className="glass-panel border border-white/10 hover:border-white/30 hover:shadow-white/5 hover:shadow-xl transition-all p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{lg.name}</h3>
                      <Badge
                        variant={
                          lg.type === "hostel"
                            ? "info"
                            : lg.type === "campus"
                            ? "success"
                            : "default"
                        }
                        size="sm"
                      >
                        {lg.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Starting capital: ₹{(lg.startingCash / 100000).toFixed(0)} Lakhs · Invite:{" "}
                      <code className="text-white font-mono font-bold">{lg.inviteCode}</code>
                    </p>
                  </div>

                  <Badge variant={isEnded ? "default" : "success"} size="sm">
                    {isEnded ? "Concluded (Frozen)" : `${daysLeft}d left`}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-[#1f2134] flex items-center justify-between">
                  <div className="text-xs text-zinc-500">
                    Ranked by Cred Score · Zero-sum PnL excluded
                  </div>

                  <Link href={`/leagues/${lg.id}`}>
                    <Button variant="secondary" size="sm">
                      {lg.isJoined ? "View Leaderboard →" : "View & Join →"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Join League Modal */}
      <Modal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} title="Join League">
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="League Invite Code"
            placeholder="e.g. BHU2026X"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            helper="Ask your hostel captain or club lead for the 8-character code"
            required
            autoFocus
          />

          {joinError && <p className="text-xs text-rose-400">{joinError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsJoinOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isJoining}>
              Join Competition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create League Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New League">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Competition Name"
            placeholder="e.g. Rajputana Bulls League"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Competition Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["hostel", "club", "campus"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-colors ${
                    type === t
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Duration
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value))}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40"
            >
              <option value={7}>1 Week (Sprint)</option>
              <option value={14}>2 Weeks (Official Track B League)</option>
              <option value={30}>1 Month (Championship)</option>
            </select>
          </div>

          {createError && <p className="text-xs text-rose-400">{createError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create League
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
