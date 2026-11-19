"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OrderResponse } from "@/lib/track-a/schemas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function OrdersHistoryClient({
  initialOrders,
}: {
  initialOrders: OrderResponse[];
}) {
  const [orders, setOrders] = useState<OrderResponse[]>(initialOrders);
  const [filter, setFilter] = useState<"all" | "pending" | "filled" | "rejected">("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: "rejected", reason: "Cancelled by user" } : o))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/profile" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
            ← Profile
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">Order History</h1>
        </div>
        <span className="text-xs text-zinc-500 font-mono">{orders.length} orders total</span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1 bg-white/[0.04] rounded-xl border border-white/10">
        {(["all", "pending", "filled", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
              filter === f ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-500 bg-transparent border-dashed border-white/10">
          No orders found under {filter}.
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((ord) => (
            <Card key={ord.orderId} className="glass-panel border border-white/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                      ord.side === "buy"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-950/80 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {ord.side}
                  </span>
                  <span className="font-bold text-sm text-white">{ord.ticker}</span>
                  <Badge
                    variant={
                      ord.status === "filled"
                        ? "success"
                        : ord.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                  >
                    {ord.status}
                  </Badge>
                </div>

                <span suppressHydrationWarning className="text-[11px] text-zinc-500 font-mono">
                  {new Date(ord.createdAt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  {ord.quantity} shares · {ord.type}
                </span>
                <span className="text-white font-semibold">
                  ₹{(ord.filledPrice || ord.price).toFixed(2)}
                </span>
              </div>

              {ord.reason && (
                <div className="p-2 rounded-lg bg-red-950/40 border border-red-900/50 text-[11px] text-red-400">
                  Reason: {ord.reason}
                </div>
              )}

              {ord.status === "pending" && (
                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancel(ord.orderId)}
                    isLoading={cancellingId === ord.orderId}
                  >
                    Cancel Order
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
