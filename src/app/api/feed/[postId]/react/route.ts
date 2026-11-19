import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { reactions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postId } = await params;
    const existing = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, session.userId)))
      .get();

    if (existing) {
      // Toggle off
      await db
        .delete(reactions)
        .where(and(eq(reactions.postId, postId), eq(reactions.userId, session.userId)));
      return NextResponse.json({ liked: false });
    } else {
      // Add reaction
      await db.insert(reactions).values({
        id: uuidv4(),
        postId,
        userId: session.userId,
        type: "like",
        createdAt: Math.floor(Date.now() / 1000),
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
