import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { reports, posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
    const body = await req.json();
    const reason = body.reason || "Reported for community guidelines violation";

    const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const newCount = post.reportCount + 1;

    // Insert report into moderation queue
    await db.insert(reports).values({
      id: uuidv4(),
      reporterId: session.userId,
      targetType: "post",
      targetId: postId,
      reason,
      status: "pending",
      createdAt: now,
    });

    // Auto-hide if 3 or more reports
    const shouldHide = newCount >= 3;

    await db
      .update(posts)
      .set({
        reportCount: newCount,
        hiddenAt: shouldHide ? now : post.hiddenAt,
      })
      .where(eq(posts.id, postId));

    return NextResponse.json({
      success: true,
      reported: true,
      hidden: shouldHide,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
