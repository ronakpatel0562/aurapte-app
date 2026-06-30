"use client";

import React, { useState, useEffect, useRef } from "react";
import ComingSoonBanner from "../shared/ComingSoonBanner";

interface DescribeImageProps {
  question: {
    id: string;
    title: string;
    content: {
      image_url?: string;
      description?: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

const PREP_SECONDS = 25;
const RECORD_SECONDS = 40;

type Phase = "prep" | "recording" | "done" | "submitted";

export default function DescribeImage({
  question,
  onSubmitAttempt,
  isSubmitting,
}: DescribeImageProps) {
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

  // Prep countdown
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

  // Reset on question change
  useEffect(() => {
    clearTimer();
    setPhase("prep");
    setPrepCount(PREP_SECONDS);
    setRecordCount(RECORD_SECONDS);
    setSubmitted(false);
    setInitKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

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
    onSubmitAttempt(0, 0, { recorded: true, image_url: content.image_url });
  };

  const circleCount =
    phase === "prep"
      ? prepCount
      : phase === "recording"
      ? recordCount
      : null;

  const circleLabel = circleCount !== null ? circleCount : "✓";

  const circleClass =
    phase === "prep"
      ? "border-gray-400 text-gray-700"
      : phase === "recording"
      ? "border-red-500 text-red-600"
      : "border-green-500 text-green-600";

  const statusText =
    phase === "prep"
      ? `Recording in ${prepCount} seconds`
      : phase === "recording"
      ? `Recording: ${recordCount} seconds remaining`
      : phase === "done"
      ? "Recording complete — ready to submit"
      : "Response submitted";

  const statusClass =
    phase === "prep"
      ? "text-gray-600"
      : phase === "recording"
      ? "text-red-600"
      : "text-green-700";

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans">
        {/* Instructions */}
        <div className="px-6 py-5 text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          Look at the graph below. In {PREP_SECONDS} seconds, please speak into
          the microphone and describe in detail what the graph is showing. You
          will have {RECORD_SECONDS} seconds to give your response.
        </div>

        {/* Image + countdown row */}
        <div className="px-8 py-8 bg-white">
          <div className="flex items-center gap-8">
            {/* Image box */}
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              {content.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.image_url}
                  alt="Image to describe"
                  className="w-full h-auto"
                  style={{ maxHeight: "420px", objectFit: "contain" }}
                />
              ) : (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                  No image provided
                </div>
              )}
              {content.description && (
                <p className="text-xs text-gray-500 text-center px-4 py-2 border-t border-gray-100">
                  {content.description}
                </p>
              )}
            </div>

            {/* Countdown circle */}
            <div className="flex flex-col items-center gap-3 select-none shrink-0 w-36">
              <div
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl font-semibold transition-colors duration-300 ${circleClass}`}
              >
                {circleLabel}
              </div>
              <span
                className={`text-[13px] font-medium text-center leading-snug ${statusClass}`}
              >
                {statusText}
              </span>
            </div>
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
              {phase === "prep"
                ? "Study the image carefully…"
                : "Recording in progress…"}
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

      <ComingSoonBanner message="Microphone capture is mock-simulated. Voice analysis and image-description scoring are coming soon in Phase 2." />
    </div>
  );
}
