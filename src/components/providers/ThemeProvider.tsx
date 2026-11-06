"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isPremiumPlan } from "@/lib/plans";
import {
  isDiwaliActive,
  isDiwaliThemeEnabled,
  DIWALI_EXPIRY_TIMESTAMP_MS,
  DIWALI_STORAGE_KEYS,
} from "@/lib/diwali";

type Mode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
  /** Theme switching is an Aura Pro perk — Starter accounts stay on light mode. */
  isPremium: boolean;
  /** True if we are within the 7-day Diwali celebration window. */
  isDiwaliActive: boolean;
  /** True if the user is currently using the Diwali theme. */
  isDiwaliTheme: boolean;
  /** Toggle between Diwali theme and standard Light/Dark theme. */
  toggleDiwaliTheme: () => void;
  /** Explicitly set Diwali theme on or off. */
  setDiwaliTheme: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "aurapte-theme";

function detectSystemTheme(): Mode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(mode: Mode, diwaliTheme: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (diwaliTheme && isDiwaliActive()) {
    root.classList.add("dark", "diwali");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#14050a");
    return;
  }

  // When Diwali theme is off, restore standard light/dark classes
  root.classList.remove("diwali");
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#0a0a0a" : "#fafafa");
}

/**
 * Inline init script injected into <head> to prevent flash of incorrect theme.
 * Defaults to Diwali theme if within the 7-day window and not explicitly turned off.
 */
export const themeInitScript = `
(function() {
  try {
    var DIWALI_EXPIRY_MS = ${DIWALI_EXPIRY_TIMESTAMP_MS};
    var isDiwaliWindow = Date.now() <= DIWALI_EXPIRY_MS;
    var diwaliPref = localStorage.getItem('${DIWALI_STORAGE_KEYS.THEME_ENABLED}');
    var isDiwali = isDiwaliWindow && diwaliPref !== 'false';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }

    if (isDiwali) {
      document.documentElement.classList.add('dark', 'diwali');
      meta.setAttribute('content', '#14050a');
      return;
    }

    // Normal light/dark fallback
    document.documentElement.classList.remove('diwali');
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var resolved = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    meta.setAttribute('content', resolved === 'dark' ? '#0a0a0a' : '#fafafa');
  } catch (_) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const activeWindow = isDiwaliActive();
  const [isDiwaliTheme, setIsDiwaliThemeState] = useState<boolean>(() => isDiwaliThemeEnabled());
  const [mode, setModeState] = useState<Mode>("dark");
  const [isPremium, setIsPremium] = useState(false);
  const isPremiumRef = useRef(isPremium);
  isPremiumRef.current = isPremium;

  useEffect(() => {
    // 1. Resolve standard initial mode
    let initialMode: Mode;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      initialMode = stored === "light" || stored === "dark" ? stored : detectSystemTheme();
    } catch (_) {
      initialMode = detectSystemTheme();
    }
    setModeState(initialMode);

    // 2. Resolve Diwali preference
    const diwaliEnabled = isDiwaliThemeEnabled();
    setIsDiwaliThemeState(diwaliEnabled);
    applyClass(initialMode, diwaliEnabled);

    // 3. Sync Supabase user profile plan
    const supabase = createClient();
    const syncWithDB = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("theme, plan")
          .eq("id", userId)
          .maybeSingle();

        const premium = isPremiumPlan(data?.plan);
        setIsPremium(premium);

        // If not premium and not on Diwali theme, lock to light mode
        if (!premium && !isDiwaliThemeEnabled()) {
          setModeState("light");
          applyClass("light", false);
          return;
        }

        if (data?.theme === "light" || data?.theme === "dark") {
          setModeState(data.theme);
          try { localStorage.setItem(STORAGE_KEY, data.theme); } catch (_) {}
          applyClass(data.theme, isDiwaliThemeEnabled());
        }
      } catch (_) {}
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncWithDB(session.user.id);
      } else {
        setIsPremium(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const setDiwaliTheme = useCallback((enabled: boolean) => {
    if (!isDiwaliActive()) return;
    setIsDiwaliThemeState(enabled);
    try {
      localStorage.setItem(DIWALI_STORAGE_KEYS.THEME_ENABLED, enabled ? "true" : "false");
    } catch (_) {}
    applyClass(mode, enabled);
    window.dispatchEvent(new CustomEvent("diwaliThemeChanged", { detail: { enabled } }));
  }, [mode]);

  const toggleDiwaliTheme = useCallback(() => {
    setDiwaliTheme(!isDiwaliTheme);
  }, [isDiwaliTheme, setDiwaliTheme]);

  const setMode = useCallback(async (next: Mode) => {
    // Setting light/dark mode automatically disables the forced Diwali theme
    if (isDiwaliTheme) {
      setDiwaliTheme(false);
    }

    if (next === "dark" && !isPremiumRef.current) return;
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    applyClass(next, false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ theme: next }).eq("id", user.id);
      }
    } catch (_) {}
  }, [isDiwaliTheme, setDiwaliTheme]);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        toggle,
        isPremium,
        isDiwaliActive: activeWindow,
        isDiwaliTheme,
        toggleDiwaliTheme,
        setDiwaliTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
