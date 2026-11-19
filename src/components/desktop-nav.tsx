"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DesktopNav() {
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/home" },
    { label: "Markets", href: "/markets" },
    { label: "Leagues", href: "/leagues" },
    { label: "Feed", href: "/feed" },
    { label: "Profile", href: "/profile" },
    {
      label: "How to Use",
      href: "/how-to-use",
      badge: "Guide",
    },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/home" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive
                ? "text-white bg-white/10 shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{link.label}</span>
            {link.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                {link.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-white rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
