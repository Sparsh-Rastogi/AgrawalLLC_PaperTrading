import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
  if (!user || user.status === "suspended") {
    return NextResponse.json({ user: null, error: "Suspended or not found" }, { status: 403 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      handle: user.handle,
      displayName: user.displayName,
      hostel: user.hostel,
      role: user.role,
      status: user.status,
    },
  });
}
