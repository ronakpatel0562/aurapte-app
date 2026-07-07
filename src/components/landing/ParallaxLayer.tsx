"use client";

import React, { useEffect, useRef } from "react";

interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  /** Fraction of scroll distance the layer travels — lower drifts slower. */
  speed?: number;
  /** Fade out as the user scrolls past the hero. */
  fade?: boolean;
}

/**
 * Scroll-linked drift for hero elements. rAF-throttled scroll listener
 * writing transform/opacity directly to the DOM node — no React
 * re-render per scroll tick, so it stays smooth even on long pages.
 */
export default function ParallaxLayer({ children, className = "", speed = 0.1, fade = false }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const FADE_DISTANCE = 640;

    const update = () => {
      const el = ref.current;
      if (el) {
        const y = window.scrollY;
        el.style.transform = `translate3d(0, ${Math.min(y, 900) * speed}px, 0)`;
        if (fade) {
          el.style.opacity = String(Math.max(1 - y / FADE_DISTANCE, 0));
        }
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed, fade]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
