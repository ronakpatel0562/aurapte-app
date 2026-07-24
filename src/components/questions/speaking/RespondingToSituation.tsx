"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { scoreFluency } from "@/lib/scoring/speaking";
import { playRecordingBeep } from "@/lib/audio/beep";
import { useRecordedAudio } from "@/lib/audio/useRecordedAudio";

interface RespondingToSituationProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      scenario?: string;
      question?: string;
      model_answer?: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
  isPremium?: boolean;
}

const THINK_SECONDS = 20;
const RECORD_SECONDS = 40;

type Phase = "audio" | "thinking" | "recording" | "done" | "submitted";

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

export default function RespondingToSituation({
  question,
  onSubmitAttempt,
  isSubmitting,
}: RespondingToSituationProps) {
  const { content } = question;

  const [phase, setPhase] = useState<Phase>("audio");
  const [thinkCount, setThinkCount] = useState(THINK_SECONDS);
  const [recordCount, setRecordCount] = useState(RECORD_SECONDS);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<{ fluency: number } | null>(null);

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
  const finalTranscriptRef = useRef("");
  const recordingStartRef = useRef(0);
  const recordedAudio = useRecordedAudio();

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

  // Think time countdown
  useEffect(() => {
    if (phase !== "thinking") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setThinkCount(THINK_SECONDS);
    intervalRef.current = setInterval(() => {
      setThinkCount((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setPhase("recording");
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

  // Beep the instant recording starts, whether triggered by the think-time
  // countdown hitting zero or by manually clicking "Start Recording".
  useEffect(() => {
    if (phase === "recording") playRecordingBeep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Recording countdown + STT
  useEffect(() => {
    if (phase !== "recording") return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecordCount(RECORD_SECONDS);
    recordingStartRef.current = Date.now();
    latestTranscriptRef.current = "";
    finalTranscriptRef.current = "";
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

    let cancelled = false;

    // Speech recognition only starts once the recorder's own getUserMedia
    // request has settled — requesting a second live mic stream *while*
    // SpeechRecognition is already mid-session tends to make Chrome
    // renegotiate the shared audio pipeline, aborting/restarting recognition
    // and wiping whatever hadn't been finalised yet. Sequencing the two
    // avoids that.
    recordedAudio.start().then(() => {
      if (cancelled) return;

      const SR =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition
          : null;
      if (!SR) return;

      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const full = (finalTranscriptRef.current + interim).trim();
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
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopRecognition();
      recordedAudio.stop();
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
    recordedAudio.reset();
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
    setThinkCount(THINK_SECONDS);
    setRecordCount(RECORD_SECONDS);
    setTranscript("");
    setResult(null);
    latestTranscriptRef.current = "";
    finalTranscriptRef.current = "";
    recordingStartRef.current = 0;
  };

  const handleAudioEnded = () => {
    setAudioStatus("Audio Finished");
    setAudioProgress(100);
    setPhase("thinking");
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

  const handleStartRecording = () => {
    if (phase !== "audio" && phase !== "thinking") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPrepSeconds(null);
    setPhase("recording");
  };

  const handleSubmit = () => {
    stopRecognition();
    if (intervalRef.current) clearInterval(intervalRef.current);

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
      scenario: content.scenario,
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
          {recordedAudio.audioUrl && (
            <div>
              <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
                Your Recorded Answer
              </p>
              <audio controls src={recordedAudio.audioUrl} className="w-full h-10" />
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
              Your Response
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-[14px] text-gray-800 leading-relaxed min-h-[60px]">
              {finalTranscript || (
                <span className="text-gray-400 italic">No speech detected</span>
              )}
            </div>
          </div>

          {content.model_answer && (
            <div>
              <p className="text-[11px] font-semibold text-mute font-mono uppercase tracking-wider mb-2">
                Correct Answer
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                {content.model_answer}
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
  const circleLabel =
    phase === "thinking"
      ? thinkCount
      : phase === "recording"
      ? recordCount
      : "✓";

  const circleClass =
    phase === "thinking"
      ? "border-amber-500 text-amber-600"
      : phase === "recording"
      ? "border-red-500 text-red-600"
      : "border-green-500 text-green-600";

  const statusText =
    phase === "thinking"
      ? `Think time: ${thinkCount}s remaining`
      : phase === "recording"
      ? `Recording: ${recordCount}s remaining`
      : "Recording complete — ready to submit";

  const statusClass =
    phase === "thinking"
      ? "text-amber-600"
      : phase === "recording"
      ? "text-red-600"
      : "text-green-700";

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
          Listen to and read a description of a situation. You will have{" "}
          {THINK_SECONDS} seconds to think about your answer. Then you will hear
          a beep. You will have {RECORD_SECONDS} seconds to answer the question.
          Please answer as completely as you can.
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

        {/* Scenario text */}
        <div className="px-8 pt-6 pb-4 bg-white">
          <div className="border border-gray-200 rounded-lg p-5 bg-white">
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: "#2980b9" }}
            >
              {content.scenario ?? "No scenario provided."}
            </p>
            {content.question && (
              <p
                className="text-[14px] leading-relaxed mt-2"
                style={{ color: "#2980b9" }}
              >
                {content.question}
              </p>
            )}
          </div>
        </div>

        {/* Audio box / countdown */}
        <div className="flex flex-col items-center py-8 bg-white select-none gap-6">
          {phase === "audio" ? (
            <div
              onClick={handleAudioBoxClick}
              className={`w-full max-w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 ${
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

          {(phase === "audio" || phase === "thinking") ? (
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
