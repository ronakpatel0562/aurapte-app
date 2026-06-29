"use client";

/**
 * Theme provider — wires the dark-mode toggle into a persistent
 * preference. The actual <html class="dark"> flip lives here so SSR
 * doesn't see a flash of incorrect theme. The mode is stored in
 * localStorage under "aurapte-theme" and respects the OS preference
 * ("system") the first time the user visits.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";
type ResolvedMode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  resolved: ResolvedMode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "aurapte-theme";

function resolve(mode: Mode): ResolvedMode {
  if (mode === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyClass(resolved: ResolvedMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  // Update the meta theme-color so the browser chrome matches.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#0a0a0a" : "#fafafa");
}

/**
 * Inline init script injected into <head> to avoid the "flash of incorrect
 * theme" on first paint. Reads localStorage before React hydrates and
 * applies the class. See layout.tsx for the placement.
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var resolved = stored;
    if (stored === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', resolved === 'dark' ? '#0a0a0a' : '#fafafa');
  } catch (_) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to "system" so first-time visitors get the right theme without
  // us having to ask. The init script in <head> has already applied the
  // class, so this initial state matches what the user sees.
  const [mode, setModeState] = useState<Mode>("system");
  const [resolved, setResolved] = useState<ResolvedMode>("light");
  const [mounted, setMounted] = useState(false);

  // Sync from localStorage on first client render. We can't read
  // localStorage during render (SSR mismatch) so we do it in an effect.
  useEffect(() => {
    let initial: Mode = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        initial = stored;
      }
    } catch (_) {}
    setModeState(initial);
    const r = resolve(initial);
    setResolved(r);
    applyClass(r);
    setMounted(true);

    // Track OS preference changes while in "system" mode so the page
    // automatically follows the user's wallpaper.
    if (initial === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const next = mq.matches ? "dark" : "light";
        setResolved(next);
        applyClass(next);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
    const r = resolve(next);
    setResolved(r);
    applyClass(r);
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  // Prevent the toggle UI from rendering until we know the real state on
  // the client — otherwise SSR/CSR mismatch on the icon.
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
