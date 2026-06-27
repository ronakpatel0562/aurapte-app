"use client";

import { useEffect, useRef } from "react";

/**
 * Posts to /api/heartbeat once a minute while the tab is visible. The
 * endpoint does the actual `user_sessions` DB check; we keep this hook
 * dumb so it doesn't fight with React's rendering schedule.
 *
 * Why we don't use setInterval at 60s on the dot:
 *   - We coalse visibility changes (tab hidden / shown).
 *   - We stop scheduling once the server says the session is no longer
 *     valid, so a stolen session doesn't keep getting refreshed by us.
 */
export function useHeartbeat(enabled: boolean = true) {
  const aliveRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    aliveRef.current = true;

    const ping = async () => {
      if (!aliveRef.current) return;
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/heartbeat", {
          method: "POST",
          // Same-origin, simple request — no preflight, no credentials needed
          // because we read the session_id cookie from the request itself.
          cache: "no-store",
        });
        if (!res.ok) aliveRef.current = false;
      } catch {
        // Network blip — try again next tick.
      }
    };

    // Initial ping then every 60s.
    ping();
    const id = window.setInterval(ping, 60_000);
    return () => {
      aliveRef.current = false;
      window.clearInterval(id);
    };
  }, [enabled]);
}