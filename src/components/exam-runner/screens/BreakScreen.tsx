"use client";

import React from "react";
import { Coffee } from "lucide-react";

/**
 * Optional break offered after Part 2 (Reading), before Part 3 (Listening)
 * begins — matches the promise made on the Test Introduction screen. The
 * countdown itself lives in ExamChrome's header clock slot (via
 * `remainingSeconds` passed down by MockExamRunner); this just renders the
 * body copy plus a large centered readout so it's not easy to miss.
 */
export default function BreakScreen({ remainingSeconds }: { remainingSeconds: number }) {
  return (
    <div className="max-w-xl text-center">
      <div className="w-14 h-14 rounded-full bg-[#1e7a9c]/10 flex items-center justify-center mx-auto mb-4">
        <Coffee className="w-7 h-7 text-[#1e7a9c]" />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">Optional Break</h2>
      <p className="text-sm text-gray-800 mb-6">
        You have completed Part 2. You may take a break of up to 10 minutes before Part 3 (Listening)
        begins. The break is optional — click <span className="text-[#1e7a9c] font-semibold">Resume Now</span> whenever
        you&apos;re ready to continue.
      </p>
      <div className="text-4xl font-mono font-bold text-[#1e7a9c] tabular-nums mb-2">
        {formatClock(remainingSeconds)}
      </div>
      <p className="text-xs text-gray-500">The test will resume automatically when the timer reaches 0:00.</p>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
