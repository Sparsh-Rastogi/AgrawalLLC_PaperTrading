import { NextResponse } from "next/server";
import { trackA } from "@/lib/track-a";

export async function GET() {
  try {
    const status = await trackA.getMarketStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
