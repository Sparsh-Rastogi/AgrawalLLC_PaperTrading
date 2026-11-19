import React from "react";
import { getCurrentUser } from "@/lib/auth/server";
import { trackA } from "@/lib/track-a";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const userId = user?.userId || "demo-user";

  const [portfolio, credScore, orders] = await Promise.all([
    trackA.getPortfolio(userId),
    trackA.getCredScore(userId),
    trackA.getOrderHistory(userId),
  ]);

  return (
    <ProfileClient
      user={user}
      portfolio={portfolio}
      credScore={credScore}
      orders={orders}
    />
  );
}
