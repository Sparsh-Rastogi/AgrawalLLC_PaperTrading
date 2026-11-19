import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bugReports } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { route, description, severity, appVersion } = body;

    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    const bugId = uuidv4();

    await db.insert(bugReports).values({
      id: bugId,
      userId: session?.userId || null,
      route: route || "/",
      description: description.trim(),
      severity: severity || "medium",
      appVersion: appVersion || "0.1.0",
      status: "open",
      createdAt: now,
      resolvedAt: null,
    });

    return NextResponse.json({ success: true, id: bugId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
