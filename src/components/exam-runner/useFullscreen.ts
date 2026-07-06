"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Wraps the Fullscreen API for the exam shell. The exam is meant to open
 * in fullscreen the moment the runner mounts (matching the real PTE test
 * driver), but browsers only grant `requestFullscreen()` inside a call
 * stack that still has "transient activation" from a user gesture — so
 * this exposes both an auto-attempt (used on mount) and a manual retry
 * button for browsers that already dropped that activation window.
 */
export function useFullscreen(targetRef: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = useCallback(async () => {
    const el = targetRef.current;
    if (!el || document.fullscreenElement) return;
    try {
      await el.requestFullscreen();
    } catch {
      // Blocked (no transient activation, or user denied) — the shell
      // shows a manual "Enter Full Screen" button as a fallback.
    }
    // Best-effort landscape lock for phones/tablets so the exam gets the
    // wider layout it's designed for. Unsupported on iOS Safari — the
    // portrait rotate-hint in ExamChrome covers that case instead.
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      await orientation.lock?.("landscape");
    } catch {
      // ignore — orientation lock is opportunistic only
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    try {
      screen.orientation?.unlock?.();
    } catch {
      // ignore
    }
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
  }, []);

  return { isFullscreen, enter, exit };
}
