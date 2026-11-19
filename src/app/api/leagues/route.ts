import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { leagues, leagueMembers, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";
import { logEvent } from "@/lib/analytics";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all leagues and identify which ones user joined
  const allLeagues = await db.select().from(leagues).orderBy(desc(leagues.createdAt)).all();
  const joinedMemberships = await db
    .select()
    .from(leagueMembers)
    .where(eq(leagueMembers.userId, session.userId))
    .all();

  const joinedIds = new Set(joinedMemberships.map((m) => m.leagueId));

  const result = allLeagues.map((l) => ({
    ...l,
    isJoined: joinedIds.has(l.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, type, durationDays } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "League name is required" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    const duration = (parseInt(durationDays) || 14) * 86400; // 14 days default per spec
    const leagueId = uuidv4();
    const inviteCode = nanoid(8).toUpperCase();

    await db.insert(leagues).values({
      id: leagueId,
      name: name.trim(),
      type: type || "hostel",
      ownerId: session.userId,
      startsAt: now,
      endsAt: now + duration,
      startingCash: 1000000,
      inviteCode,
      status: "active",
      createdAt: now,
    });

    // Automatically join creator into the league
    await db.insert(leagueMembers).values({
      id: uuidv4(),
      leagueId,
      userId: session.userId,
      joinedAt: now,
    });

    await logEvent("league_join", { leagueId, inviteCode, isCreator: true }, session.userId);

    return NextResponse.json({ success: true, leagueId, inviteCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
