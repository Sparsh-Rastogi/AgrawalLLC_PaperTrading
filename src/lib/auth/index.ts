import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, emailOtps } from "../db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { trackA } from "../track-a";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "streetcred-secret-key-at-least-32-chars-long-2026"
);

export const COOKIE_NAME = "streetcred-session";

// Institute domains allowed: IIT BHU (@itbhu.ac.in, @iitbhu.ac.in)
// In dev mode, allow test domains as well if needed
export function validateInstituteEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return (
    normalized.endsWith("@itbhu.ac.in") ||
    normalized.endsWith("@iitbhu.ac.in") ||
    normalized.endsWith("@alumni.iitbhu.ac.in") ||
    (process.env.NODE_ENV !== "production" && normalized.endsWith("@test.com"))
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generate6DigitOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

// Session payload type
export interface SessionUser {
  userId: string;
  email: string;
  handle: string;
  hostel?: string;
  role: string;
  status: string;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    email: user.email,
    handle: user.handle,
    hostel: user.hostel,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      handle: payload.handle as string,
      hostel: payload.hostel as string | undefined,
      role: (payload.role as string) || "user",
      status: (payload.status as string) || "active",
    };
  } catch {
    return null;
  }
}

// Ensure default test admin/user exists for easy review
export async function seedInitialAdminIfNeeded(): Promise<void> {
  const adminEmail = "admin@itbhu.ac.in";
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).get();
  if (!existing) {
    const now = Math.floor(Date.now() / 1000);
    const userId = uuidv4();
    await db.insert(users).values({
      id: userId,
      email: adminEmail,
      emailVerifiedAt: now,
      handle: "admin_bhu",
      displayName: "StreetCred Admin",
      hostel: "Rajputana",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await trackA.ensureTradingAccount(userId);
  }
}
