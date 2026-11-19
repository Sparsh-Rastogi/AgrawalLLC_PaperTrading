import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bugReports } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
    const bugs = await db.select().from(bugReports).orderBy(desc(bugReports.createdAt)).all();
    return NextResponse.json(bugs);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { bugId, status } = body; // 'open' | 'investigating' | 'resolved'

    if (!bugId || !["open", "investigating", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid bugId or status" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    await db
      .update(bugReports)
      .set({
        status,
        resolvedAt: status === "resolved" ? now : null,
      })
      .where(eq(bugReports.id, bugId));

    return NextResponse.json({ success: true, bugId, status });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
