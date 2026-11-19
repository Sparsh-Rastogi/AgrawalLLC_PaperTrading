import React from "react";
import { trackA } from "@/lib/track-a";
import { getCurrentUser } from "@/lib/auth/server";
import { TickerDetailClient } from "./ticker-client";

export const dynamic = "force-dynamic";

export default async function TickerDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  const user = await getCurrentUser();
  const userId = user?.userId || "demo-user";

  const [quote, history, marketStatus, portfolio] = await Promise.all([
    trackA.getQuote(upperTicker),
    trackA.getPriceHistory(upperTicker, "1D"),
    trackA.getMarketStatus(),
    trackA.getPortfolio(userId),
  ]);

  const existingPosition = portfolio.positions.find((p) => p.ticker === upperTicker);

  return (
    <TickerDetailClient
      ticker={upperTicker}
      initialQuote={quote}
      initialHistory={history}
      marketStatus={marketStatus}
      buyingPower={portfolio.buyingPower}
      existingPosition={existingPosition || null}
      userId={userId}
    />
  );
}
