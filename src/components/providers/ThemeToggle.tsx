"use client";

import React from "react";
import Link from "next/link";
import { Lock, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { mode, setMode, isPremium } = useTheme();

  const options: { id: "light" | "dark"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  if (!isPremium) {
    return (
      <Link
        href="/billing"
        title="Upgrade to Aura Pro to unlock dark mode"
        className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas-soft px-3 py-1.5 text-xs font-medium text-mute hover:text-ink hover:bg-canvas-soft-2 transition"
      >
        <Lock className="w-3.5 h-3.5" />
        Theme — Pro only
      </Link>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-canvas-soft p-1 shadow-vercel-card"
    >
      {options.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(id)}
            title={label}
            className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium transition ${
              active
                ? "bg-canvas text-ink shadow-sm"
                : "text-mute hover:text-ink hover:bg-canvas-soft-2"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
