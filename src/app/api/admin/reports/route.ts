import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { reports, posts, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const reportList = await db
      .select({
        id: reports.id,
        targetType: reports.targetType,
        targetId: reports.targetId,
        reason: reports.reason,
        status: reports.status,
        createdAt: reports.createdAt,
        reporterHandle: users.handle,
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .orderBy(desc(reports.createdAt))
      .all();

    // Enrich post reports with content
    const enriched = await Promise.all(
      reportList.map(async (r) => {
        let content = "";
        if (r.targetType === "post") {
          const post = await db.select().from(posts).where(eq(posts.id, r.targetId)).get();
          content = post ? post.body : "[Deleted post]";
        }
        return { ...r, content };
      })
    );

    return NextResponse.json(enriched);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { reportId, action } = body; // action: 'dismiss' | 'hide_content'

    const report = await db.select().from(reports).where(eq(reports.id, reportId)).get();
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);

    if (action === "hide_content" && report.targetType === "post") {
      await db.update(posts).set({ hiddenAt: now }).where(eq(posts.id, report.targetId));
    }

    await db
      .update(reports)
      .set({
        status: action === "dismiss" ? "dismissed" : "resolved",
        resolvedBy: admin.userId,
        resolvedAt: now,
      })
      .where(eq(reports.id, reportId));

    return NextResponse.json({ success: true, reportId, status: "resolved" });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
