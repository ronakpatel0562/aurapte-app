"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, X, Volume2 } from "lucide-react";
import ScoreBadge from "../shared/ScoreBadge";
import { scoreListeningMCQSingle } from "@/lib/scoring/listening";

interface MCQSingleProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      audio_transcript: string;
      question: string;
      options: string[];
      correct_answers: string[];
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
  isPremium?: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const optionHasPrefix = (opt: string): boolean => {
  if (!opt || opt.length < 3) return false;
  const first = opt[0];
  return LETTERS.includes(first) && (opt[1] === ")" || opt[1] === ".");
};

const stripPrefix = (opt: string): string =>
  optionHasPrefix(opt) ? opt.slice(2).trim() : opt;

const getDisplayText = (option: string, index: number): string =>
  optionHasPrefix(option) ? option : `${LETTERS[index]}) ${option}`;

const extractCorrectAnswer = (
  content: any,
  options: string[]
): string | null => {
  const resolveLetter = (val: string): string | null => {
    const upper = val.trim().toUpperCase();
    if (upper.length === 1 && LETTERS.includes(upper)) {
      const idx = LETTERS.indexOf(upper);
      if (idx < options.length) return stripPrefix(options[idx]);
    }
    return null;
  };

  if (Array.isArray(content?.correct_answers) && content.correct_answers.length > 0) {
    const first = content.correct_answers[0];
    if (typeof first === "string") {
      return resolveLetter(first) ?? stripPrefix(first);
    }
  }
  if (typeof content?.correct_answer === "string" && content.correct_answer.length > 0) {
    return resolveLetter(content.correct_answer) ?? stripPrefix(content.correct_answer);
  }
  return null;
};

export default function MCQSingle({
  question,
  onSubmitAttempt,
  isSubmitting,
  isPremium = false,
}: MCQSingleProps) {
  const { audio_url, question: stem, options } = question.content;
  const rawCorrect = extractCorrectAnswer(question.content, options);
  const correctText = rawCorrect ? stripPrefix(rawCorrect) : null;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  // Audio status and playback properties
  const [prepSeconds, setPrepSeconds] = useState<number | null>(3); // 3s preparation
  const [audioStatus, setAudioStatus] = useState<string>("Ready");
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // Load saved volume level on mount
  useEffect(() => {
    const saved = localStorage.getItem("portal_audio_volume");
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) {
        setVolume(parsed);
        if (audioRef.current) {
          audioRef.current.volume = parsed;
        }
      }
    } else {
      localStorage.setItem("portal_audio_volume", "1.0");
    }
  }, []);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    localStorage.setItem("portal_audio_volume", String(val));
  };

  // Preparation Countdown Effect
  useEffect(() => {
    if (submitted) return;
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
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay blocked:", err);
          setAudioStatus("Click to Play");
        });
      }
    }
    return () => {
      if (prepInterval) clearInterval(prepInterval);
    };
  }, [prepSeconds, submitted, volume]);

  // Reset state when the question changes
  useEffect(() => {
    handleReset();
  }, [question.id]);

  const handleSelect = (option: string) => {
    if (submitted) return;
    setSelected(option);
  };

  const handleSubmit = () => {
    if (submitted || !selected) return;

    const scoreResult = scoreListeningMCQSingle(
      stripPrefix(selected),
      correctText ? [correctText] : []
    );

    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, selected);

    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleReset = () => {
    setSelected(null);
    setSubmitted(false);
    setResult(null);
    setPrepSeconds(3);
    setAudioStatus("Ready");
    setAudioProgress(0);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAudioBoxClick = () => {
    if ((audioStatus === "Ready" || audioStatus === "Click to Play" || audioStatus === "Paused") && audioRef.current && prepSeconds === null) {
      audioRef.current.play()
        .then(() => setAudioStatus("Playing"))
        .catch((err) => {
          console.error("Playback failed:", err);
          setAudioStatus("Click to Play");
        });
    } else if (audioStatus === "Playing" && audioRef.current && submitted) {
      audioRef.current.pause();
      setAudioStatus("Paused");
    }
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
    const el = e.currentTarget;
    if (el.duration) {
      setDuration(el.duration);
    }
  };

  const handleAudioEnded = () => {
    setAudioStatus("Audio Finished");
    setAudioProgress(100);
  };

  const formatAudioTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6">
      <style>{`
        /* Custom Volume Input Styling */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>

      {audio_url && (
        <audio
          ref={audioRef}
          src={audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Main Container styled exactly like MCQMultiple */}
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
        
        {/* Instruction Paragraph */}
        <div className="px-7 py-6 bg-[#FAF9F6] text-[16px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct.
        </div>

        {/* Steel Blue Audio Box */}
        <div className="flex justify-center items-center py-10 bg-white select-none">
          <div
            onClick={handleAudioBoxClick}
            className={`w-full max-w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 relative ${
              ((audioStatus === "Ready" || audioStatus === "Click to Play" || audioStatus === "Paused") || (submitted && audioStatus === "Playing")) && prepSeconds === null
                ? "cursor-pointer hover:bg-[#5284A3]"
                : ""
            }`}
          >
            {/* Play progress bar */}
            <div className="w-full h-[6px] bg-[#3B6C8A]/40 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[#1C415A] transition-all duration-300 ease-linear rounded-full"
                style={{ width: `${audioProgress}%` }}
              />
            </div>

            {/* Time / Countdown / Display */}
            <div className="text-white text-xs font-semibold px-1 mt-1 flex justify-start">
              {prepSeconds !== null ? (
                <span>Beginning in {prepSeconds}s</span>
              ) : audioStatus === "Audio Finished" ? (
                <span>Audio Finished</span>
              ) : (
                <span className="tabular-nums">
                  {formatAudioTime(currentTime)} / {formatAudioTime(duration || 0)}
                </span>
              )}
            </div>

            {/* Audio Volume Controls */}
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
                  background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.3) ${
                    volume * 100
                  }%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Stem & Options Area */}
        <div className="px-9 pb-7 bg-white space-y-8">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 select-none">
            <h3 className="text-[18px] font-bold text-gray-800 leading-normal select-text">
              {stem}
            </h3>
            {submitted && result && <ScoreBadge score={result.score} maxScore={result.maxScore} />}
          </div>

          <div className="space-y-5">
            {options.map((option, index) => {
              const optionText = stripPrefix(option);
              const isSel = selected === option;
              const isCorr = correctText !== null && optionText === correctText;
              const isInteractionDisabled = audioStatus !== "Audio Finished";

              let optionClass = "border border-gray-200 bg-white text-gray-700";
              let checkboxClass = "border-gray-400 bg-white text-transparent";
              let iconToRender = null;
              let pointText = null;

              if (submitted) {
                if (isCorr) {
                  optionClass = "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-semibold";
                  checkboxClass = "bg-emerald-500 border-emerald-500 text-white";
                  iconToRender = <Check className="w-3.5 h-3.5 text-white stroke-[3]" />;
                  pointText = (
                    <span className="text-[11px] font-bold font-mono text-emerald-700 uppercase tracking-wider">
                      {isSel ? "Correct" : "Correct Key"}
                    </span>
                  );
                } else if (isSel && !isCorr) {
                  optionClass = "border-red-500 bg-red-50/50 text-red-800 font-semibold";
                  checkboxClass = "bg-red-500 border-red-500 text-white";
                  iconToRender = <X className="w-3.5 h-3.5 text-white stroke-[3]" />;
                  pointText = (
                    <span className="text-[11px] font-bold font-mono text-red-700 uppercase tracking-wider">
                      Incorrect
                    </span>
                  );
                } else {
                  optionClass = "border-gray-200 opacity-60 bg-gray-50 text-gray-400";
                  checkboxClass = "border-gray-300 bg-gray-100";
                }

                return (
                  <div
                    key={`${index}-${optionText}`}
                    className={`w-full text-left p-5 rounded-md text-xs transition duration-150 flex items-center justify-between group ${optionClass}`}
                  >
                    <div className="flex items-center gap-3.5 pr-4 select-text text-[16px]">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${checkboxClass}`}
                      >
                        {iconToRender}
                      </div>
                      <span className="leading-relaxed select-text font-sans">{getDisplayText(option, index)}</span>
                    </div>
                    {pointText && <div className="shrink-0 select-none">{pointText}</div>}
                  </div>
                );
              }

              return (
                <button
                  key={`${index}-${optionText}`}
                  onClick={() => handleSelect(option)}
                  disabled={isInteractionDisabled}
                  className={`w-full text-left flex items-start gap-3.5 group transition duration-150 select-none py-1.5 ${
                    isInteractionDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isSel
                        ? "bg-[#1C415A] border-[#1C415A] text-white"
                        : "border-gray-400 bg-white group-hover:border-gray-600"
                    }`}
                  >
                    {isSel && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <span className={`text-[16px] text-gray-700 font-sans leading-relaxed select-text ${isInteractionDisabled ? "text-gray-400" : ""}`}>
                    {getDisplayText(option, index)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Silver-grey Practice Footer Panel */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-end items-center select-none rounded-b-lg">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selected || audioStatus !== "Audio Finished"}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Submitting..."
                : audioStatus !== "Audio Finished" && audio_url
                ? "Wait for Audio to Finish"
                : "SUBMIT & CHECK"}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition"
            >
              TRY AGAIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}