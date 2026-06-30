"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";

interface AnswerShortQuestionProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      question?: string;
      correct_answer?: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

const RECORD_SECONDS = 10;
const PREP_RECORD_SECONDS = 3;

type Phase = "audio" | "prep" | "recording" | "done" | "submitted";

export default function AnswerShortQuestion({
  question,
  onSubmitAttempt,
  isSubmitting,
}: AnswerShortQuestionProps) {
  const { content } = question;

  const [phase, setPhase] = useState<Phase>("audio");
  const [recordCount, setRecordCount] = useState(RECORD_SECONDS);
  const [prepRecordCount, setPrepRecordCount] = useState(PREP_RECORD_SECONDS);
  const [transcript, setTranscript] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Audio state
  const [prepSeconds, setPrepSeconds] = useState<number | null>(3);
  const [audioStatus, setAudioStatus] = useState("Ready");
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef("");

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

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Audio prep countdown
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
    return () => {
      if (prepInterval) clearInterval(prepInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepSeconds, phase, volume]);

  // Pre-record countdown (3s)
  useEffect(() => {
    if (phase !== "prep") return;
    setPrepRecordCount(PREP_RECORD_SECONDS);
    const prepInterval = setInterval(() => {
      setPrepRecordCount((prev) => {
        if (prev <= 1) {
          clearInterval(prepInterval);
          setPhase("recording");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(prepInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Recording countdown + STT
  useEffect(() => {
    if (phase !== "recording") return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecordCount(RECORD_SECONDS);
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
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopRecognition();
    },
    []
  );

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopRecognition();
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
    setPrepRecordCount(PREP_RECORD_SECONDS);
    setTranscript("");
    setSubmitted(false);
    latestTranscriptRef.current = "";
  };

  const handleAudioEnded = () => {
    setAudioStatus("Audio Finished");
    setAudioProgress(100);
    setPrepRecordCount(PREP_RECORD_SECONDS);
    setPhase("prep");
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
    if (
      audioStatus === "Click to Play" &&
      audioRef.current &&
      prepSeconds === null
    ) {
      audioRef.current
        .play()
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
    stopRecognition();
    if (intervalRef.current) clearInterval(intervalRef.current);

    const finalTranscript = latestTranscriptRef.current || transcript;

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    let score = 0;
    let maxScore = 0;
    if (content.correct_answer) {
      maxScore = 1;
      const answerWords = norm(content.correct_answer).split(/\s+/).filter(Boolean);
      const transcriptWords = norm(finalTranscript).split(/\s+/).filter(Boolean);
      score = answerWords.every((w) => transcriptWords.includes(w)) ? 1 : 0;
    }

    setSubmitted(true);
    setPhase("submitted");
    onSubmitAttempt(score, maxScore, {
      transcript: finalTranscript,
      correct_answer: content.correct_answer,
    });
  };

  // ── RESULT VIEW ──────────────────────────────────────────────────────────
  if (phase === "submitted") {
    const finalTranscript = latestTranscriptRef.current || transcript;
    return (
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5 reveal-up">
        <div className="flex justify-between items-center pb-4 border-b border-hairline select-none flex-wrap gap-2">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Your Attempt &amp; Feedback
          </span>
          <span className="text-[10px] font-mono font-semibold text-success uppercase bg-success/5 border border-success/15 px-2.5 py-1 rounded">
            Submitted ✓
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
              Your Transcript
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-[14px] text-gray-800 leading-relaxed min-h-[48px]">
              {finalTranscript || (
                <span className="text-gray-400 italic">No speech detected</span>
              )}
            </div>
          </div>

          {content.correct_answer && (
            <div>
              <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
                Correct Answer
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-[14px] text-gray-800 leading-relaxed">
                {content.correct_answer}
              </div>
            </div>
          )}
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
  const circleLabel = phase === "recording" ? recordCount : "✓";
  const circleClass =
    phase === "recording"
      ? "border-red-500 text-red-600"
      : "border-green-500 text-green-600";
  const statusText =
    phase === "recording"
      ? `Recording: ${recordCount}s remaining`
      : phase === "done"
      ? "Recording complete — ready to submit"
      : "Response submitted";
  const statusClass =
    phase === "recording" ? "text-red-600" : "text-green-700";

  return (
    <div className="space-y-4">
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
          You will hear a question. Please give a simple and short answer. Often
          just one or a few words are enough.
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
        <div className="flex flex-col items-center py-8 bg-white select-none gap-6">
          {phase === "audio" ? (
            <div
              onClick={handleAudioBoxClick}
              className={`w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 ${
                audioStatus === "Click to Play"
                  ? "cursor-pointer hover:bg-[#5284A3]"
                  : ""
              }`}
            >
              <div className="w-full h-[6px] bg-[#3B6C8A]/40 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#1C415A] transition-all duration-300 ease-linear rounded-full"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <div className="text-white text-xs font-semibold px-1 mt-1 flex justify-start">
                {prepSeconds !== null ? (
                  <span>Beginning in {prepSeconds}s</span>
                ) : (
                  <span className="tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration || 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 mb-1">
                <Volume2 className="w-5 h-5 text-white" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="w-48 h-[3px] bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                  style={{
                    background: `linear-gradient(to right, white ${
                      volume * 100
                    }%, rgba(255,255,255,0.3) ${volume * 100}%)`,
                  }}
                />
              </div>
            </div>
          ) : phase === "prep" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-yellow-500 flex items-center justify-center text-xl font-semibold text-yellow-600 transition-all duration-300">
                {prepRecordCount}
              </div>
              <span className="text-[14px] font-medium text-yellow-600">
                Recording starts in {prepRecordCount} second
                {prepRecordCount !== 1 ? "s" : ""}…
              </span>
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

          {/* Live transcript during recording */}
          {phase === "recording" && (
            <div className="w-full max-w-lg px-4">
              <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
                Live Transcript
              </p>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 min-h-[40px] text-[14px] text-gray-700 leading-relaxed">
                {transcript || (
                  <span className="text-gray-400 italic">Listening…</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-between items-center select-none rounded-b-lg">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-[13px] uppercase rounded shadow transition"
          >
            RESTART
          </button>

          {(phase === "audio" || phase === "prep") && (
            <span className="text-[13px] text-gray-600 font-medium">
              {phase === "audio" ? "Listen carefully…" : "Get ready to speak…"}
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
