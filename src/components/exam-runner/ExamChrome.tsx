"use client";

import React from "react";
import { Maximize2, Layers, Clock, HelpCircle, AlertTriangle, Sparkles, Info, X } from "lucide-react";

/**
 * Fullscreen exam-driver chrome — header, blue section bar, and bottom
 * action bar — cloned from the real PTE test driver so a practice test
 * "looks like the same exact portal" the student sits the real exam in.
 */
export default function ExamChrome({
  testTitle,
  sectionLabel,
  stepLabel,
  clockSeconds,
  isFullscreen,
  onEnterFullscreen,
  onSaveExit,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  children,
}: {
  testTitle: string;
  sectionLabel: string;
  stepLabel: string;
  clockSeconds?: number | null;
  isFullscreen: boolean;
  onEnterFullscreen: () => void;
  onSaveExit: () => void;
  onNext: () => void;
  nextLabel?: string;
  /** Disables the Next button without the "Cannot Skip" modal — used for
   *  timed reveals (e.g. the 3-second pre-Next delay on the overview
   *  screen) rather than answer-validation locks. */
  nextDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans select-none">
      {/* Header */}
      <div className="bg-[#c9c4c4] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#1e7a9c] flex items-center justify-center overflow-hidden">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-gray-800">AuraPTE</span>
        </div>
        <div className="flex items-center gap-4">
          {typeof clockSeconds === "number" && (
            <span className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-gray-700">
              <Clock className="w-3.5 h-3.5" />
              {formatClock(clockSeconds)}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-700">
            {!isFullscreen && (
              <button onClick={onEnterFullscreen} aria-label="Enter full screen">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <Layers className="w-3.5 h-3.5" />
            <span>{stepLabel}</span>
          </div>
        </div>
      </div>

      {/* Blue section bar */}
      <div className="bg-[#1e7a9c] text-white px-6 py-1.5 flex items-center justify-between text-xs font-semibold shrink-0">
        <span>{testTitle}</span>
        <span>{sectionLabel}</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa] px-10 py-10 flex flex-col items-center">
        {children}
      </div>

      {/* Bottom bar */}
      <div className="bg-[#c9c4c4] px-4 py-2.5 flex items-center justify-between shrink-0">
        <button
          onClick={onSaveExit}
          className="px-4 py-2 rounded bg-[#1e7a9c] text-white text-xs font-semibold hover:bg-[#1c6f8f] transition"
        >
          Save and Exit
        </button>
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="px-5 py-2 rounded bg-[#1e7a9c] text-white text-xs font-semibold hover:bg-[#1c6f8f] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1e7a9c]"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function ConfirmModal({
  message,
  onYes,
  onNo,
}: {
  message: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded shadow-xl w-[380px] overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800">
          Confirm
        </div>
        <div className="px-5 py-5 flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-[#1e7a9c] shrink-0" />
          <p className="text-sm text-gray-800">{message}</p>
        </div>
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            onClick={onYes}
            className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className="px-4 py-1.5 bg-[#1e7a9c] text-white rounded text-sm font-medium hover:bg-[#1c6f8f] transition"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export function CannotSkipModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded shadow-xl w-[380px] overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">Cannot Skip</span>
          <button onClick={onClose} aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-5 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[#1e7a9c] flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm text-gray-800">
            You need to finish answering this question before going to the next.
          </p>
        </div>
        <div className="px-5 pb-5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function SaveExitModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded shadow-xl w-[400px] overflow-hidden">
        <div className="bg-[#1e7a9c] px-4 py-2.5 text-sm font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Save &amp; Exit?
        </div>
        <div className="px-5 py-5 text-center">
          <p className="text-sm text-gray-800">
            This will <strong>submit your test</strong> and show your result.
          </p>
          <p className="text-xs text-gray-500 mt-1.5">You won&apos;t be able to return to this test after submitting.</p>
        </div>
        <div className="px-5 pb-5 flex items-center justify-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 bg-[#1e7a9c] text-white rounded text-sm font-medium hover:bg-[#1c6f8f] transition"
          >
            Submit &amp; Exit
          </button>
        </div>
      </div>
    </div>
  );
}
