import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/sign-in?from=/admin");
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-30 bg-black/90 border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-xs text-black">
                OP
              </div>
              <span className="font-bold text-sm tracking-tight text-white">
                StreetCred Ops Center
              </span>
            </Link>
            <span className="text-xs text-zinc-500">| IIT BHU Beta</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Nav Tabs */}
      <nav className="bg-black/60 border-b border-white/10 px-4">
        <div className="max-w-6xl mx-auto flex gap-6 text-xs font-semibold">
          <Link
            href="/admin"
            className="py-3 border-b-2 border-white text-white"
          >
            Metrics & Funnel
          </Link>
          <Link
            href="/admin/users"
            className="py-3 text-zinc-400 hover:text-white transition-colors"
          >
            Users & Retention
          </Link>
          <Link
            href="/admin/reports"
            className="py-3 text-zinc-400 hover:text-white transition-colors"
          >
            Moderation Queue
          </Link>
          <Link
            href="/admin/bugs"
            className="py-3 text-zinc-400 hover:text-white transition-colors"
          >
            Bug Triage Loop
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
