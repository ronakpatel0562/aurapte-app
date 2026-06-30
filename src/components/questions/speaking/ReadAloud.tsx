"use client";

import React, { useState, useEffect, useRef } from "react";
import ComingSoonBanner from "../shared/ComingSoonBanner";

interface ReadAloudProps {
  question: {
    id: string;
    title: string;
    content: {
      passage?: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

const PREP_SECONDS = 35;
const RECORD_SECONDS = 40;

type Phase = "prep" | "recording" | "done" | "submitted";

export default function ReadAloud({
  question,
  onSubmitAttempt,
  isSubmitting,
}: ReadAloudProps) {
  const { content } = question;

  const [phase, setPhase] = useState<Phase>("prep");
  const [prepCount, setPrepCount] = useState(PREP_SECONDS);
  const [recordCount, setRecordCount] = useState(RECORD_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const [initKey, setInitKey] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Prep countdown — re-runs when phase enters "prep" or initKey bumps (question changed)
  useEffect(() => {
    if (phase !== "prep") return;
    clearTimer();
    setPrepCount(PREP_SECONDS);
    intervalRef.current = setInterval(() => {
      setPrepCount((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setPhase("recording");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, initKey]);

  // Recording countdown
  useEffect(() => {
    if (phase !== "recording") return;
    clearTimer();
    setRecordCount(RECORD_SECONDS);
    intervalRef.current = setInterval(() => {
      setRecordCount((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setPhase("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Reset everything when the question changes
  useEffect(() => {
    clearTimer();
    setPhase("prep");
    setPrepCount(PREP_SECONDS);
    setRecordCount(RECORD_SECONDS);
    setSubmitted(false);
    setInitKey((k) => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), []);

  const handleReset = () => {
    clearTimer();
    setPhase("prep");
    setPrepCount(PREP_SECONDS);
    setRecordCount(RECORD_SECONDS);
    setSubmitted(false);
    setInitKey((k) => k + 1);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    setPhase("submitted");
    onSubmitAttempt(0, 0, { recorded: true, passage: content.passage });
  };

  const circleLabel =
    phase === "prep"
      ? prepCount
      : phase === "recording"
      ? recordCount
      : "✓";

  const statusText =
    phase === "prep"
      ? `Recording in ${prepCount} seconds`
      : phase === "recording"
      ? `Recording: ${recordCount} seconds remaining`
      : phase === "done"
      ? "Recording complete — ready to submit"
      : "Response submitted";

  const circleClass =
    phase === "recording"
      ? "border-red-500 text-red-600"
      : phase === "done" || phase === "submitted"
      ? "border-green-500 text-green-600"
      : "border-gray-500 text-gray-700";

  const statusClass =
    phase === "recording"
      ? "text-red-600"
      : phase === "done" || phase === "submitted"
      ? "text-green-700"
      : "text-gray-600";

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans">

        {/* Instructions */}
        <div className="px-6 py-5 text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          Look at the text below. In {PREP_SECONDS} seconds, you must read this
          text aloud as naturally and clearly as possible. You have{" "}
          {RECORD_SECONDS} seconds to read aloud. Read the text aloud and record
          your response.
        </div>

        {/* Countdown / Status row */}
        <div className="flex justify-center items-center gap-4 py-10 bg-[#FAF9F6] select-none">
          <div
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-semibold transition-colors duration-300 ${circleClass}`}
          >
            {circleLabel}
          </div>
          <span className={`text-[14px] font-medium ${statusClass}`}>
            {statusText}
          </span>
        </div>

        {/* Passage box */}
        <div className="px-8 pb-8 bg-white">
          <div className="border border-gray-300 rounded-lg p-5 bg-white leading-relaxed select-text">
            <p className="text-[15px] text-gray-800">
              {content.passage ?? "No passage content provided."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-between items-center select-none rounded-b-lg">
          <button
            onClick={handleReset}
            disabled={phase === "submitted"}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            RESTART
          </button>

          {(phase === "prep" || phase === "recording") && (
            <span className="text-[13px] text-gray-600 font-medium">
              {phase === "prep" ? "Prepare to read aloud…" : "Recording in progress…"}
            </span>
          )}

          {phase === "done" && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting…" : "SUBMIT"}
            </button>
          )}

          {phase === "submitted" && (
            <span className="text-[13px] font-bold text-gray-700 uppercase">
              Submitted
            </span>
          )}
        </div>
      </div>

      <ComingSoonBanner message="Microphone capture is mock-simulated. Voice analysis, transcript rendering, and pronunciation scoring algorithms are coming soon in Phase 2." />
    </div>
  );
}
