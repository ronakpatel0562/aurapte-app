"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  PenTool,
  BookOpenCheck,
  Headphones,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Speaking", href: "/questions/speaking", icon: Mic },
    { name: "Writing", href: "/questions/writing", icon: PenTool },
    { name: "Reading", href: "/questions/reading", icon: BookOpenCheck },
    { name: "Listening", href: "/questions/listening", icon: Headphones },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-hairline bg-canvas z-40 flex justify-around items-center px-2 select-none shadow-vercel-popover">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Match active tab - if it's dashboard, match exact, otherwise check if path includes module name
        const isActive =
          item.name === "Dashboard"
            ? pathname === "/dashboard"
            : pathname.includes(`/${item.name.toLowerCase()}/`);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-2xs font-medium transition-colors ${
              isActive ? "text-primary font-semibold" : "text-mute hover:text-ink"
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
