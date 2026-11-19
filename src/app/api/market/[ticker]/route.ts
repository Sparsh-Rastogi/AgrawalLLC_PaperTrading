import { NextResponse } from "next/server";
import { trackA } from "@/lib/track-a";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const quote = await trackA.getQuote(ticker);
    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
