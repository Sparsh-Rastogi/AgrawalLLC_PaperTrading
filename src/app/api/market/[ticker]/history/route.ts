import { NextResponse } from "next/server";
import { trackA } from "@/lib/track-a";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const { searchParams } = new URL(req.url);
    const interval = (searchParams.get("interval") || "1D") as
      | "1D"
      | "1W"
      | "1M"
      | "3M"
      | "6M"
      | "1Y";

    const history = await trackA.getPriceHistory(ticker, interval);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
