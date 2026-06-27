"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Top-of-page progress bar that activates the instant the route changes
 * and clears a beat after the new route has rendered.
 *
 * How it works:
 *   - `usePathname()` is reactive: it returns a new value the moment Next
 *     commits a navigation. We watch it with a ref so the first effect
 *     run (initial mount) doesn't trigger the bar.
 *   - When the path changes, we set `loading=true` and start a CSS-driven
 *     progress animation. We can't measure actual fetch progress here
 *     because Next's app router doesn't expose it; instead we tick the
 *     bar forward on a timer so it always reaches ~90% before the new
 *     page paints, then snap to 100% on settle.
 *   - On settle (200ms after the path settles) we hide the bar.
 *
 * This is the standard "NProgress-style" trick without the dep. Renders
 * a single 2px bar fixed to the viewport; the bar is aria-hidden because
 * it's purely cosmetic.
 */
export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const firstRender = useRef(true);
  const tickRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Route just changed. Show the bar and start ticking progress.
    setLoading(true);
    setProgress(8);

    if (tickRef.current !== null) window.clearInterval(tickRef.current);
    if (hideRef.current !== null) window.clearTimeout(hideRef.current);

    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        // Decelerating curve: fast at first, slows as it approaches 90%.
        if (p >= 90) return p;
        const remaining = 90 - p;
        return p + Math.max(2, Math.floor(remaining / 12));
      });
    }, 180);

    // Snap to 100% shortly after the new route paints. 250ms is enough
    // for client components to commit on a hot Next.js app router.
    hideRef.current = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 220);
    }, 250);

    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      if (hideRef.current !== null) window.clearTimeout(hideRef.current);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
      style={{ height: 2 }}
    >
      <div
        className="h-full bg-primary transition-[width] ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress >= 100 ? "180ms" : "200ms",
        }}
      />
    </div>
  );
}