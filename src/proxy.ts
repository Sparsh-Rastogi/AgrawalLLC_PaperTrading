import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "streetcred-secret-key-at-least-32-chars-long-2026"
);

const PUBLIC_PATHS = [
  "/sign-in",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/manifest.json",
  "/favicon.ico",
  "/globe.svg",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, Next internals, public paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    PUBLIC_PATHS.includes(pathname) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("streetcred-session")?.value;

  if (!token) {
    // If API route, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to sign-in page
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-user-role", payload.role as string);

    // If admin path, verify role
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    return response;
  } catch {
    // Invalid or expired token
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const loginUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json).*)",
  ],
};
