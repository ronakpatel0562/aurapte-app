"use client";

import React from "react";
import { Clock, Type, GripVertical, Play, Globe } from "lucide-react";
import TiltStage from "./TiltStage";

const MOCKUP_HEIGHT = "h-[380px] sm:h-[440px] lg:h-[480px]";

/**
 * WritingMockup — Summarize Written Text / Write an Email. Shows the
 * source passage, a text editor with a live word-count meter, matching
 * the platform's actual word-count enforcement.
 */
export function WritingMockup() {
  return (
    <TiltStage className={MOCKUP_HEIGHT} restX={7} restY={10}>
      <div
        className="absolute left-1/2 top-1/2 w-[300px] sm:w-[340px]"
        style={{ transform: "translate(-50%, -50%) translateZ(10px)" }}
      >
        <div className="rounded-2xl border border-hairline bg-canvas shadow-vercel-modal overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-hairline bg-canvas-soft-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
            <span className="ml-auto flex items-center gap-1 text-2xs font-mono text-mute">
              <Clock className="w-3 h-3" />
              10:00
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="text-2xs font-mono uppercase tracking-wider text-mute">
              Writing · Summarize Written Text
            </div>

            {/* Source passage */}
            <div className="rounded-lg bg-canvas-soft-2 border border-hairline p-3 space-y-1.5">
              <div className="h-1.5 rounded-full bg-hairline-strong w-full" />
              <div className="h-1.5 rounded-full bg-hairline-strong w-[92%]" />
              <div className="h-1.5 rounded-full bg-hairline-strong w-[75%]" />
              <div className="h-1.5 rounded-full bg-hairline-strong w-[85%]" />
            </div>

            {/* Editor with typed summary */}
            <div className="rounded-lg border border-hairline bg-canvas p-3 space-y-1.5 min-h-[64px]">
              <div className="h-2 rounded-full bg-gradient-to-r from-gradient-preview-start to-gradient-preview-end opacity-70 w-full" />
              <div className="h-2 rounded-full bg-gradient-to-r from-gradient-preview-start to-gradient-preview-end opacity-70 w-[80%]" />
              <div className="flex items-center gap-1">
                <div className="h-2 rounded-full bg-gradient-to-r from-gradient-preview-start to-gradient-preview-end opacity-70 w-[35%]" />
                <span className="w-[2px] h-3 bg-ink rec-pulse" />
              </div>
            </div>

            {/* Word-count meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-2xs text-mute">
                <span>Word count</span>
                <span className="font-mono font-semibold text-ink">48 / 75</span>
              </div>
              <div className="h-1.5 rounded-full bg-canvas-soft-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gradient-preview-start to-gradient-preview-end" style={{ width: "64%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute right-2 top-4 sm:right-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(90px)", animationDelay: "0.5s" }}
      >
        <div className="flex items-center gap-2 bg-canvas/90 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-popover">
          <Type className="w-3.5 h-3.5 text-gradient-preview-end" />
          <span className="text-xs font-semibold text-ink">Live word-count enforcement</span>
        </div>
      </div>

      <div
        className="absolute left-2 bottom-4 sm:left-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(-60px)", animationDelay: "1.3s" }}
      >
        <div className="bg-canvas/80 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-card">
          <div className="text-2xs font-mono uppercase tracking-wider text-mute">2 task types</div>
          <div className="text-xs font-semibold text-ink mt-0.5">Summarize Text · Write Email</div>
        </div>
      </div>
    </TiltStage>
  );
}

/**
 * ReadingMockup — Re-order Paragraphs. Shows draggable paragraph
 * blocks, one visibly lifted, to represent the actual interaction.
 */
export function ReadingMockup() {
  const blocks = [
    { n: 1, w: "88%", lifted: false },
    { n: 2, w: "70%", lifted: true },
    { n: 3, w: "95%", lifted: false },
    { n: 4, w: "60%", lifted: false },
  ];

  return (
    <TiltStage className={MOCKUP_HEIGHT} restX={7} restY={-10}>
      <div
        className="absolute left-1/2 top-1/2 w-[300px] sm:w-[340px]"
        style={{ transform: "translate(-50%, -50%) translateZ(10px)" }}
      >
        <div className="rounded-2xl border border-hairline bg-canvas shadow-vercel-modal overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-hairline bg-canvas-soft-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
            <span className="ml-auto text-2xs font-mono text-mute">Self-paced</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="text-2xs font-mono uppercase tracking-wider text-mute">
              Reading · Re-order Paragraphs
            </div>
            <p className="text-xs text-body leading-relaxed">
              Restore the original order by dragging the paragraphs below.
            </p>

            <div className="space-y-2">
              {blocks.map((b) => (
                <div
                  key={b.n}
                  className={`flex items-center gap-2 rounded-lg border p-2 bg-canvas ${
                    b.lifted ? "border-gradient-ship-start/50 shadow-vercel-popover -translate-x-1" : "border-hairline"
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-mute shrink-0" />
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-gradient-ship-start to-gradient-ship-end text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                    {b.n}
                  </span>
                  <div className="h-1.5 rounded-full bg-hairline-strong flex-1" style={{ width: b.w }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute right-2 top-4 sm:right-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(90px)", animationDelay: "0.7s" }}
      >
        <div className="flex items-center gap-2 bg-canvas/90 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-popover">
          <GripVertical className="w-3.5 h-3.5 text-gradient-ship-start" />
          <span className="text-xs font-semibold text-ink">Drag & drop, just like the exam</span>
        </div>
      </div>

      <div
        className="absolute left-2 bottom-4 sm:left-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(-60px)", animationDelay: "1.5s" }}
      >
        <div className="bg-canvas/80 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-card">
          <div className="text-2xs font-mono uppercase tracking-wider text-mute">5 task types</div>
          <div className="text-xs font-semibold text-ink mt-0.5">Blanks · Reorder · MCQ</div>
        </div>
      </div>
    </TiltStage>
  );
}

/**
 * ListeningMockup — Write from Dictation. Shows an audio scrubber with
 * a playback waveform and a dictation input field.
 */
export function ListeningMockup() {
  const bars = [35, 55, 40, 70, 50, 85, 45, 60, 75, 40, 55, 65, 35, 50, 80, 45, 60, 40, 55, 70];

  return (
    <TiltStage className={MOCKUP_HEIGHT} restX={7} restY={10}>
      <div
        className="absolute left-1/2 top-1/2 w-[300px] sm:w-[340px]"
        style={{ transform: "translate(-50%, -50%) translateZ(10px)" }}
      >
        <div className="rounded-2xl border border-hairline bg-canvas shadow-vercel-modal overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-hairline bg-canvas-soft-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
            <span className="ml-auto text-2xs font-mono text-mute">00:12 / 00:45</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="text-2xs font-mono uppercase tracking-wider text-mute">
              Listening · Write From Dictation
            </div>
            <p className="text-xs text-body leading-relaxed">
              Type the sentence exactly as you hear it before it disappears.
            </p>

            {/* Audio player */}
            <div className="rounded-lg bg-canvas-soft-2 border border-hairline p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-gradient-develop-start to-gradient-preview-start flex items-center justify-center shrink-0">
                  <Play className="w-3 h-3 text-white fill-white" />
                </span>
                <div className="flex items-end gap-[2px] h-6 flex-1">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="waveform-bar flex-1 rounded-full bg-gradient-to-t from-gradient-develop-start to-gradient-preview-start opacity-80"
                      style={{ height: `${h}%`, animationDelay: `${(i % 6) * 0.15}s`, animationDuration: "1.8s" }}
                    />
                  ))}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-hairline overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gradient-develop-start to-gradient-preview-start" style={{ width: "28%" }} />
              </div>
            </div>

            {/* Dictation input */}
            <div className="rounded-lg border border-hairline bg-canvas p-2.5 flex items-center gap-1">
              <div className="h-2 rounded-full bg-hairline-strong w-[60%]" />
              <span className="w-[2px] h-3 bg-ink rec-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute right-2 top-4 sm:right-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(90px)", animationDelay: "0.9s" }}
      >
        <div className="flex items-center gap-2 bg-canvas/90 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-popover">
          <Globe className="w-3.5 h-3.5 text-gradient-develop-start" />
          <span className="text-xs font-semibold text-ink">Zero-buffer cloud audio</span>
        </div>
      </div>

      <div
        className="absolute left-2 bottom-4 sm:left-4 hidden sm:block float-bob"
        style={{ transform: "translateZ(-60px)", animationDelay: "1.7s" }}
      >
        <div className="bg-canvas/80 backdrop-blur-xl border border-hairline rounded-xl px-3 py-2 shadow-vercel-card">
          <div className="text-2xs font-mono uppercase tracking-wider text-mute">7 task types</div>
          <div className="text-xs font-semibold text-ink mt-0.5">Dictation · MCQ · Fill Blanks</div>
        </div>
      </div>
    </TiltStage>
  );
}
