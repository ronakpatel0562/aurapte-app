"use client";

import { Loader2 } from "lucide-react";
import ExamChrome from "@/components/exam-runner/ExamChrome";

// Shown the instant "Start Exam" is clicked, before the server has finished
// loading this test's questions — matches the fullscreen exam shell the
// live ExamRunner opens into, so the swap from loading -> live doesn't
// flash a mismatched dashboard-styled skeleton. Which screen comes first
// (headset check vs. section intro) depends on the module, which isn't
// known here, so this shows a generic "preparing" placeholder instead.
export default function Loading() {
  return (
    <ExamChrome
      testTitle=""
      sectionLabel=""
      stepLabel="1 of 1"
      isFullscreen
      onEnterFullscreen={() => {}}
      onSaveExit={() => {}}
      onNext={() => {}}
      nextDisabled
    >
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Preparing your test…</p>
      </div>
    </ExamChrome>
  );
}
