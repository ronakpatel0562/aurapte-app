"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  PenTool,
  BookOpenCheck,
  Headphones,
  Menu,
} from "lucide-react";
import MobileNavDrawer from "./MobileNavDrawer";

/**
 * Mobile bottom nav. Now only shows the 4 most common destinations plus a
 * "Menu" button that opens the full nav drawer — the drawer is where the
 * full Question Bank / Mock / Practice / Billing list lives. This keeps
 * the bottom bar readable on small screens and gives users a real nav
 * surface on phones instead of the cramped "More" tab pattern.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The 4 main modules go directly in the bottom bar — Dashboard + Menu
  // takes the remaining two slots. The user asked for everything to be
  // accessible on small screens; this is the cleanest layout that
  // doesn't require a hamburger hidden in a corner.
  const items = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Speaking", href: "/questions/speaking", icon: Mic },
    { name: "Reading", href: "/questions/reading", icon: BookOpenCheck },
    { name: "Listening", href: "/questions/listening", icon: Headphones },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.includes(href.split("?")[0]);
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-hairline bg-canvas/95 backdrop-blur z-40 flex justify-around items-stretch px-1 select-none shadow-vercel-popover"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-2xs font-medium transition-colors ${
                active ? "text-primary" : "text-mute hover:text-ink"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className={active ? "font-semibold" : ""}>{item.name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-2xs font-medium text-mute hover:text-ink transition-colors"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
          <span>Menu</span>
        </button>
      </nav>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
