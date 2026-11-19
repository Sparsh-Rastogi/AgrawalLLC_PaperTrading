import { cookies } from "next/headers";
import { verifySessionToken, SessionUser, COOKIE_NAME } from "./index";

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Authentication required");
    (err as any).status = 401;
    throw err;
  }
  if (user.status === "suspended") {
    const err = new Error("Account is suspended. Contact admin@itbhu.ac.in");
    (err as any).status = 403;
    throw err;
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    const err = new Error("Forbidden: Admin privileges required");
    (err as any).status = 403;
    throw err;
  }
  return user;
}
