import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const DB_PATH = path.join(process.cwd(), "streetcred.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

console.log("🌱 Starting seed via direct SQLite...");
const now = Math.floor(Date.now() / 1000);
const daySecs = 86400;

// Initialize tables if needed
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    email_verified_at INTEGER,
    handle TEXT NOT NULL UNIQUE,
    display_name TEXT,
    hostel TEXT,
    track_a_account_id TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leagues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    starts_at INTEGER NOT NULL,
    ends_at INTEGER NOT NULL,
    starting_cash INTEGER NOT NULL DEFAULT 1000000,
    invite_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS league_members (
    id TEXT PRIMARY KEY,
    league_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    UNIQUE(league_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS watchlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS watchlist_items (
    id TEXT PRIMARY KEY,
    watchlist_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    added_at INTEGER NOT NULL,
    UNIQUE(watchlist_id, ticker)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    hidden_at INTEGER,
    report_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS post_tickers (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    sentiment TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'like',
    created_at INTEGER NOT NULL,
    UNIQUE(post_id, user_id, type)
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    props TEXT,
    ts INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bug_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    route TEXT NOT NULL,
    description TEXT NOT NULL,
    app_version TEXT NOT NULL DEFAULT '0.1.0',
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL,
    resolved_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_by TEXT,
    resolved_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    payload TEXT,
    read_at INTEGER,
    created_at INTEGER NOT NULL
  );
`);

// 1. Seed Users
const seedUsers = [
  { email: "admin@itbhu.ac.in", handle: "sparsh_admin", name: "Sparsh Agrawal", hostel: "Rajputana", role: "admin" },
  { email: "aarav.cse23@itbhu.ac.in", handle: "aarav_alpha", name: "Aarav Sharma", hostel: "Limbdi", role: "user" },
  { email: "priya.ece23@itbhu.ac.in", handle: "priya_trades", name: "Priya Singh", hostel: "SC Dey", role: "user" },
  { email: "rohit.mec24@itbhu.ac.in", handle: "rohit_quant", name: "Rohit Patel", hostel: "Morvi", role: "user" },
  { email: "ananya.che23@itbhu.ac.in", handle: "ananya_bhu", name: "Ananya Roy", hostel: "Aryabhata", role: "user" },
  { email: "dev.eee22@itbhu.ac.in", handle: "dev_bull", name: "Devendra Verma", hostel: "Dhanrajgiri", role: "user" },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, email, email_verified_at, handle, display_name, hostel, role, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertWatchlist = db.prepare(`
  INSERT OR IGNORE INTO watchlists (id, user_id, name, created_at)
  VALUES (?, ?, ?, ?)
`);

const insertWatchlistItem = db.prepare(`
  INSERT OR IGNORE INTO watchlist_items (id, watchlist_id, ticker, position, added_at)
  VALUES (?, ?, ?, ?, ?)
`);

const insertEvent = db.prepare(`
  INSERT INTO events (id, user_id, name, props, ts)
  VALUES (?, ?, ?, ?, ?)
`);

const userIds = [];
for (const u of seedUsers) {
  let row = db.prepare("SELECT id FROM users WHERE email = ?").get(u.email);
  let uid = row ? row.id : uuidv4();

  if (!row) {
    insertUser.run(uid, u.email, now - 3 * daySecs, u.handle, u.name, u.hostel, u.role, "active", now - 5 * daySecs, now);

    const wlId = uuidv4();
    insertWatchlist.run(wlId, uid, "Default", now);

    const tickers = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS"];
    for (let i = 0; i < tickers.length; i++) {
      insertWatchlistItem.run(uuidv4(), wlId, tickers[i], i, now);
    }

    insertEvent.run(uuidv4(), uid, "sign_up", JSON.stringify({ email: u.email, hostel: u.hostel }), now - 5 * daySecs);
    insertEvent.run(uuidv4(), uid, "first_order", JSON.stringify({ ticker: "RELIANCE", side: "buy" }), now - 4 * daySecs);
    for (let j = 0; j < 5; j++) {
      insertEvent.run(uuidv4(), uid, "order_result", JSON.stringify({ ticker: tickers[j % tickers.length], status: "filled" }), now - (4 - j * 0.5) * daySecs);
    }
  }
  userIds.push(uid);
}

// 2. Seed Leagues
const adminId = userIds[0];
const league1Id = uuidv4();
const league2Id = uuidv4();

const existingLg = db.prepare("SELECT count(*) as count FROM leagues").get();
if (existingLg.count === 0) {
  const insertLeague = db.prepare(`
    INSERT INTO leagues (id, name, type, owner_id, starts_at, ends_at, starting_cash, invite_code, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLeague.run(league1Id, "IIT BHU Hostel Championship", "hostel", adminId, now - 2 * daySecs, now + 12 * daySecs, 1000000, "HOSTEL26", "active", now - 2 * daySecs);
  insertLeague.run(league2Id, "Club Alpha Traders 2026", "club", adminId, now - 1 * daySecs, now + 13 * daySecs, 1000000, "ALPHA26", "active", now - 1 * daySecs);

  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO league_members (id, league_id, user_id, joined_at)
    VALUES (?, ?, ?, ?)
  `);

  for (const uid of userIds) {
    insertMember.run(uuidv4(), league1Id, uid, now - 2 * daySecs);
    insertEvent.run(uuidv4(), uid, "league_join", JSON.stringify({ leagueId: league1Id }), now - 2 * daySecs);
  }
}

// 3. Seed Posts
const existingPosts = db.prepare("SELECT count(*) as count FROM posts").get();
if (existingPosts.count === 0) {
  const insertPost = db.prepare(`
    INSERT INTO posts (id, author_id, body, created_at, updated_at, hidden_at, report_count)
    VALUES (?, ?, ?, ?, ?, NULL, 0)
  `);
  const insertPostTicker = db.prepare(`
    INSERT INTO post_tickers (id, post_id, ticker, sentiment)
    VALUES (?, ?, ?, ?)
  `);

  const postsData = [
    { authorIdx: 1, body: "Strong support bounce on Reliance at 2,950 levels. Expecting a target of 3,100 with strict stop-loss. Clean risk-reward.", ticker: "RELIANCE", sentiment: "bullish" },
    { authorIdx: 2, body: "IT sector facing temporary headwinds from rate uncertainty, but INFY margin expansion in Q3 looks resilient. Adding in tranches.", ticker: "INFY", sentiment: "bullish" },
    { authorIdx: 3, body: "Banking indices looking stretched near ATH. Taking partial profits on HDFC Bank to hedge portfolio drawdown.", ticker: "HDFCBANK", sentiment: "bearish" }
  ];

  for (const p of postsData) {
    const pid = uuidv4();
    const aid = userIds[p.authorIdx] || adminId;
    insertPost.run(pid, aid, p.body, now - 3600 * (p.authorIdx + 1), now);
    insertPostTicker.run(uuidv4(), pid, p.ticker, p.sentiment);
  }
}

// 4. Seed Bug Reports
const existingBugs = db.prepare("SELECT count(*) as count FROM bug_reports").get();
if (existingBugs.count === 0) {
  const insertBug = db.prepare(`
    INSERT INTO bug_reports (id, user_id, route, description, app_version, severity, status, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBug.run(uuidv4(), userIds[1] || adminId, "/markets/INFY", "Chart timeframe switch from 1D to 1Y had a minor 500ms flicker on iOS Safari.", "0.1.0", "low", "resolved", now - 86400, now - 3600);
  insertBug.run(uuidv4(), userIds[2] || adminId, "/markets/TATAMOTORS", "Order ticket limit price step should increment in multiples of ₹0.05 ticks.", "0.1.0", "medium", "open", now - 1800, null);
}

console.log("✅ StreetCred SQLite seed completed successfully!");
