"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "aurapte-theme";

function detectSystemTheme(): Mode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(mode: Mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#0a0a0a" : "#fafafa");
}

/**
 * Inline init script injected into <head> to prevent flash of incorrect theme.
 * Reads localStorage; if no saved preference, falls back to OS preference.
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var resolved = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
  const [mode, setModeState] = useState<Mode>("light");

  useEffect(() => {
    // Step 1: resolve initial theme from localStorage or OS
    let initial: Mode;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      initial = stored === "light" || stored === "dark" ? stored : detectSystemTheme();
    } catch (_) {
      initial = detectSystemTheme();
    }

    // Persist the resolved value so subsequent visits skip OS detection
    try { localStorage.setItem(STORAGE_KEY, initial); } catch (_) {}
    setModeState(initial);
    applyClass(initial);

    // Step 2: sync with Supabase in background
    const syncWithDB = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("profiles")
          .select("theme")
          .eq("id", user.id)
          .maybeSingle();

        if (data?.theme === "light" || data?.theme === "dark") {
          // DB preference wins — apply and sync locally
          if (data.theme !== initial) {
            setModeState(data.theme);
            try { localStorage.setItem(STORAGE_KEY, data.theme); } catch (_) {}
            applyClass(data.theme);
          }
        } else {
          // No DB preference yet — save the resolved initial value
          await supabase
            .from("profiles")
            .update({ theme: initial })
            .eq("id", user.id);
        }
      } catch (_) {}
    };

    syncWithDB();
  }, []);

  const setMode = useCallback(async (next: Mode) => {
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    applyClass(next);

    // Persist to DB in background
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ theme: next }).eq("id", user.id);
      }
    } catch (_) {}
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
