import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// 1. Users
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // UUID
    email: text("email").notNull().unique(), // lowercased institute email
    emailVerifiedAt: integer("email_verified_at"), // timestamp
    handle: text("handle").notNull().unique(),
    displayName: text("display_name"),
    hostel: text("hostel"), // Limbdi, Rajputana, Morvi, Dhanrajgiri, etc.
    trackAAccountId: text("track_a_account_id"),
    role: text("role").notNull().default("user"), // 'user' | 'admin'
    status: text("status").notNull().default("active"), // 'active' | 'suspended'
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_handle").on(table.handle),
  ]
);

// 2. Email OTPs
export const emailOtps = sqliteTable(
  "email_otps",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: integer("consumed_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_email_otps_email").on(table.email)]
);

// 3. Leagues
export const leagues = sqliteTable(
  "leagues",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(), // 'hostel' | 'club' | 'campus'
    ownerId: text("owner_id").notNull(),
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    startingCash: integer("starting_cash").notNull().default(1000000), // in INR (10 lakh)
    inviteCode: text("invite_code").notNull().unique(),
    status: text("status").notNull().default("active"), // 'active' | 'completed' | 'frozen'
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_leagues_invite_code").on(table.inviteCode),
    index("idx_leagues_status").on(table.status),
  ]
);

// 4. League Members
export const leagueMembers = sqliteTable(
  "league_members",
  {
    id: text("id").primaryKey(),
    leagueId: text("league_id").notNull(),
    userId: text("user_id").notNull(),
    joinedAt: integer("joined_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_league_user").on(table.leagueId, table.userId),
    index("idx_league_members_user").on(table.userId),
  ]
);

// 5. Watchlists
export const watchlists = sqliteTable(
  "watchlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull().default("Default"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_watchlists_user").on(table.userId)]
);

// 6. Watchlist Items
export const watchlistItems = sqliteTable(
  "watchlist_items",
  {
    id: text("id").primaryKey(),
    watchlistId: text("watchlist_id").notNull(),
    ticker: text("ticker").notNull(),
    position: integer("position").notNull().default(0),
    addedAt: integer("added_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_watchlist_ticker").on(table.watchlistId, table.ticker),
  ]
);

// 7. Posts
export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id").notNull(),
    body: text("body").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    hiddenAt: integer("hidden_at"),
    reportCount: integer("report_count").notNull().default(0),
  },
  (table) => [
    index("idx_posts_author").on(table.authorId),
    index("idx_posts_created").on(table.createdAt),
  ]
);

// 8. Post Tickers
export const postTickers = sqliteTable(
  "post_tickers",
  {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull(),
    ticker: text("ticker").notNull(),
    sentiment: text("sentiment").notNull(), // 'bullish' | 'bearish' | 'neutral'
  },
  (table) => [
    index("idx_post_tickers_post").on(table.postId),
    index("idx_post_tickers_ticker").on(table.ticker),
  ]
);

// 9. Reactions
export const reactions = sqliteTable(
  "reactions",
  {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull(),
    userId: text("user_id").notNull(),
    type: text("type").notNull().default("like"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_user_post_reaction").on(table.postId, table.userId, table.type),
  ]
);

// 10. Follows
export const follows = sqliteTable(
  "follows",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id").notNull(),
    followeeId: text("followee_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_follower_followee").on(table.followerId, table.followeeId),
    index("idx_follows_followee").on(table.followeeId),
  ]
);

// 11. Notifications
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(), // 'fill' | 'call_scored' | 'followed_trade' | 'league_invite' | 'system'
    title: text("title").notNull(),
    message: text("message").notNull(),
    payload: text("payload"), // JSON
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId),
    index("idx_notifications_created").on(table.createdAt),
  ]
);

// 12. Push Subscriptions
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    keys: text("keys").notNull(), // JSON
    lastSeenAt: integer("last_seen_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_push_subs_user").on(table.userId)]
);

// 13. Reports (Moderation queue)
export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id").notNull(),
    targetType: text("target_type").notNull(), // 'post' | 'user'
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("pending"), // 'pending' | 'resolved' | 'dismissed'
    resolvedBy: text("resolved_by"),
    resolvedAt: integer("resolved_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_reports_status").on(table.status)]
);

// 14. Cred Snapshots (Daily copy of user Cred Score)
export const credSnapshots = sqliteTable(
  "cred_snapshots",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    day: text("day").notNull(), // YYYY-MM-DD
    score: integer("score").notNull(),
    rangeLow: integer("range_low").notNull(),
    rangeHigh: integer("range_high").notNull(),
    reason: text("reason").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_user_day_cred").on(table.userId, table.day),
    index("idx_cred_snapshots_user").on(table.userId),
  ]
);

// 15. Events (Product analytics)
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    name: text("name").notNull(), // 'sign_up' | 'first_watchlist_add' | 'first_order' | 'order_result' | 'league_join'
    props: text("props"), // JSON
    ts: integer("ts").notNull(),
  },
  (table) => [
    index("idx_events_name").on(table.name),
    index("idx_events_user").on(table.userId),
    index("idx_events_ts").on(table.ts),
  ]
);

// 16. Bug Reports
export const bugReports = sqliteTable(
  "bug_reports",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    route: text("route").notNull(),
    description: text("description").notNull(),
    appVersion: text("app_version").notNull().default("0.1.0"),
    severity: text("severity").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'critical'
    status: text("status").notNull().default("open"), // 'open' | 'investigating' | 'resolved'
    createdAt: integer("created_at").notNull(),
    resolvedAt: integer("resolved_at"),
  },
  (table) => [
    index("idx_bug_reports_status").on(table.status),
    index("idx_bug_reports_severity").on(table.severity),
  ]
);
