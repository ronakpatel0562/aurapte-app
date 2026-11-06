"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { isDiwaliActive, DIWALI_STORAGE_KEYS } from "@/lib/diwali";
import { GlowingDiya } from "./DiwaliDecorations";

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "star";
  alpha: number;
  decay: number;
}

const CONFETTI_COLORS = [
  "#FFD700", // Imperial Gold
  "#FFA000", // Rich Amber
  "#FF5722", // Saffron Orange
  "#E91E63", // Festive Magenta
  "#10B981", // Emerald Mint
  "#FFF9C4", // Champagne White
  "#FF6D00", // Deep Marigold
];

export default function DiwaliCelebrationModal() {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Guard against expired Diwali window
    if (!isDiwaliActive()) return;

    // 2. Frequency Check: exactly once per login session
    const alreadyShown = sessionStorage.getItem(DIWALI_STORAGE_KEYS.MODAL_SHOWN);
    if (alreadyShown) return;

    // 3. Trigger check: check if login trigger is pending or preview param is provided
    const hasTrigger = sessionStorage.getItem(DIWALI_STORAGE_KEYS.LOGIN_TRIGGER) === "true";
    const urlParams = new URLSearchParams(window.location.search);
    const hasPreviewParam = urlParams.get("diwali_celebrate") === "1" || urlParams.get("login") === "1";

    if (hasTrigger || hasPreviewParam) {
      // Mark as shown for this browser session immediately so page refreshes or route changes will never repeat it
      sessionStorage.setItem(DIWALI_STORAGE_KEYS.MODAL_SHOWN, "true");
      sessionStorage.removeItem(DIWALI_STORAGE_KEYS.LOGIN_TRIGGER);
      
      // Delay slightly for smooth transition into the dashboard
      const timer = setTimeout(() => {
        setOpen(true);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, []);

  // Firecracker & Confetti Burst Canvas inside the modal
  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const rect = canvas.getBoundingClientRect();
    const width = (canvas.width = rect.width);
    const height = (canvas.height = rect.height);

    const particles: ConfettiParticle[] = [];
    const count = 90;

    // Center explosion point
    const originX = width / 2;
    const originY = height * 0.32;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 7 + 2.5;
      const shapeType: "rect" | "circle" | "star" =
        i % 4 === 0 ? "star" : i % 2 === 0 ? "rect" : "circle";

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * 0.7 - 2.8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        size: Math.random() * 6 + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: shapeType,
        alpha: 1,
        decay: Math.random() * 0.009 + 0.007,
      });
    }

    let animId: number;
    let startTime = performance.now();

    const drawStar = (x: number, y: number, r: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          x + Math.cos(((18 + i * 72) * Math.PI) / 180) * r,
          y - Math.sin(((18 + i * 72) * Math.PI) / 180) * r
        );
        ctx.lineTo(
          x + Math.cos(((54 + i * 72) * Math.PI) / 180) * (r / 2),
          y - Math.sin(((54 + i * 72) * Math.PI) / 180) * (r / 2)
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // gravity
        p.vx *= 0.98; // air drag
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0) continue;
        aliveCount++;

        if (p.shape === "star") {
          drawStar(p.x, p.y, p.size, p.color, p.alpha);
        } else if (p.shape === "circle") {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 4;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      // Automatically halt after 3.8 seconds or when all particles fade
      if (aliveCount > 0 && elapsed < 3800) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [open]);

  if (!open || !isDiwaliActive()) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diwali-celebration-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
    >
      {/* Modern Floating Frosted Glass Card with Glowing Thin Gold Border */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1d060f]/90 backdrop-blur-2xl border border-amber-400/40 shadow-[0_0_50px_rgba(255,184,48,0.25),0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden text-center p-7 sm:p-9 transition-all">
        {/* Interactive Confetti & Sparkler Burst Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Ambient Warm Golden Aura inside card */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-[radial-gradient(circle,rgba(255,184,48,0.3)_0%,rgba(233,30,99,0.1)_60%,transparent_80%)] blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close celebration message"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full border border-amber-400/25 bg-[#2b0b16]/70 text-[#ffb830] hover:text-white hover:bg-[#3d1020] hover:border-amber-400/60 transition flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Decorative Diya Header */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-5">
          <div className="mb-2 drop-shadow-[0_0_16px_rgba(255,184,48,0.5)]">
            <GlowingDiya size={58} />
          </div>

          {/* Festive Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/30 bg-[#2d0a16]/80 text-2xs font-mono uppercase tracking-wider text-[#ffb830] shadow-sm">
            <Sparkles className="w-3 h-3 text-[#ffb830]" />
            Deepavali Celebration
          </div>
        </div>

        {/* Celebration Title */}
        <div className="relative z-10 space-y-3 mb-6">
          <h2
            id="diwali-celebration-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fff7ed] leading-snug"
          >
            Wishing you a{" "}
            <span className="bg-gradient-to-r from-[#ffd54f] via-[#ff9800] to-[#e91e63] bg-clip-text text-transparent">
              Happy Diwali
            </span>{" "}
            and a prosperous New Year!
          </h2>

          <p className="text-sm sm:text-base text-[#ded0c5] leading-relaxed max-w-md mx-auto">
            May this festival of lights illuminate your path with wisdom, bring good health and abundance to your family, and empower you to conquer CLB 10 in your PTE Core exam!
          </p>
        </div>

        {/* Action Button */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#ffb830] via-[#ff9500] to-[#ff5722] hover:from-[#ffc107] hover:to-[#f4511e] text-[#14050a] font-semibold text-sm shadow-[0_0_20px_rgba(255,184,48,0.4)] hover:shadow-[0_0_30px_rgba(255,184,48,0.6)] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4 text-[#14050a]" />
          </button>
        </div>
      </div>
    </div>
  );
}

