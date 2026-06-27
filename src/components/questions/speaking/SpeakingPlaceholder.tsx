"use client";

import React, { useState } from "react";
import { Mic, Square, Play, Sparkles } from "lucide-react";
import AudioPlayer from "../shared/AudioPlayer";
import ComingSoonBanner from "../shared/ComingSoonBanner";

interface SpeakingPlaceholderProps {
  question: {
    id: string;
    title: string;
    content: {
      passage?: string;
      sentence?: string;
      image_url?: string;
      description?: string;
      scenario?: string;
      question?: string;
    };
  };
  type: string; // e.g. "read-aloud", "repeat-sentence", "describe-image", etc.
}

export default function SpeakingPlaceholder({
  question,
  type,
}: SpeakingPlaceholderProps) {
  const { content } = question;

  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setHasRecorded(false);
    setRecordTime(0);

    const interval = setInterval(() => {
      setRecordTime((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Context Presentation Card */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4">
        <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider block">
          Speaking Task Prompt
        </span>

        {type === "read-aloud" && content.passage && (
          <div className="text-body-md text-ink leading-relaxed font-geist select-text py-2">
            {content.passage}
          </div>
        )}

        {type === "repeat-sentence" && content.sentence && (
          <div className="space-y-4">
            <p className="text-xs text-body">Listen to the sentence below, then repeat it.</p>
            <AudioPlayer transcript={content.sentence} />
          </div>
        )}

        {type === "describe-image" && content.image_url && (
          <div className="space-y-4">
            <div className="border border-hairline rounded-md overflow-hidden max-w-md mx-auto bg-canvas-soft-2 aspect-[4/3] flex items-center justify-center relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.image_url}
                alt="Describe Image Source"
                className="object-contain w-full h-full"
              />
            </div>
            <p className="text-3xs text-center text-mute italic">
              Seeded mockup: {content.description}
            </p>
          </div>
        )}

        {type === "responding-to-situation" && content.scenario && (
          <div className="space-y-3 py-1">
            <div className="p-4 bg-canvas-soft-2 border border-hairline rounded-md font-geist space-y-2">
              <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider block">
                Situation Scenario
              </span>
              <p className="text-body-sm text-ink leading-relaxed font-medium">
                {content.scenario}
              </p>
            </div>
            <p className="text-body-sm text-mute leading-relaxed font-semibold">
              Prompt: {content.question}
            </p>
          </div>
        )}

        {type === "answer-short-question" && content.question && (
          <div className="text-body-md-strong font-semibold text-ink leading-relaxed py-2">
            {content.question}
          </div>
        )}
      </div>

      {/* 2. Recording Console Card */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card flex flex-col items-center justify-center text-center space-y-5">
        <span className="text-3xs font-semibold text-mute font-mono uppercase tracking-wider">
          Recording & Speech Capture Console
        </span>

        {/* Pulsing Visualizer or Timer */}
        <div className="relative flex flex-col items-center">
          <div
            className={`w-20 h-20 rounded-full border border-hairline flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? "bg-error/10 border-error animate-pulse scale-105"
                : "bg-canvas-soft hover:bg-canvas-soft-2"
            }`}
          >
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-8 h-8 rounded bg-error flex items-center justify-center cursor-pointer hover:bg-opacity-90 active:scale-95 transition"
                title="Stop Recording"
              >
                <Square className="w-3.5 h-3.5 fill-current text-on-primary" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer hover:bg-opacity-95 active:scale-95 transition shadow-vercel-card"
                title="Start Recording"
              >
                <Mic className="w-5 h-5 text-on-primary" />
              </button>
            )}
          </div>

          <span className="text-xs font-mono font-semibold text-ink mt-4">
            {isRecording
              ? `Recording: ${formatTime(recordTime)}`
              : hasRecorded
              ? "Recording Saved"
              : "Ready to Record"}
          </span>
        </div>

        {hasRecorded && (
          <div className="flex items-center gap-2 text-2xs font-mono text-success uppercase bg-success/5 border border-success/15 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-success" />
            <span>Voice Response Captured (Simulated)</span>
          </div>
        )}

        {/* Mic coming soon banner */}
        <ComingSoonBanner message="Microphone capture is mock-simulated. Voice analysis, transcript rendering, and pronunciation scoring algorithms are coming soon in Phase 2." />
      </div>
    </div>
  );
}
