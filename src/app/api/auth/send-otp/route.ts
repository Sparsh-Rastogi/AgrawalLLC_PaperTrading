import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailOtps } from "@/lib/db/schema";
import {
  validateInstituteEmail,
  normalizeEmail,
  generate6DigitOTP,
  hashOTP,
} from "@/lib/auth";
import { and, eq, gt, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json({ error: "Institute email is required" }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    if (!validateInstituteEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Restricted to verified IIT (BHU) students only (@itbhu.ac.in or @iitbhu.ac.in)",
        },
        { status: 403 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const tenMinutesAgo = now - 600;

    // Rate limiting: max 3 OTP requests per 10 minutes
    const recentOtps = await db
      .select({ val: count() })
      .from(emailOtps)
      .where(and(eq(emailOtps.email, email), gt(emailOtps.createdAt, tenMinutesAgo)))
      .get();

    if (recentOtps && recentOtps.val >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const otp = generate6DigitOTP();
    const codeHash = await hashOTP(otp);
    const expiresAt = now + 600; // 10 minutes expiry

    await db.insert(emailOtps).values({
      id: uuidv4(),
      email,
      codeHash,
      expiresAt,
      attempts: 0,
      consumedAt: null,
      createdAt: now,
    });

    // In production, an email would be dispatched via SMTP/AWS SES
    // For development and beta testing, return the OTP directly
    console.log(`[STREETCRED-AUTH] OTP for ${email}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${email}`,
      // Return OTP in dev/testing for immediate seamless testing
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error: any) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
