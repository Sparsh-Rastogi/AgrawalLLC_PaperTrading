import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { trackA } from "@/lib/track-a";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [credHistory, portfolio, benchmark] = await Promise.all([
      trackA.getCredScoreHistory(session.userId),
      trackA.getPortfolio(session.userId),
      trackA.getBenchmarkSeries("NIFTY50"),
    ]);

    // Compute sector diversification from Track A positions
    const sectorMap = new Map<string, number>();
    let totalPositionsValue = 0;

    for (const pos of portfolio.positions) {
      const sector = pos.sector || "Other";
      const current = sectorMap.get(sector) || 0;
      sectorMap.set(sector, current + pos.marketValue);
      totalPositionsValue += pos.marketValue;
    }

    // Add cash as an asset class
    if (portfolio.buyingPower > 0) {
      sectorMap.set("Cash & Reserves", portfolio.buyingPower);
      totalPositionsValue += portfolio.buyingPower;
    }

    const diversification = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value: Math.round(value * 100) / 100,
      percentage: totalPositionsValue > 0 ? Math.round((value / totalPositionsValue) * 1000) / 10 : 0,
    }));

    return NextResponse.json({
      credHistory,
      diversification,
      benchmark,
      portfolioSummary: {
        totalValue: portfolio.totalValue,
        totalUnrealizedPnlPercent: portfolio.totalUnrealizedPnlPercent,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
