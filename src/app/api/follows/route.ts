import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { follows } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId || targetUserId === session.userId) {
      return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, session.userId), eq(follows.followeeId, targetUserId)))
      .get();

    if (existing) {
      // Unfollow
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, session.userId), eq(follows.followeeId, targetUserId)));
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await db.insert(follows).values({
        id: uuidv4(),
        followerId: session.userId,
        followeeId: targetUserId,
        createdAt: Math.floor(Date.now() / 1000),
      });
      return NextResponse.json({ following: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
