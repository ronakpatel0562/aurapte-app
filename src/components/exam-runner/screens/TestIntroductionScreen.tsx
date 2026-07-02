"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const DISPLAY_TOTAL_SECONDS = 55;

/**
 * Second screen of a full Mock Test — the real PTE driver's "Test
 * Introduction" copy. The little clock widget is the same one the driver
 * uses to illustrate "the timer will be shown in the top right corner of
 * your screen"; it just counts up for demonstration and never blocks Next.
 */
export default function TestIntroductionScreen() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((s) => (s >= DISPLAY_TOTAL_SECONDS ? s : s + 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Test Introduction</h2>
      <p className="text-sm text-gray-800 mb-4">
        This test will measure the English Reading, Writing, Listening and Speaking skills that you need in
        an academic setting.
      </p>

      <p className="text-sm text-gray-800 mb-4">
        - The test is divided into 3 parts. Each part may contain a number of sections. The sections are
        individually timed. The timer will be shown in the top right corner of your screen. The number of
        items in the section will also be displayed.
      </p>

      <div className="flex items-center gap-2.5 bg-gray-100 border border-gray-300 rounded px-4 py-2.5 w-fit mb-4 text-gray-600">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-mono tabular-nums">
          {formatClock(elapsed)} / {formatClock(DISPLAY_TOTAL_SECONDS)}
        </span>
      </div>

      <p className="text-sm text-gray-800 mb-4">
        - At the beginning of each part you will receive instructions. These will provide details on what
        to expect in that part of the test.
      </p>

      <p className="text-sm text-gray-800 mb-4">
        - By clicking on the Next button at the bottom of each screen you confirm your answer and move to
        the next question. If you click on Next you will not be able to return to the previous question.
        You will not be able to revisit any questions at the end of the test.
      </p>

      <p className="text-sm text-gray-800 mb-4">
        - You will be offered a break of up to 10 minutes after Part 2. The break is optional.
      </p>

      <p className="text-sm text-gray-800">
        - This test makes use of different varieties of English, for example, British, American,
        Australian. You can answer in the standard English variety of your choice.
      </p>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
