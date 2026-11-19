import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { posts, postTickers, users, reactions } from "@/lib/db/schema";
import { eq, desc, isNull, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await getCurrentUser();

  // Fetch only non-hidden posts
  const feedPosts = await db
    .select({
      id: posts.id,
      body: posts.body,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorHandle: users.handle,
      authorHostel: users.hostel,
      reportCount: posts.reportCount,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(isNull(posts.hiddenAt))
    .orderBy(desc(posts.createdAt))
    .limit(50)
    .all();

  // Fetch tickers and reactions for each post
  const enriched = await Promise.all(
    feedPosts.map(async (p) => {
      const tickers = await db
        .select({
          ticker: postTickers.ticker,
          sentiment: postTickers.sentiment,
        })
        .from(postTickers)
        .where(eq(postTickers.postId, p.id))
        .all();

      const reactionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(reactions)
        .where(eq(reactions.postId, p.id))
        .get();

      let hasLiked = false;
      if (session) {
        const myReaction = await db
          .select()
          .from(reactions)
          .where(sql`${reactions.postId} = ${p.id} AND ${reactions.userId} = ${session.userId}`)
          .get();
        hasLiked = !!myReaction;
      }

      return {
        ...p,
        tickers,
        likesCount: reactionCount?.count || 0,
        hasLiked,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content, ticker, sentiment } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Post body cannot be empty" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    const postId = uuidv4();

    await db.insert(posts).values({
      id: postId,
      authorId: session.userId,
      body: content.trim(),
      createdAt: now,
      updatedAt: now,
      hiddenAt: null,
      reportCount: 0,
    });

    if (ticker && ticker.trim()) {
      await db.insert(postTickers).values({
        id: uuidv4(),
        postId,
        ticker: ticker.trim().toUpperCase(),
        sentiment: sentiment || "neutral",
      });
    }

    return NextResponse.json({ success: true, postId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
