"use client";

import React, { useState, useEffect, useRef } from "react";
import { scoreFluency } from "@/lib/scoring/speaking";

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

function PercentBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? "bg-success/10 text-success border-success/20"
      : value >= 50
      ? "bg-warning-soft text-warning-deep border-warning-deep/20"
      : "bg-error-soft text-error-deep border-error/20";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-semibold border ${color}`}
    >
      {label}: {value}%
    </span>
  );
}

export default function DescribeImage({
  question,
  onSubmitAttempt,
  isSubmitting,
}: DescribeImageProps) {
  const { content } = question;

  const [phase, setPhase] = useState<Phase>("prep");
  const [prepCount, setPrepCount] = useState(PREP_SECONDS);
  const [recordCount, setRecordCount] = useState(RECORD_SECONDS);
  const [initKey, setInitKey] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<{ fluency: number } | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");
  const recordingStartRef = useRef(0);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
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

  // Recording countdown + STT
  useEffect(() => {
    if (phase !== "recording") return;

    clearTimer();
    setRecordCount(RECORD_SECONDS);
    recordingStartRef.current = Date.now();
    latestTranscriptRef.current = "";
    setTranscript("");

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

    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const full = (final + interim).trim();
        latestTranscriptRef.current = full;
        setTranscript(full);
      };

      recognition.onerror = () => {};

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
    }

    return () => {
      clearTimer();
      stopRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(() => () => { clearTimer(); stopRecognition(); }, []);

  const handleReset = () => {
    clearTimer();
    stopRecognition();
    setPhase("prep");
    setPrepCount(PREP_SECONDS);
    setRecordCount(RECORD_SECONDS);
    setTranscript("");
    setResult(null);
    latestTranscriptRef.current = "";
    recordingStartRef.current = 0;
    setInitKey((k) => k + 1);
  };

  const handleSubmit = () => {
    stopRecognition();
    clearTimer();

    const elapsedSeconds =
      recordingStartRef.current > 0
        ? Math.max(1, (Date.now() - recordingStartRef.current) / 1000)
        : RECORD_SECONDS;

    const finalTranscript = latestTranscriptRef.current || transcript;
    const fluency = scoreFluency(finalTranscript, elapsedSeconds);

    setResult({ fluency });
    setPhase("submitted");
    onSubmitAttempt(fluency, 100, {
      transcript: finalTranscript,
      image_url: content.image_url,
      fluency,
    });
  };

  // ── RESULT VIEW ──────────────────────────────────────────────────────────
  if (phase === "submitted" && result) {
    const finalTranscript = latestTranscriptRef.current || transcript;
    return (
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5 reveal-up">
        <div className="flex justify-between items-center pb-4 border-b border-hairline select-none flex-wrap gap-2">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Your Attempt &amp; Feedback
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-semibold text-success uppercase bg-success/5 border border-success/15 px-2.5 py-1 rounded">
              Submitted ✓
            </span>
            <PercentBadge label="Fluency" value={result.fluency} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Image thumbnail for reference */}
          {content.image_url && (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.image_url}
                alt="Image described"
                className="w-full h-auto"
                style={{ maxHeight: "300px", objectFit: "contain" }}
              />
              {content.description && (
                <p className="text-xs text-gray-500 text-center px-4 py-2 border-t border-gray-100">
                  {content.description}
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
              Your Transcript
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-[14px] text-gray-800 leading-relaxed min-h-[60px]">
              {finalTranscript || (
                <span className="text-gray-400 italic">No speech detected</span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-hairline select-none">
          <button
            onClick={handleReset}
            className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── QUESTION VIEW ─────────────────────────────────────────────────────────
  const circleCount =
    phase === "prep" ? prepCount : phase === "recording" ? recordCount : null;
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
      ? `Recording: ${recordCount}s remaining`
      : "Recording complete — ready to submit";

  const statusClass =
    phase === "prep"
      ? "text-gray-600"
      : phase === "recording"
      ? "text-red-600"
      : "text-green-700";

  return (
    <div className="space-y-4">
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

        {/* Live transcript during recording */}
        {phase === "recording" && (
          <div className="px-8 pb-6 bg-white">
            <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
              Live Transcript
            </p>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[48px] text-[14px] text-gray-700 leading-relaxed">
              {transcript || (
                <span className="text-gray-400 italic">Listening…</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-between items-center select-none rounded-b-lg">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-[13px] uppercase rounded shadow transition"
          >
            RESTART
          </button>

          {phase === "prep" && (
            <span className="text-[13px] text-gray-600 font-medium">
              Study the image carefully…
            </span>
          )}

          {(phase === "recording" || phase === "done") && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting…" : "SUBMIT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
