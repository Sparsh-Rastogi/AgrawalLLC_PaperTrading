import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { leagues, leagueMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { trackA } from "@/lib/track-a";
import { logEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawCode = body.inviteCode;
    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    const inviteCode = rawCode.trim().toUpperCase();

    const league = await db
      .select()
      .from(leagues)
      .where(eq(leagues.inviteCode, inviteCode))
      .get();

    if (!league) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now >= league.endsAt) {
      return NextResponse.json(
        { error: "This league has concluded. Rankings are frozen." },
        { status: 400 }
      );
    }

    // Check if already member
    const existing = await db
      .select()
      .from(leagueMembers)
      .where(and(eq(leagueMembers.leagueId, league.id), eq(leagueMembers.userId, session.userId)))
      .get();

    if (existing) {
      return NextResponse.json({
        message: "You are already a member of this league",
        leagueId: league.id,
      });
    }

    // Join
    await db.insert(leagueMembers).values({
      id: uuidv4(),
      leagueId: league.id,
      userId: session.userId,
      joinedAt: now,
    });

    // Ensure trading account in Track A for this league
    await trackA.ensureTradingAccount(session.userId, league.id);

    await logEvent("league_join", { leagueId: league.id, inviteCode }, session.userId);

    return NextResponse.json({
      success: true,
      message: `Joined ${league.name}`,
      leagueId: league.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
