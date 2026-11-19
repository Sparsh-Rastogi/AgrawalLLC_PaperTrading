import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, emailOtps, watchlists, watchlistItems } from "@/lib/db/schema";
import {
  normalizeEmail,
  verifyOTPHash,
  createSessionToken,
  COOKIE_NAME,
} from "@/lib/auth";
import { eq, and, gt, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { trackA } from "@/lib/track-a";
import { logEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: rawEmail, code, handle: requestedHandle, hostel } = body;

    if (!rawEmail || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    const now = Math.floor(Date.now() / 1000);

    // Find the latest valid OTP for this email
    const otpRecord = await db
      .select()
      .from(emailOtps)
      .where(and(eq(emailOtps.email, email), gt(emailOtps.expiresAt, now)))
      .orderBy(desc(emailOtps.createdAt))
      .get();

    if (!otpRecord || otpRecord.consumedAt) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Request a new OTP." },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValid = await verifyOTPHash(code, otpRecord.codeHash);
    if (!isValid) {
      // Increment attempt count
      await db
        .update(emailOtps)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(emailOtps.id, otpRecord.id));
      return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 });
    }

    // Mark OTP as consumed
    await db
      .update(emailOtps)
      .set({ consumedAt: now })
      .where(eq(emailOtps.id, otpRecord.id));

    // Check if user already exists
    let user = await db.select().from(users).where(eq(users.email, email)).get();
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Derive clean handle from requested or email prefix
      const defaultHandle = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      let finalHandle = (requestedHandle || defaultHandle).trim().toLowerCase();

      // Check handle uniqueness
      const existingHandle = await db.select().from(users).where(eq(users.handle, finalHandle)).get();
      if (existingHandle) {
        finalHandle = `${finalHandle}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const userId = uuidv4();

      // Ensure trading account in Track A
      const trackAAccount = await trackA.ensureTradingAccount(userId);

      // Insert new user
      await db.insert(users).values({
        id: userId,
        email,
        emailVerifiedAt: now,
        handle: finalHandle,
        displayName: finalHandle,
        hostel: hostel || "IIT BHU Campus",
        trackAAccountId: trackAAccount.accountId,
        role: email.startsWith("admin") ? "admin" : "user",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      // Create default watchlist with a few top tickers
      const watchlistId = uuidv4();
      await db.insert(watchlists).values({
        id: watchlistId,
        userId,
        name: "Default",
        createdAt: now,
      });

      const initialTickers = ["RELIANCE", "TCS", "HDFCBANK", "INFY"];
      for (let i = 0; i < initialTickers.length; i++) {
        await db.insert(watchlistItems).values({
          id: uuidv4(),
          watchlistId,
          ticker: initialTickers[i],
          position: i,
          addedAt: now,
        });
      }

      user = await db.select().from(users).where(eq(users.id, userId)).get();
      if (!user) throw new Error("Failed to create user record");
      await logEvent("sign_up", { email, handle: finalHandle, hostel: user.hostel }, userId);
    } else {
      // Existing user sign-in
      await db.update(users).set({ updatedAt: now }).where(eq(users.id, user.id));
      await logEvent("sign_in", { email }, user.id);
    }

    if (!user) throw new Error("User record not found");

    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Account suspended. Please contact admin@itbhu.ac.in" },
        { status: 403 }
      );
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        hostel: user.hostel,
        role: user.role,
      },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    return response;
  } catch (error: any) {
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify code" }, { status: 500 });
  }
}
