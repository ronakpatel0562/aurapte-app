"use client";

import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/**
 * Three-state toggle: Light / Dark / System. Matches the modern macOS /
 * iOS pattern. Renders a compact pill on small screens, a labelled group
 * on larger ones. Always icon + tooltip so it's usable on mobile.
 */
export default function ThemeToggle() {
  const { mode, setMode, resolved } = useTheme();

  const options: { id: "light" | "dark" | "system"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

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
            title={`${label}${id === "system" && resolved ? ` (resolves to ${resolved})` : ""}`}
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
