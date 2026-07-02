"use client";

import { useState } from "react";
import ExamChrome from "@/components/exam-runner/ExamChrome";
import TestOverviewScreen from "@/components/exam-runner/screens/TestOverviewScreen";

// Shown the instant "Start Exam" is clicked, before the server has finished
// loading this test's questions — it's the same Test Overview screen the
// real MockExamRunner opens with, so the swap from loading -> live is
// seamless instead of flashing a generic skeleton. Next stays disabled for
// TestOverviewScreen's own countdown (shared with the live screen via
// sessionStorage so the wait doesn't restart on swap); there's no real
// exam state to advance into yet regardless.
export default function Loading() {
  const [locked, setLocked] = useState(true);
  return (
    <ExamChrome
      testTitle=""
      sectionLabel=""
      stepLabel="1 of 1"
      isFullscreen
      onEnterFullscreen={() => {}}
      onSaveExit={() => {}}
      onNext={() => {}}
      nextDisabled={locked}
    >
      <TestOverviewScreen onLockChange={setLocked} />
    </ExamChrome>
  );
}
