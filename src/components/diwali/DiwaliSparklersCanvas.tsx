"use client";

import React, { useEffect, useRef } from "react";
import { isDiwaliActive } from "@/lib/diwali";

interface SparklerParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

const FESTIVE_COLORS = [
  "#FFD700", // Bright Gold
  "#FFA500", // Warm Amber
  "#FF8C00", // Dark Orange
  "#FF5722", // Deep Saffron
  "#FFF8DC", // Cornsilk / Golden Glow
  "#FFD54F", // Diya Gold
  "#F48FB1", // Rose Shimmer
];

export default function DiwaliSparklersCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isDiwaliActive()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Draw static soft golden dust once and don't animate
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = Math.min(window.innerHeight, 900));
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = "rgba(255, 215, 0, 0.25)";
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    let animationFrameId: number;
    let particles: SparklerParticle[] = [];
    let width = 0;
    let height = 0;
    let lastBurstTime = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = Math.min(window.innerHeight, 900);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Spawn a distant soft burst
    const createBurst = (originX: number, originY: number, count = 28) => {
      const baseColor = FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.8 + 0.4;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.2,
          size: Math.random() * 2 + 0.8,
          alpha: Math.random() * 0.45 + 0.2, // Subtle so text readability is strictly preserved
          decay: Math.random() * 0.008 + 0.006,
          color: Math.random() > 0.4 ? baseColor : "#FFF8DC",
        });
      }
    };

    // Initial ambient bursts
    createBurst(width * 0.25, height * 0.35, 20);
    createBurst(width * 0.75, height * 0.28, 20);

    let lastTick = performance.now();

    const loop = (timestamp: number) => {
      const elapsed = timestamp - lastTick;

      // Throttle to ~30-40 FPS for light CPU/GPU footprint
      if (elapsed >= 28) {
        lastTick = timestamp;

        ctx.clearRect(0, 0, width, height);

        // Occasional distant fireworks / sparkler bursts (every 2.5 to 4 seconds)
        if (timestamp - lastBurstTime > 2600 + Math.random() * 2200) {
          lastBurstTime = timestamp;
          // Spawn in upper region (hero area)
          const burstX = width * (0.15 + Math.random() * 0.7);
          const burstY = height * (0.15 + Math.random() * 0.45);
          createBurst(burstX, burstY, Math.floor(Math.random() * 14 + 18));
        }

        // Update and render particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.02; // light gravity
          p.vx *= 0.98; // air resistance
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (!isDiwaliActive()) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-80"
      aria-hidden="true"
    />
  );
}

