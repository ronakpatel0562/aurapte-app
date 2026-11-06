"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import DiyaThemeButton from "@/components/diwali/DiyaThemeButton";

const STORAGE_KEY = "aurapte-landing-theme";

export default function LandingThemeToggle() {
  const { isDiwaliActive, isDiwaliTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.getElementById("landing-root");
    setIsDark(root?.classList.contains("dark") ?? false);
  }, []);

  // When Diwali theme is active during festival window:
  // Show ONLY the Diya toggle button to allow switching back to standard theme.
  if (isDiwaliActive && isDiwaliTheme) {
    return <DiyaThemeButton />;
  }

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
    <div className="inline-flex items-center gap-2">
      {/* Show Diya button so user can switch back to Diwali theme */}
      {isDiwaliActive && <DiyaThemeButton />}

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
    </div>
  );
}
