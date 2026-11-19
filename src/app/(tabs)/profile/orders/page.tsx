import React from "react";
import { getCurrentUser } from "@/lib/auth/server";
import { trackA } from "@/lib/track-a";
import { OrdersHistoryClient } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function OrderHistoryPage() {
  const user = await getCurrentUser();
  const userId = user?.userId || "demo-user";
  const orders = await trackA.getOrderHistory(userId);

  return <OrdersHistoryClient initialOrders={orders} />;
}
