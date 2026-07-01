"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Wraps the Fullscreen API for the exam screens. Tracks state via the
 * `fullscreenchange` event (not just our own toggle calls) so the button
 * stays in sync if the user exits with Esc/F11 instead of our button.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
