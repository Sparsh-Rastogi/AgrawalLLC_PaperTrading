import React from "react";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";
import { BugReportButton } from "@/components/bug-report-button";
import { MarketStatusBadge } from "@/components/market-status-badge";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#050608] text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#050608]/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/home" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-xs shadow-md group-hover:scale-105 transition-transform">
                SC
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  StreetCred
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/15">
                    IIT (BHU)
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400 hidden sm:inline">
                  Track B Paper Trading
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <DesktopNav />
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Link to How to Use on Mobile */}
            <Link
              href="/how-to-use"
              className="md:hidden text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15 flex items-center gap-1 hover:bg-white/15"
            >
              <span>Guide</span>
            </Link>

            <MarketStatusBadge />

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
              >
                ADMIN
              </Link>
            )}

            {user && (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10"
              >
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
                  {user.handle ? user.handle.slice(0, 1).toUpperCase() : "U"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user.handle}
                  </span>
                  <span className="text-[10px] text-zinc-400 leading-tight">
                    {user.hostel || "IIT BHU"}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Phone-first on small screens, full width container on desktop */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-12">
        {children}
      </main>

      {/* Bug Report Floating Action Button */}
      <BugReportButton />

      {/* Bottom Tabs Navigation (Mobile only) */}
      <BottomNav />
    </div>
  );
}

