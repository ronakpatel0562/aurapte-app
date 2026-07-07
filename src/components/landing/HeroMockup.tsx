"use client";

import React from "react";
import { Mic, Clock, BarChart3 } from "lucide-react";
import TiltStage from "./TiltStage";

/**
 * HeroMockup — the hero visual. Replaces an earlier three.js "orbiting
 * globe" scene that clipped badly and read as an abstract shape
 * disconnected from the product. This is plain DOM + CSS 3D transforms
 * (via TiltStage): a tilted mockup of the actual Speaking > Describe
 * Image exam screen, with a couple of floating accent badges at
 * different depths. The same mechanic is reused per-module further
 * down the page (see ModuleMockups.tsx).
 */
export default function HeroMockup() {
  // Deterministic pseudo-random bar heights (no Math.random — stays
  // stable across server/client render).
  const bars = [40, 65, 90, 55, 100, 70, 45, 85, 60, 95, 50, 75, 100, 65, 40, 80, 55, 90, 70, 45];

  return (
    <TiltStage className="h-[420px] sm:h-[500px] lg:h-[540px]">
      {/* Main mockup — the exam interface */}
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
            <span className="ml-auto flex items-center gap-1 text-2xs font-mono text-mute">
              <Clock className="w-3 h-3" />
              00:38
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="text-2xs font-mono uppercase tracking-wider text-mute">
              Speaking · Describe Image
            </div>
            <p className="text-xs text-body leading-relaxed">
              Look at the image below. In 25 seconds, describe in detail what it shows.
            </p>

            {/* Mock chart the candidate has to describe */}
            <div className="rounded-lg bg-canvas-soft-2 border border-hairline p-3 flex items-end gap-1.5 h-20">
              <BarChart3 className="w-3.5 h-3.5 text-mute mr-1 mb-0.5" />
              {[30, 55, 40, 75, 60, 90, 50].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-gradient-brand-start to-gradient-brand-end opacity-70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Live waveform + recording state */}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-error rec-pulse shrink-0" />
              <div className="flex items-end gap-[3px] h-6 flex-1">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="waveform-bar flex-1 rounded-full bg-gradient-to-t from-gradient-brand-start via-gradient-brand-mid to-gradient-brand-end"
                    style={{ height: `${h}%`, animationDelay: `${(i % 7) * 0.12}s` }}
                  />
                ))}
              </div>
              <Mic className="w-3.5 h-3.5 text-gradient-brand-mid shrink-0" />
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
