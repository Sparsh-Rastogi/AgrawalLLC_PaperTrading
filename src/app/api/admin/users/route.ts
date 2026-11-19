import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users, events } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const userList = await db.select().from(users).orderBy(desc(users.createdAt)).all();

    // Enrich with trade counts
    const enriched = await Promise.all(
      userList.map(async (u) => {
        const trades = await db
          .select({ count: sql<number>`count(*)` })
          .from(events)
          .where(sql`user_id = ${u.id} AND name = 'order_result'`)
          .get();

        return {
          id: u.id,
          email: u.email,
          handle: u.handle,
          displayName: u.displayName,
          hostel: u.hostel,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
          tradeCount: trades?.count || 0,
        };
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
    await requireAdmin();
    const body = await req.json();
    const { userId, status } = body;

    if (!userId || !["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Invalid user or status" }, { status: 400 });
    }

    await db.update(users).set({ status }).where(eq(users.id, userId));
    return NextResponse.json({ success: true, userId, status });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
