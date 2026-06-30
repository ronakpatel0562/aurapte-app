"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import ComingSoonBanner from "../shared/ComingSoonBanner";

interface RepeatSentenceProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      sentence?: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

const RECORD_SECONDS = 15;

type Phase = "audio" | "recording" | "done" | "submitted";

export default function RepeatSentence({
  question,
  onSubmitAttempt,
  isSubmitting,
}: RepeatSentenceProps) {
  const { content } = question;

  // Phase state machine
  const [phase, setPhase] = useState<Phase>("audio");
  const [recordCount, setRecordCount] = useState(RECORD_SECONDS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio state — mirrors listening components exactly
  const [prepSeconds, setPrepSeconds] = useState<number | null>(3);
  const [audioStatus, setAudioStatus] = useState<string>("Ready");
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist volume preference
  useEffect(() => {
    const saved = localStorage.getItem("portal_audio_volume");
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) {
        setVolume(parsed);
        if (audioRef.current) audioRef.current.volume = parsed;
      }
    } else {
      localStorage.setItem("portal_audio_volume", "1.0");
    }
  }, []);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    localStorage.setItem("portal_audio_volume", String(val));
  };

  // Prep countdown — identical to listening components
  useEffect(() => {
    if (phase !== "audio") return;
    let prepInterval: NodeJS.Timeout;
    if (prepSeconds !== null && prepSeconds > 0) {
      prepInterval = setInterval(() => {
        setPrepSeconds((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (prepSeconds === 0) {
      setPrepSeconds(null);
      setAudioStatus("Playing");
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.play().catch(() => setAudioStatus("Click to Play"));
      }
    }
    return () => { if (prepInterval) clearInterval(prepInterval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepSeconds, phase, volume]);

  // Recording countdown
  useEffect(() => {
    if (phase !== "recording") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Reset on question change
  useEffect(() => {
    handleReset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPhase("audio");
    setPrepSeconds(3);
    setAudioStatus("Ready");
    setAudioProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setRecordCount(RECORD_SECONDS);
  };

  const handleAudioEnded = () => {
    setAudioStatus("Audio Finished");
    setAudioProgress(100);
    setPhase("recording");
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const el = e.currentTarget;
    setCurrentTime(el.currentTime);
    if (el.duration) {
      setDuration(el.duration);
      setAudioProgress((el.currentTime / el.duration) * 100);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (e.currentTarget.duration) setDuration(e.currentTarget.duration);
  };

  const handleAudioBoxClick = () => {
    if (audioStatus === "Click to Play" && audioRef.current && prepSeconds === null) {
      audioRef.current.play()
        .then(() => setAudioStatus("Playing"))
        .catch(() => setAudioStatus("Click to Play"));
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleSubmit = () => {
    onSubmitAttempt(0, 0, { recorded: true, sentence: content.sentence });
    setPhase("submitted");
  };

  const circleLabel = phase === "recording" ? recordCount : "✓";
  const circleClass =
    phase === "recording"
      ? "border-red-500 text-red-600"
      : "border-green-500 text-green-600";
  const statusText =
    phase === "recording"
      ? `Recording: ${recordCount} seconds remaining`
      : phase === "done"
      ? "Recording complete — ready to submit"
      : "Response submitted";
  const statusClass =
    phase === "recording" ? "text-red-600" : "text-green-700";

  return (
    <div className="space-y-6">
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; height: 12px; width: 12px;
          border-radius: 50%; background: white; cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          height: 12px; width: 12px; border-radius: 50%;
          background: white; cursor: pointer; border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>

      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans">
        {/* Instructions */}
        <div className="px-6 py-5 text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          You will hear a sentence. Please repeat the sentence exactly as you
          hear it. You will hear the sentence only once.
        </div>

        {content.audio_url && (
          <audio
            ref={audioRef}
            src={content.audio_url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
          />
        )}

        {/* Content area */}
        <div className="flex justify-center items-center py-10 bg-white select-none">
          {phase === "audio" ? (
            <div
              onClick={handleAudioBoxClick}
              className={`w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 ${
                audioStatus === "Click to Play" ? "cursor-pointer hover:bg-[#5284A3]" : ""
              }`}
            >
              {/* Progress bar */}
              <div className="w-full h-[6px] bg-[#3B6C8A]/40 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#1C415A] transition-all duration-300 ease-linear rounded-full"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>

              {/* Time / countdown */}
              <div className="text-white text-xs font-semibold px-1 mt-1 flex justify-start">
                {prepSeconds !== null ? (
                  <span>Beginning in {prepSeconds}s</span>
                ) : (
                  <span className="tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration || 0)}
                  </span>
                )}
              </div>

              {/* Volume control */}
              <div className="flex items-center justify-center gap-3 mb-1">
                <Volume2 className="w-5 h-5 text-white" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-48 h-[3px] bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                  style={{
                    background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-semibold transition-colors duration-300 ${circleClass}`}
              >
                {circleLabel}
              </div>
              <span className={`text-[14px] font-medium ${statusClass}`}>
                {statusText}
              </span>
            </div>
          )}
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

          {(phase === "audio" || phase === "recording") && (
            <span className="text-[13px] text-gray-600 font-medium">
              {phase === "audio" ? "Listen carefully…" : "Recording in progress…"}
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

      <ComingSoonBanner message="Microphone capture is mock-simulated. Voice analysis and pronunciation scoring are coming soon in Phase 2." />
    </div>
  );
}
