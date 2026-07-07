"use client";

import React from "react";
import { TrendingUp, Clock, Mic, PenTool, BookOpenCheck, Headphones } from "lucide-react";
import TiltStage from "./TiltStage";

/**
 * HeroDashboardMockup — the hero visual. The Speaking "Describe Image"
 * mockup now lives only in its own module section further down the
 * page; repeating it in the hero read as duplicated content. This is a
 * different, platform-level moment: an animated score dashboard (the
 * circular ring fills and the module bars grow in once on load), which
 * matches the "progress tracking that actually tells you where you
 * stand" pitch instead of one specific exam screen.
 */
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SCORE_PERCENT = 0.92;

const MODULE_SCORES = [
  { icon: Mic, label: "Speaking", score: 88, gradient: "from-gradient-develop-start to-gradient-develop-end" },
  { icon: PenTool, label: "Writing", score: 79, gradient: "from-gradient-preview-start to-gradient-preview-end" },
  { icon: BookOpenCheck, label: "Reading", score: 94, gradient: "from-gradient-ship-start to-gradient-ship-end" },
  { icon: Headphones, label: "Listening", score: 91, gradient: "from-gradient-develop-start to-gradient-preview-start" },
];

export default function HeroDashboardMockup() {
  const offset = CIRCUMFERENCE * (1 - SCORE_PERCENT);

  return (
    <TiltStage className="h-[420px] sm:h-[500px] lg:h-[540px]">
      {/* Main mockup — score dashboard */}
      <div
        className="absolute left-1/2 top-1/2 w-[300px] sm:w-[360px]"
        style={{ transform: "translate(-50%, -50%) translateZ(10px)" }}
      >
        <div className="rounded-2xl border border-hairline bg-canvas shadow-vercel-modal overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-hairline bg-canvas-soft-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
            <span className="ml-auto text-2xs font-mono uppercase tracking-wider text-mute">
              Your progress
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Circular score ring */}
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 120 120" className="w-24 h-24 -rotate-90">
                  <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-hairline)" strokeWidth="10" />
                  <defs>
                    <linearGradient id="heroRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff7a1a" />
                      <stop offset="55%" stopColor="#f5348c" />
                      <stop offset="100%" stopColor="#e91e8c" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    stroke="url(#heroRingGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    className="score-ring-fill"
                    style={
                      {
                        "--ring-circumference": CIRCUMFERENCE,
                        "--ring-offset": offset,
                      } as React.CSSProperties
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center count-pop">
                  <span className="text-xl font-bold text-ink leading-none">92</span>
                  <span className="text-2xs text-mute mt-0.5">overall</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xs font-mono uppercase tracking-wider text-mute">Predicted score</div>
                <div className="flex items-center gap-1.5 text-success text-sm font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18% this month
                </div>
                <p className="text-xs text-mute leading-relaxed">Across 12 mock attempts</p>
              </div>
            </div>

            {/* Per-module bars */}
            <div className="space-y-2.5 pt-1">
              {MODULE_SCORES.map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-mute shrink-0" />
                    <span className="text-xs text-body w-16 shrink-0">{m.label}</span>
                    <div className="h-1.5 rounded-full bg-canvas-soft-2 flex-1 overflow-hidden">
                      <div
                        className={`bar-grow h-full rounded-full bg-gradient-to-r ${m.gradient}`}
                        style={{ width: `${m.score}%`, animationDelay: `${0.5 + i * 0.12}s` }}
                      />
                    </div>
                    <span className="text-2xs font-mono text-mute w-6 text-right shrink-0">{m.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating accent — real exam timer badge, in front of the card */}
      <div
        className="absolute right-2 top-4 sm:right-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(90px)", animationDelay: "0.3s" }}
      >
        <div className="flex items-center gap-2 bg-canvas/90 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-popover">
          <Clock className="w-3.5 h-3.5 text-gradient-brand-start" />
          <span className="text-xs font-semibold text-ink">2hr real exam timer</span>
        </div>
      </div>

      {/* Floating accent — module coverage, behind the card */}
      <div
        className="absolute left-2 top-4 sm:left-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(-60px)", animationDelay: "1.1s" }}
      >
        <div className="bg-canvas/80 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-card">
          <div className="text-2xs font-mono uppercase tracking-wider text-mute">Every module</div>
          <div className="text-xs font-semibold text-ink mt-0.5">Speaking · Writing · Reading · Listening</div>
        </div>
      </div>
    </TiltStage>
  );
}
