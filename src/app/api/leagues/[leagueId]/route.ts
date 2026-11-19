import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { leagues, leagueMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { trackA } from "@/lib/track-a";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    const session = await getCurrentUser();

    const league = await db.select().from(leagues).where(eq(leagues.id, leagueId)).get();
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const isEnded = now >= league.endsAt;

    // Fetch members
    const members = await db
      .select({
        userId: users.id,
        handle: users.handle,
        displayName: users.displayName,
        hostel: users.hostel,
        joinedAt: leagueMembers.joinedAt,
      })
      .from(leagueMembers)
      .innerJoin(users, eq(leagueMembers.userId, users.id))
      .where(eq(leagueMembers.leagueId, leagueId))
      .all();

    // Fetch Cred Scores for each member
    const leaderboard = await Promise.all(
      members.map(async (m) => {
        const cred = await trackA.getCredScore(m.userId, leagueId);
        const portfolio = await trackA.getPortfolio(m.userId);
        return {
          userId: m.userId,
          handle: m.handle,
          displayName: m.displayName,
          hostel: m.hostel,
          score: cred.score,
          rangeLow: cred.rangeLow,
          rangeHigh: cred.rangeHigh,
          oneLineReason: cred.oneLineReason,
          portfolioValue: portfolio.totalValue,
          totalUnrealizedPnlPercent: portfolio.totalUnrealizedPnlPercent,
          isCurrentUser: session ? session.userId === m.userId : false,
        };
      })
    );

    // Rank by Cred Score descending
    leaderboard.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      league: {
        ...league,
        isEnded,
        status: isEnded ? "completed" : league.status,
      },
      leaderboard: leaderboard.map((item, idx) => ({
        rank: idx + 1,
        ...item,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
