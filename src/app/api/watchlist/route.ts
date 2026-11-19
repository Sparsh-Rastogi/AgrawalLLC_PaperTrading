import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { watchlists, watchlistItems } from "@/lib/db/schema";
import { eq, and, asc, count } from "drizzle-orm";
import { trackA } from "@/lib/track-a";
import { v4 as uuidv4 } from "uuid";
import { logEvent } from "@/lib/analytics";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create default watchlist
  let wl = await db.select().from(watchlists).where(eq(watchlists.userId, session.userId)).get();
  if (!wl) {
    const wlId = uuidv4();
    await db.insert(watchlists).values({
      id: wlId,
      userId: session.userId,
      name: "Default",
      createdAt: Math.floor(Date.now() / 1000),
    });
    wl = await db.select().from(watchlists).where(eq(watchlists.id, wlId)).get();
  }
  if (!wl) throw new Error("Failed to initialize watchlist");

  const items = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, wl.id))
    .orderBy(asc(watchlistItems.position))
    .all();

  const tickers = items.map((i) => i.ticker);
  const quotes = tickers.length > 0 ? await trackA.getQuotes(tickers) : [];

  return NextResponse.json({
    watchlistId: wl.id,
    items: items.map((item) => {
      const q = quotes.find((quote) => quote.ticker === item.ticker);
      return {
        id: item.id,
        ticker: item.ticker,
        position: item.position,
        addedAt: item.addedAt,
        quote: q || null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const rawTicker = body.ticker;
  if (!rawTicker || typeof rawTicker !== "string") {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  const ticker = rawTicker.trim().toUpperCase();

  // Get or create watchlist
  let wl = await db.select().from(watchlists).where(eq(watchlists.userId, session.userId)).get();
  if (!wl) {
    const wlId = uuidv4();
    await db.insert(watchlists).values({
      id: wlId,
      userId: session.userId,
      name: "Default",
      createdAt: Math.floor(Date.now() / 1000),
    });
    wl = await db.select().from(watchlists).where(eq(watchlists.id, wlId)).get();
  }
  if (!wl) throw new Error("Failed to initialize watchlist");

  // Check if ticker already exists
  const existing = await db
    .select()
    .from(watchlistItems)
    .where(and(eq(watchlistItems.watchlistId, wl.id), eq(watchlistItems.ticker, ticker)))
    .get();

  if (existing) {
    return NextResponse.json({ message: "Already in watchlist" });
  }

  // Check previous total count to know if this is first_watchlist_add
  const prevCount = await db
    .select({ val: count() })
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, wl.id))
    .get();

  const now = Math.floor(Date.now() / 1000);
  await db.insert(watchlistItems).values({
    id: uuidv4(),
    watchlistId: wl.id,
    ticker,
    position: (prevCount?.val || 0) + 1,
    addedAt: now,
  });

  if (!prevCount || prevCount.val === 0) {
    await logEvent("first_watchlist_add", { ticker }, session.userId);
  }

  return NextResponse.json({ success: true, ticker });
}

export async function DELETE(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.trim().toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  const wl = await db.select().from(watchlists).where(eq(watchlists.userId, session.userId)).get();
  if (wl) {
    await db
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.watchlistId, wl.id), eq(watchlistItems.ticker, ticker)));
  }

  return NextResponse.json({ success: true });
}
