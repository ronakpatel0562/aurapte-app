"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NEXT_DELAY_MS = 3000;

/**
 * First screen of a full Mock Test — the real PTE driver's "the test is
 * approximately 2 hours long" duration table, shown once before the
 * candidate ever sees Test Introduction / headset / mic checks. Next stays
 * disabled for a few seconds (never auto-advances) so the exam shell has
 * time to finish loading the test's questions in the background.
 *
 * This same component is also rendered by the route's loading.tsx (shown
 * the instant "Start Test" is clicked, before the server has the questions
 * loaded) and then again by the live MockExamRunner once data arrives —
 * two separate mounts. The countdown deadline is anchored in
 * sessionStorage (keyed by pathname) so the second mount picks up where
 * the first left off instead of restarting a fresh 3s wait.
 */
export default function TestOverviewScreen({ onLockChange }: { onLockChange?: (locked: boolean) => void }) {
  const pathname = usePathname();
  const [remainingMs, setRemainingMs] = useState(NEXT_DELAY_MS);

  useEffect(() => {
    const storageKey = `exam-overview-deadline:${pathname}`;
    const stored = Number(sessionStorage.getItem(storageKey));
    const deadline = stored > 0 ? stored : Date.now() + NEXT_DELAY_MS;
    if (!(stored > 0)) sessionStorage.setItem(storageKey, String(deadline));

    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemainingMs(left);
      if (left <= 0) sessionStorage.removeItem(storageKey);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [pathname]);

  const remaining = Math.ceil(remainingMs / 1000);

  // Kept free of side effects on the parent — calling `onLockChange` (the
  // parent's setState) from inside the tick above would run during
  // TestOverviewScreen's render phase and trigger React's "Cannot update a
  // component while rendering a different component" warning, so the lock
  // notification lives in its own effect.
  useEffect(() => {
    onLockChange?.(remainingMs > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs > 0]);

  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-base font-bold text-gray-800 mb-4">The test is approximately 2 hours long.</h2>

      <table className="border border-gray-400 text-sm text-gray-800 mb-4">
        <thead>
          <tr>
            <Th>Part</Th>
            <Th>Content</Th>
            <Th>Time allowed</Th>
          </tr>
        </thead>
        <tbody>
          <Row part="Intro" content="Introduction" time="1 minute" />
          <Row part="Part 1" content="Speaking and writing" time="46-67 minute" />
          <Row part="Part 2" content="Reading" time="27-38 minute" />
          <Row part="Part 3" content="Listening" time="30-37 minute" />
        </tbody>
      </table>

      <p className="text-xs text-gray-500 italic">
        {remaining > 0 ? `Next will be available in ${remaining} second${remaining === 1 ? "" : "s"}.` : "Click Next to proceed."}
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-gray-400 px-3 py-1.5 bg-gray-50 text-left font-bold italic text-gray-800">
      {children}
    </th>
  );
}

function Row({ part, content, time }: { part: string; content: string; time: string }) {
  return (
    <tr>
      <td className="border border-gray-400 px-3 py-1.5 italic text-[#1e7a9c]">{part}</td>
      <td className="border border-gray-400 px-3 py-1.5 italic text-[#1e7a9c]">{content}</td>
      <td className="border border-gray-400 px-3 py-1.5 italic text-[#1e7a9c]">{time}</td>
    </tr>
  );
}
