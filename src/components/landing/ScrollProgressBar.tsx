"use client";

import React, { useEffect, useRef } from "react";

/**
 * Thin gradient bar pinned under the header, width tied to scroll
 * position. Reads/writes a ref directly (no state) so it doesn't
 * re-render React on every scroll tick — just rAF-throttled DOM writes.
 */
export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
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
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="sticky top-16 z-40 h-[2px] w-full bg-transparent" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-gradient-brand-start via-gradient-brand-mid to-gradient-brand-end transition-[width] duration-100 ease-out"
        style={{ width: "0%" }}
      />
    </div>
  );
}
