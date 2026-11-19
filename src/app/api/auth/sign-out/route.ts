import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Signed out successfully" });
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
