"use client";

import React, { useEffect, useRef } from "react";

interface TiltStageProps {
  children: React.ReactNode;
  className?: string;
  restX?: number;
  restY?: number;
}

/**
 * Shared cursor-tilt mechanic for the landing page's mockup cards
 * (hero + per-module sections). Plain CSS 3D transforms — no canvas,
 * so nothing can drift outside the container. The "stage" eases toward
 * the cursor position on mousemove and back to a resting tilt on
 * mouseleave; a static resting tilt is used under reduced-motion.
 */
export default function TiltStage({ children, className = "", restX = 8, restY = -10 }: TiltStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stage.style.transform = `rotateX(${restX}deg) rotateY(${restY}deg)`;
      return;
    }

    let target = { x: restX, y: restY };
    let current = { x: restX, y: restY };
    let rafId = 0;

    const apply = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      stage.style.transform = `rotateX(${current.x}deg) rotateY(${current.y}deg)`;
      rafId = requestAnimationFrame(apply);
    };
    rafId = requestAnimationFrame(apply);

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      target = { x: restX - py * 14, y: restY + px * 16 };
    };
    const onLeave = () => {
      target = { x: restX, y: restY };
    };

    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafId);
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, [restX, restY]);

  return (
    <div ref={wrapRef} className={`relative [perspective:1400px] ${className}`}>
      <div
        ref={stageRef}
        className="absolute inset-0 [transform-style:preserve-3d] will-change-transform"
        style={{ transform: `rotateX(${restX}deg) rotateY(${restY}deg)` }}
      >
        {children}
      </div>
    </div>
  );
}
