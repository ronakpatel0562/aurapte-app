"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Dark mode toggle for the public landing page only. Scoped to the
 * #landing-root subtree (via a plain "dark" class) instead of touching
 * document.documentElement — the app-wide ThemeProvider gates dark mode
 * behind a premium plan, which doesn't apply to anonymous visitors
 * previewing the marketing site.
 */
const STORAGE_KEY = "aurapte-landing-theme";

export default function LandingThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.getElementById("landing-root");
    setIsDark(root?.classList.contains("dark") ?? false);
  }, []);

  const toggle = () => {
    const root = document.getElementById("landing-root");
    if (!root) return;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    setIsDark(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative h-9 w-9 inline-flex items-center justify-center rounded-md border border-hairline bg-canvas-soft-2 text-body hover:text-ink hover:border-hairline-strong transition"
    >
      <Sun
        className={`w-4 h-4 absolute transition-all duration-300 ${
          isDark ? "opacity-0 scale-50 -rotate-90" : "opacity-100 scale-100 rotate-0"
        }`}
      />
      <Moon
        className={`w-4 h-4 absolute transition-all duration-300 ${
          isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"
        }`}
      />
    </button>
  );
}
