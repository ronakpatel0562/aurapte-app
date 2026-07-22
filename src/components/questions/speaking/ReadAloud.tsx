"use client";

import React, { useState, useEffect, useRef } from "react";
import { scoreFluency, scorePronunciation } from "@/lib/scoring/speaking";

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
  isPremium?: boolean;
}

const PREP_SECONDS = 35;
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

export default function ReadAloud({
  question,
  onSubmitAttempt,
  isSubmitting,
}: ReadAloudProps) {
  const { content } = question;

  const [phase, setPhase] = useState<Phase>("prep");
  const [prepCount, setPrepCount] = useState(PREP_SECONDS);
  const [recordCount, setRecordCount] = useState(RECORD_SECONDS);
  const [initKey, setInitKey] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<{
    fluency: number;
    pronunciation: number;
  } | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  // Count of event.results entries already committed into finalTranscriptRef.
  // Android's SpeechRecognition frequently reports an unreliable/stale
  // event.resultIndex, so results are deduped by index count instead of
  // trusting resultIndex to skip already-processed entries.
  const finalIndexRef = useRef(0);
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
    finalTranscriptRef.current = "";
    finalIndexRef.current = 0;
    setTranscript("");

    // Start countdown
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

    // Start speech recognition
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
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            if (i >= finalIndexRef.current) {
              finalTranscriptRef.current += event.results[i][0].transcript + " ";
              finalIndexRef.current = i + 1;
            }
          } else {
            interim = event.results[i][0].transcript;
          }
        }
        const full = (finalTranscriptRef.current + interim).trim();
        latestTranscriptRef.current = full;
        setTranscript(full);
      };

      recognition.onerror = () => {};

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          // Mobile browsers (esp. Android Chrome) ignore `continuous` and
          // end the session after each pause. Each restart hands back a
          // FRESH event.results list indexed from 0, so the per-session
          // committed count must reset too — otherwise the carried-over
          // finalIndexRef makes the `i >= finalIndexRef` guard in onresult
          // reject every new final result and the live transcript freezes
          // after the first restart. Already-committed text is safe in
          // finalTranscriptRef, so this loses nothing.
          finalIndexRef.current = 0;
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

  // Reset on question change
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
    finalTranscriptRef.current = "";
    finalIndexRef.current = 0;
    recordingStartRef.current = 0;
    setInitKey((k) => k + 1);
  };

  const handleStartRecording = () => {
    if (phase !== "prep") return;
    clearTimer();
    setPhase("recording");
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
    const pronunciation = scorePronunciation(
      finalTranscript,
      content.passage || ""
    );

    setResult({ fluency, pronunciation });
    setPhase("submitted");
    onSubmitAttempt(
      Math.round((fluency + pronunciation) / 2),
      100,
      { transcript: finalTranscript, passage: content.passage, fluency, pronunciation }
    );
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
            <PercentBadge label="Pronunciation" value={result.pronunciation} />
          </div>
        </div>

        <div className="space-y-4">
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

          <div>
            <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
              Correct Passage
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-[14px] text-gray-800 leading-relaxed">
              {content.passage ?? "No passage provided."}
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
  const circleLabel =
    phase === "prep" ? prepCount : phase === "recording" ? recordCount : "✓";

  const statusText =
    phase === "prep"
      ? `Recording in ${prepCount} seconds`
      : phase === "recording"
      ? `Recording: ${recordCount}s remaining`
      : "Recording complete — ready to submit";

  const circleClass =
    phase === "recording"
      ? "border-red-500 text-red-600"
      : phase === "done"
      ? "border-green-500 text-green-600"
      : "border-gray-500 text-gray-700";

  const statusClass =
    phase === "recording"
      ? "text-red-600"
      : phase === "done"
      ? "text-green-700"
      : "text-gray-600";

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans">
        {/* Instructions */}
        <div className="px-6 py-5 text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          Look at the text below. In {PREP_SECONDS} seconds, you must read this
          text aloud as naturally and clearly as possible. You have{" "}
          {RECORD_SECONDS} seconds to read aloud.
        </div>

        {/* Countdown row */}
        <div className="flex justify-center items-center gap-4 py-8 select-none">
          <div
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-semibold transition-colors duration-300 ${circleClass}`}
          >
            {circleLabel}
          </div>
          <span className={`text-[14px] font-medium ${statusClass}`}>
            {statusText}
          </span>
        </div>

        {/* Passage */}
        <div className="px-8 pb-6">
          <div className="border border-gray-300 rounded-lg p-5 bg-white leading-relaxed select-text">
            <p className="text-[15px] text-gray-800">
              {content.passage ?? "No passage content provided."}
            </p>
          </div>
        </div>

        {/* Live transcript during recording */}
        {phase === "recording" && (
          <div className="px-8 pb-6">
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
        <div className="border-t border-gray-200 p-4 flex justify-between items-center select-none rounded-b-lg">
          <button
            onClick={handleReset}
            disabled={phase === "submitted"}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            RESTART
          </button>

          {phase === "prep" ? (
            <button
              onClick={handleStartRecording}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition"
            >
              Start Recording
            </button>
          ) : (
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
