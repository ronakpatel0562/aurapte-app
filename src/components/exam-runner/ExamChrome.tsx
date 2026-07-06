"use client";

import React from "react";
import { Maximize2, Layers, Clock, HelpCircle, AlertTriangle, Sparkles, Info, X, RotateCw } from "lucide-react";

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
      <div className="bg-[#c9c4c4] px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#1e7a9c] flex items-center justify-center overflow-hidden shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="text-[13px] sm:text-[15px] font-semibold text-gray-800 truncate">AuraPTE</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {typeof clockSeconds === "number" && (
            <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-mono tabular-nums text-gray-700">
              <Clock className="w-3.5 h-3.5" />
              {formatClock(clockSeconds)}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-700">
            {!isFullscreen && (
              <button onClick={onEnterFullscreen} aria-label="Enter full screen">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <Layers className="w-3.5 h-3.5 hidden sm:block" />
            <span>{stepLabel}</span>
          </div>
        </div>
      </div>

      {/* Blue section bar */}
      <div className="bg-[#1e7a9c] text-white px-3 sm:px-6 py-1.5 flex items-center justify-between text-[11px] sm:text-xs font-semibold shrink-0 gap-2">
        <span className="truncate">{testTitle}</span>
        <span className="truncate text-right">{sectionLabel}</span>
      </div>

      {/* Portrait rotate hint — phones only, doesn't block use, just nudges
          toward the landscape layout the exam driver is designed for. */}
      <div className="exam-rotate-hint shrink-0 bg-[#fff4e0] text-[#ab570a] text-xs font-medium px-3 py-1.5 items-center justify-center gap-1.5 border-b border-[#f5d99a]">
        <RotateCw className="w-3.5 h-3.5" />
        Rotate your device for the best experience
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa] px-4 sm:px-6 md:px-10 py-5 sm:py-8 md:py-10 flex flex-col items-center">
        {children}
      </div>

      {/* Bottom bar */}
      <div className="bg-[#c9c4c4] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shrink-0 gap-2">
        <button
          onClick={onSaveExit}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-[#1e7a9c] text-white text-[11px] sm:text-xs font-semibold hover:bg-[#1c6f8f] transition whitespace-nowrap"
        >
          Save and Exit
        </button>
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="px-4 sm:px-5 py-1.5 sm:py-2 rounded bg-[#1e7a9c] text-white text-[11px] sm:text-xs font-semibold hover:bg-[#1c6f8f] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1e7a9c] whitespace-nowrap"
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
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded shadow-xl w-full max-w-[380px] overflow-hidden">
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
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded shadow-xl w-full max-w-[380px] overflow-hidden">
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
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded shadow-xl w-full max-w-[400px] overflow-hidden">
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
