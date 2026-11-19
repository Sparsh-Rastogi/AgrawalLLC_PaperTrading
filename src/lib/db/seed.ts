import { db } from "./index";
import {
  users,
  leagues,
  leagueMembers,
  watchlists,
  watchlistItems,
  posts,
  postTickers,
  reactions,
  events,
  bugReports,
} from "./schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { trackA } from "../track-a/index";

async function seed() {
  console.log("🌱 Starting StreetCred seed...");
  const now = Math.floor(Date.now() / 1000);
  const daySecs = 86400;

  // 1. Seed Users (IIT BHU students across hostels)
  const seedUsers = [
    {
      email: "admin@itbhu.ac.in",
      handle: "sparsh_admin",
      displayName: "Sparsh Agrawal",
      hostel: "Rajputana",
      role: "admin",
    },
    {
      email: "aarav.cse23@itbhu.ac.in",
      handle: "aarav_alpha",
      displayName: "Aarav Sharma",
      hostel: "Limbdi",
      role: "user",
    },
    {
      email: "priya.ece23@itbhu.ac.in",
      handle: "priya_trades",
      displayName: "Priya Singh",
      hostel: "SC Dey",
      role: "user",
    },
    {
      email: "rohit.mec24@itbhu.ac.in",
      handle: "rohit_quant",
      displayName: "Rohit Patel",
      hostel: "Morvi",
      role: "user",
    },
    {
      email: "ananya.che23@itbhu.ac.in",
      handle: "ananya_bhu",
      displayName: "Ananya Roy",
      hostel: "Aryabhata",
      role: "user",
    },
    {
      email: "dev.eee22@itbhu.ac.in",
      handle: "dev_bull",
      displayName: "Devendra Verma",
      hostel: "Dhanrajgiri",
      role: "user",
    },
  ];

  const createdUserIds: string[] = [];

  for (const u of seedUsers) {
    const existing = await db.select().from(users).where(eq(users.email, u.email)).get();
    let uid = existing?.id;

    if (!existing) {
      uid = uuidv4();
      await db.insert(users).values({
        id: uid,
        email: u.email,
        emailVerifiedAt: now - 3 * daySecs,
        handle: u.handle,
        displayName: u.displayName,
        hostel: u.hostel,
        role: u.role,
        status: "active",
        createdAt: now - 5 * daySecs,
        updatedAt: now,
      });

      // Ensure Track A account
      await trackA.ensureTradingAccount(uid);

      // Create initial watchlist
      const wlId = uuidv4();
      await db.insert(watchlists).values({
        id: wlId,
        userId: uid,
        name: "Default",
        createdAt: now,
      });

      const initialTickers = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS"];
      for (let i = 0; i < initialTickers.length; i++) {
        await db.insert(watchlistItems).values({
          id: uuidv4(),
          watchlistId: wlId,
          ticker: initialTickers[i],
          position: i,
          addedAt: now,
        });
      }

      // Add analytics event
      await db.insert(events).values({
        id: uuidv4(),
        userId: uid,
        name: "sign_up",
        props: JSON.stringify({ email: u.email, hostel: u.hostel }),
        ts: now - 5 * daySecs,
      });
      await db.insert(events).values({
        id: uuidv4(),
        userId: uid,
        name: "first_order",
        props: JSON.stringify({ ticker: "RELIANCE", side: "buy" }),
        ts: now - 4 * daySecs,
      });
      for (let j = 0; j < 5; j++) {
        await db.insert(events).values({
          id: uuidv4(),
          userId: uid,
          name: "order_result",
          props: JSON.stringify({ ticker: initialTickers[j % initialTickers.length], status: "filled" }),
          ts: now - Math.floor((4 - j * 0.5) * daySecs),
        });
      }
    }
    if (uid) createdUserIds.push(uid);
  }

  // 2. Seed Leagues (Hostel Cup & Campus Championship)
  const adminId = createdUserIds[0];
  const league1Id = uuidv4();
  const league2Id = uuidv4();

  const existingLg = await db.select().from(leagues).all();
  if (existingLg.length === 0) {
    await db.insert(leagues).values({
      id: league1Id,
      name: "IIT BHU Hostel Championship",
      type: "hostel",
      ownerId: adminId,
      startsAt: now - 2 * daySecs,
      endsAt: now + 12 * daySecs, // 14-day league
      startingCash: 1000000, // 10 Lakh INR
      inviteCode: "HOSTEL26",
      status: "active",
      createdAt: now - 2 * daySecs,
    });

    await db.insert(leagues).values({
      id: league2Id,
      name: "Club Alpha Traders 2026",
      type: "club",
      ownerId: adminId,
      startsAt: now - 1 * daySecs,
      endsAt: now + 13 * daySecs,
      startingCash: 1000000,
      inviteCode: "ALPHA26",
      status: "active",
      createdAt: now - 1 * daySecs,
    });

    // Add members to league
    for (const uid of createdUserIds) {
      await db.insert(leagueMembers).values({
        id: uuidv4(),
        leagueId: league1Id,
        userId: uid,
        joinedAt: now - 2 * daySecs,
      });
      await db.insert(events).values({
        id: uuidv4(),
        userId: uid,
        name: "league_join",
        props: JSON.stringify({ leagueId: league1Id }),
        ts: now - 2 * daySecs,
      });
    }
  }

  // 3. Seed Posts & Feed
  const existingPosts = await db.select().from(posts).all();
  if (existingPosts.length === 0) {
    const postItems = [
      {
        authorIdx: 1,
        body: "Strong support bounce on Reliance at 2,950 levels. Expecting a target of 3,100 with strict stop-loss. Clean risk-reward.",
        ticker: "RELIANCE",
        sentiment: "bullish" as const,
      },
      {
        authorIdx: 2,
        body: "IT sector facing temporary headwinds from rate uncertainty, but INFY margin expansion in Q3 looks resilient. Adding in tranches.",
        ticker: "INFY",
        sentiment: "bullish" as const,
      },
      {
        authorIdx: 3,
        body: "Banking indices looking stretched near ATH. Taking partial profits on HDFC Bank to hedge portfolio drawdown.",
        ticker: "HDFCBANK",
        sentiment: "bearish" as const,
      },
    ];

    for (const p of postItems) {
      const pid = uuidv4();
      const aid = createdUserIds[p.authorIdx] || adminId;
      await db.insert(posts).values({
        id: pid,
        authorId: aid,
        body: p.body,
        createdAt: now - 3600 * (p.authorIdx + 1),
        updatedAt: now,
        hiddenAt: null,
        reportCount: 0,
      });
      await db.insert(postTickers).values({
        id: uuidv4(),
        postId: pid,
        ticker: p.ticker,
        sentiment: p.sentiment,
      });
      await db.insert(reactions).values({
        id: uuidv4(),
        postId: pid,
        userId: adminId,
        type: "like",
        createdAt: now,
      });
    }
  }

  // 4. Seed Bug Reports for Admin triage demonstration
  const existingBugs = await db.select().from(bugReports).all();
  if (existingBugs.length === 0) {
    await db.insert(bugReports).values({
      id: uuidv4(),
      userId: createdUserIds[1] || adminId,
      route: "/markets/INFY",
      description: "Chart timeframe switch from 1D to 1Y had a minor 500ms flicker on iOS Safari.",
      severity: "low",
      appVersion: "0.1.0",
      status: "resolved",
      createdAt: now - 86400,
      resolvedAt: now - 3600,
    });

    await db.insert(bugReports).values({
      id: uuidv4(),
      userId: createdUserIds[2] || adminId,
      route: "/markets/TATAMOTORS",
      description: "Order ticket limit price step should increment in multiples of ₹0.05 ticks.",
      severity: "medium",
      appVersion: "0.1.0",
      status: "open",
      createdAt: now - 1800,
      resolvedAt: null,
    });
  }

  console.log("✅ StreetCred seed completed successfully!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
