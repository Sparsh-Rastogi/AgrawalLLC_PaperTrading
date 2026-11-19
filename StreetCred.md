# StreetCred Track B: Implementation Plan

Nov 19, 2026 · @SParsh

## Overview

Track B ships a mobile-first trading product for 50+ verified IIT (BHU) students and runs a 2-week league on it, building against a mocked Track A API until the real engine is ready.

**Goals**

- 50+ verified sign-ups (institute email only, one account per person)
- At least 5 trades per user over the 2-week league
- Week 2 retention measured and reported; proposed target 40% of Week 1 active users still active in days 8–14
- A working admin analytics dashboard that logs bugs and drives same-day fixes

**Assumptions about Track A**

- Track A exposes a versioned REST API (plus a stream for prices) covering market data, orders, portfolio and Cred Score. Track B never computes PnL, fills or scores.
- Track A is licensed for price data and handles market hours, holidays and halts. Track B only displays the market status it receives.
- The `OrderResponse` has a fixed status set (filled, pending, rejected) with a reason string on rejection.
- The Cred Score object carries the integer score, a confidence range and a one-line reason.

**Proposed schedule note:** dates below assume the build starts today, Nov 19, 2026. Shift them if the Confluentia deadline or IIT BHU exam and break dates differ.

## Architecture

Track B is one Next.js 16 app with its own SQLite store, and a single typed client is its only path to Track A.

&#91;embedded content: architecture · browser, Track B server, stores and Track A\]

The browser never calls Track A directly: the server holds the client, so a contract change is fixed in one place and the mock swaps in behind it.

**Build notes**

- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind, Drizzle with SQLite, Zod for response validation.
- Live prices and events: server-sent events from Track B's server to the browser, reconnecting with Last-Event-ID; until SSE is wired, 5–10 second REST polling behind the same hook and a Live, Delayed or Reconnecting badge.
- Mocks: a fixture-based Track A mock that uses the same Zod schemas, switched on by one environment variable.
- Theme: CSS variables set from the unrealized PnL percentage received from Track A.

## Data model

Track B's SQLite database owns identity, social and ops data only; orders, positions and scores stay in Track A and are cached here for display and analytics.

| Table | Purpose | Key columns |
| --- | --- | --- |
| users | One row per verified student | email (unique, lowercased), email\_verified\_at, handle (unique), hostel, track\_a\_account\_id, role, status |
| email\_otps | Sign-up and recovery codes | email, code\_hash, expires\_at, attempts, consumed\_at |
| leagues | Time-boxed competitions | name, type (hostel, club, campus), owner\_id, starts\_at, ends\_at, starting\_cash, invite\_code |
| league\_members | Who is in which league | league\_id, user\_id, joined\_at; unique on the pair |
| watchlists, watchlist\_items | Tracked tickers per user | user\_id, ticker, position |
| posts, post\_tickers, reactions | Stock-tagged feed | author\_id, body, ticker, sentiment, created\_at, hidden\_at |
| follows | Who follows whom | follower\_id, followee\_id |
| notifications | In-app inbox and push log | user\_id, type (fill, call\_scored, followed\_trade), payload JSON, read\_at |
| push\_subscriptions | Web push endpoints | user\_id, endpoint, keys, last\_seen\_at |
| reports | Moderation queue | reporter\_id, target\_type, target\_id, reason, status, resolved\_by |
| cred\_snapshots | Daily copy of each user's Cred Score | user\_id, day, score, range\_low, range\_high, reason |
| events | Product analytics | user\_id, name, props JSON, ts |
| bug\_reports | In-app bug log | user\_id, route, description, app\_version, severity, status |

**Notes**

- Enable WAL mode and take a Litestream or nightly file backup; one SQLite file is enough for a few hundred users.
- Access every table through Drizzle with migrations committed to the repo, so staging and production stay identical.
- Store only a hash of every OTP and reset token.

## Timeline

The build runs Nov 19 to Dec 14 in four phases, a 10-person pilot follows on Dec 15–16, and the closed beta starts Dec 17.

&#91;embedded content: build timeline · 5 phases, beta, 3 milestones\]

| Phase | Exit criteria |
| --- | --- |
| 0. Foundations | OpenAPI contract agreed with Track A, mock server running, repo with CI, auth skeleton, design tokens |
| 1. Core trading UX | Watchlist, chart, order ticket for all three order types, portfolio and PnL theme working against mocks |
| 2. Social and trust | Institute-email OTP enforced, account recovery, leagues with Cred Score leaderboard, feed, reports, notifications |
| 3. Hardening | Analytics hub, admin dashboard, real Track A wired in, security and load pass, backup restore drill |
| 4. Pilot | 10 testers each finish sign-up, a first trade and a league join; every critical bug closed before Dec 17 |

## Workstreams

Ten workstreams cover every Track B responsibility; each lists what Track A must provide and the test that says it is done.

| Workstream | What gets built | Needs from Track A | Done when |
| --- | --- | --- | --- |
| 1. App shell and design system | Next.js 16 App Router, bottom tab nav (Home, Markets, Leagues, Feed, Analytics), design tokens, loading skeletons, installable PWA | None | Every screen is usable at 360 px wide and passes a Lighthouse mobile score of 90 or more |
| 2. Markets, watchlists, charts | Search, watchlist add and remove, interactive price chart with 1D to 1Y ranges, market-status banner | Price feed with timestamps, market status, history endpoint | A user can build a watchlist and see a stale-price warning when the feed lags |
| 3. Order ticket | Buy and sell with market, limit and stop inputs, buying-power check, review step showing estimated cost, idempotency key per submit, handling of filled, pending and rejected | `OrderResponse`, buying power, open-orders list and cancel | An invalid order cannot be submitted, a double tap never places two orders, and every rejection shows its reason |
| 4. Portfolio and dynamic theming | Positions, average cost, realized and unrealized PnL display; CSS-variable palette driven by unrealized PnL % | Portfolio object with PnL fields | Theme shifts green or red with a clamped, smoothed mapping; gains and losses also show +/− signs and arrows, never colour alone |
| 5. Auth and one person, one account | Email OTP sign-up restricted to institute domain, unique normalized email, sign-in, password reset and recovery through the institute inbox, rate limits | Account creation endpoint that returns `track_a_account_id` | Two sign-ups with the same inbox, or a non-institute address, are refused; recovery works end to end |
| 6. Leagues and leaderboards | Create league (hostel, club, campus), start and end dates, invite link, join, leaderboard ranked by Cred Score | Cred Score per user, optionally scoped to a date window | A league locks on its end date and the final ranking is frozen and shareable |
| 7. Social feed and moderation | Ticker-tagged posts, sentiment tag, follow, report button, auto-hide after 3 reports, admin review queue | None | A reported post is hidden and appears in the queue within one minute |
| 8. Notifications | In-app inbox plus web push for order filled, call scored and followed user trade, de-duplicated by event id | Event webhook or pollable event log | Each event creates exactly one notification, with push opt-in and a mute switch |
| 9. Analytics hub | Separate tab with Cred Score over time, diversification chart, and portfolio vs S&P 500 indexed to 100 | Score history, S&P 500 baseline series, sector or asset mix per position | Every chart matches Track A numbers and shows the confidence range |
| 10. Admin dashboard and bug loop | Sign-up funnel, trades per user, retention cohorts, in-app bug button, error log, user lookup, suspend action | None | An operator can see who has under 5 trades and read a new bug within minutes |

**Cross-cutting rules**

- Display exactly what Track A returns. Round only for presentation, and never recompute PnL or score in the browser.
- Every Track A call goes through one typed client with Zod-validated responses, so a contract change fails loudly in one place.
- Show the Cred Score as a number plus its range and one-line reason together, never the bare integer.
- Log an analytics event for each key step: sign-up, first watchlist add, first order, order result, league join.

## Closed beta playbook

The beta runs Dec 17–30 with a goal of 50 retained students, so recruit about 80 to absorb drop-off; sign-ups open Dec 11 and a 10-person pilot runs Dec 15–16 before the public start.

**Metrics the admin dashboard must show**

| Metric | Definition | Target |
| --- | --- | --- |
| Verified sign-ups | Accounts with a confirmed institute email | 50 minimum, 80 recruited |
| Activation | Sign-ups who place a first order within 48 hours | 80% |
| Trades per user | Orders placed per user over the 14 days | 5 or more; report the share of users who reach 5 |
| Week 2 retention | Users with a session in days 8–14 divided by users active in days 1–7 | 40% (proposed) |
| League participation | Users in at least one league | 70% |
| Critical bug turnaround | Time from report to fix deployed | Under 24 hours |

**How we get there**

1. **Recruit:** one ambassador per hostel and one per active club, a shareable invite link, and an institute-email gate so every sign-up is a real student.
2. **Onboard:** a first session that ends with a watchlist, one trade and a league joined; a "3 of 5 trades" progress ring on Home keeps the target visible.
3. **Engage:** hostel-vs-hostel league as the default, a weekly Cred Score leaderboard post, and push notifications for fills, scored calls and followed traders.
4. **Re-engage:** a day-5 nudge to users with fewer than 3 trades, and a day-9 nudge to anyone inactive for 48 hours.
5. **Observe:** every key step logs an event; the dashboard shows the sign-up funnel, trades per user, a day-by-day active chart and a retention cohort.
6. **Fix:** an in-app "Report a bug" button captures route, app version and a note; critical bugs are triaged in a daily 15-minute review and fixed within 24 hours.

**Beta rules**

- Freeze new features on Dec 14; only bug fixes ship during the beta.
- Announce downtime and Track A outages in an in-app banner, not only in chat groups.
- After day 14, export the metrics, freeze the final leaderboards and send a short feedback form to every participant.

## Risks and open questions

The biggest threat is Track A slipping, so the plan builds against a mocked API from day one and agrees the contract before any screen is wired.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Track A API late or changing | Screens cannot be wired or tested | Freeze an OpenAPI contract by Nov 23; build on fixtures and a mock server; Zod-validate every response; swap in the real API behind one client |
| Beta overlaps exams or winter break | Low retention in Week 2 | Confirm academic calendar now; run hostel leagues with prizes; add re-engagement nudges |
| Burner accounts | Leaderboards lose credibility | Institute email OTP only, normalized unique email, rate limits, admin lookup and suspend |
| Price feed stale or halted during a session | Users trade on bad data | Show timestamp and stale warning on every price; disable ticket when Track A reports a halt |
| Duplicate or mistaken orders | Trust damage on first trades | Idempotency key per submit, review step, clear cancel for pending orders |
| Push notifications unreliable on iOS and some Android browsers | Missed fill or call alerts | In-app inbox is the source of truth; push is an extra; prompt install as a PWA |
| Dynamic theming hurts readability or colour-blind users | Accessibility failure | Keep text contrast fixed, add signs and arrows to every PnL value, offer a neutral theme toggle |
| SQLite single-file limits | Data loss or lock contention | WAL mode, nightly backup, restore drill before launch; a few hundred users is well within range |
| Small team overloaded by bug flow | Slow fixes during beta | Feature freeze Dec 14, daily triage, severity labels, one person on call per day |

**Positions to take with Track A**

| Topic | Position to push | Track B fallback |
| --- | --- | --- |
| Transport | SSE for quotes, fill alerts and score updates; HTTP POST to place and cancel orders. Flow is one-way, SSE works in App Router route handlers, and EventSource reconnects with Last-Event-ID | Poll REST every 5–10 seconds behind one data hook, with a Live, Delayed or Reconnecting badge so SSE swaps in with no UI change |
| Identity | Track B owns a canonical userId (UUID); Track A exposes an idempotent `ensureTradingAccount(userId, leagueId?)`, called in the sign-up transaction or on first portfolio load. Confirm whether accounts key on userId or (userId, leagueId), so every league starts with identical buying power | Call it lazily on first portfolio load |
| League Cred Score | `leagueId` or `from` and `to` parameters returning score, rangeLow, rangeHigh and oneLineReason for that window only | If only an all-time score ships, rank leagues by in-league S&P 500-adjusted return or Cred Score change over the window |
| Benchmark and metadata | Normalized S&P 500 (SPY) series aligned to portfolio timestamps; `sector` and `assetType` (stock or ETF) on each position or in a cached instruments table | Seed a static ticker-to-sector table in Drizzle so allocation charts work on day one |
| Order status and cancel | Status enum QUEUED\_FOR\_OPEN, OPEN, FILLED, CANCELLED, REJECTED with a readable statusReason; `POST /api/orders/:id/cancel` checks state atomically, returns 409 if already filled, and releases buying power on success | Show statusReason verbatim and treat any unknown status as a neutral Pending state |
| Staging by Mon Nov 23 | Merged Drizzle schema for orders, positions, scores and leagues, plus a repeatable `db:seed` with 10–15 tickers, price history, open and filled orders and a mock league | Local fixtures and the mock server on the same schemas |
