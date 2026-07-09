"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scoreSummarizeSpoken } from "@/lib/scoring/listening";
import { analyzeLinguistics, LinguisticAnalysis } from "@/lib/linguistics/analyze";
import AudioPlayer from "../shared/AudioPlayer";
import ScoreBadge from "../shared/ScoreBadge";
import ModelAnswer from "../shared/ModelAnswer";
import HighlightedFeedback from "../writing/HighlightedFeedback";

interface SummarizeSpokenProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      audio_transcript: string;
      model_answer: string;
      sample_answers?: string[];
      word_limit_min?: number;
      word_limit_max?: number;
      time_limit_seconds?: number;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
  questionNumber?: number;
  nextQuestionId?: string | null;
  isPremium?: boolean;
}

export default function SummarizeSpoken({
  question,
  onSubmitAttempt,
  isSubmitting,
  questionNumber = 1,
  nextQuestionId = null,
  isPremium = false,
}: SummarizeSpokenProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    audio_url,
    audio_transcript,
    model_answer,
    sample_answers,
    word_limit_min,
    word_limit_max,
    time_limit_seconds,
  } = question.content;

  // Resolve limits with defaults matching standard PTE and screenshot details
  const limitMin = 20;
  const limitMax = 30;
  const totalTimeSeconds = 480; // Force 8 minutes = 480s

  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Audio status and playback properties
  const [prepSeconds, setPrepSeconds] = useState<number | null>(3); // 3s preparation
  const [audioStatus, setAudioStatus] = useState<string>("Ready");
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // Clipboard operations fallback state
  const [internalClipboard, setInternalClipboard] = useState("");

  // Analysis state for feedback
  const [analysis, setAnalysis] = useState<LinguisticAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

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

  // Clean and parse item code
  const cleanTitle = question.title.replace(/\s*#\d+/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const itemCode = `#imp-listening-question-${questionNumber}`;

  // Word count helper
  const getWordCount = (val: string) => {
    return val.trim().split(/\s+/).filter(Boolean).length;
  };
  const wordCount = getWordCount(text);

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

  // Running Timer Effect
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        if (prev >= totalTimeSeconds) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, totalTimeSeconds]);

  // Perform Spell/Grammar Analysis on Submission
  useEffect(() => {
    if (!submitted) return;
    let cancelled = false;
    setAnalysisLoading(true);
    analyzeLinguistics(text)
      .then((res) => {
        if (!cancelled) setAnalysis(res);
      })
      .catch(() => {
        if (!cancelled) setAnalysis(null);
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submitted, text]);

  // Audio Playback Event Handlers
  const handleAudioBoxClick = () => {
    if ((audioStatus === "Ready" || audioStatus === "Click to Play") && audioRef.current && prepSeconds === null) {
      audioRef.current.volume = volume;
      audioRef.current.play()
        .then(() => setAudioStatus("Playing"))
        .catch((err) => {
          console.error("Playback failed:", err);
          setAudioStatus("Click to Play");
        });
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

  // Submission Scoring
  const handleSubmit = () => {
    if (submitted) return;

    const scoreResult = scoreSummarizeSpoken(text, limitMin, limitMax);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, text);
    
    // Stop audio if it was still playing
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Restart / Reset View
  const handleReset = () => {
    setText("");
    setSubmitted(false);
    setResult(null);
    setElapsedTime(0);
    setPrepSeconds(3);
    setAudioStatus("Ready");
    setAudioProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setAnalysis(null);
    setAnalysisLoading(false);
  };

  // Textarea Editor Actions (Cut/Copy/Paste)
  const handleCut = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);

    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
      setInternalClipboard(selectedText);
      const val = text.substring(0, start) + text.substring(end);
      setText(val);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, start);
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);

    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
      setInternalClipboard(selectedText);
    }
  };

  const handlePaste = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    const pasteText = (clipText: string) => {
      const val = text.substring(0, start) + clipText + text.substring(end);
      setText(val);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const cursorPosition = start + clipText.length;
          textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    };

    navigator.clipboard.readText()
      .then((clipText) => {
        pasteText(clipText);
      })
      .catch(() => {
        if (internalClipboard) {
          pasteText(internalClipboard);
        }
      });
  };

  // Format Elapsed Time (e.g. 00:03/ 08:00)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    const limitM = Math.floor(totalTimeSeconds / 60).toString().padStart(2, "0");
    const limitS = (totalTimeSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}/ ${limitM}:${limitS}`;
  };

  const formatAudioTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Resolve Sample Correct Answers list
  const sampleAnswersList = Array.isArray(sample_answers)
    ? sample_answers
    : model_answer
    ? [model_answer]
    : [];

  // Determine if Attempt is fully Correct
  const isCorrect =
    wordCount >= limitMin &&
    wordCount <= limitMax &&
    (!analysis || analysis.issues.filter((i) => i.type === "spelling").length === 0);

  // 1. ACTIVE PRACTICE PLAYER SCREEN
  if (!submitted) {
    return (
      <div className="bg-[#FAF9F6] border border-gray-300 rounded-lg shadow-sm overflow-hidden font-sans relative">
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



        {/* Instruction Paragraph */}
        <div className="px-7 py-6 bg-[#FAF9F6] text-[16px] text-gray-800 font-bold leading-relaxed border-b border-gray-200">
          You will hear a short report. Write a summary of 20-30 words. You have 8 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points presented in the lecture.
        </div>

        {/* Steel Blue Audio Box */}
        <div className="flex justify-center items-center py-10 bg-white select-none">
          <div
            onClick={handleAudioBoxClick}
            className={`w-full max-w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 relative ${
              audioStatus === "Click to Play" ? "cursor-pointer hover:bg-[#5284A3]" : ""
            }`}
          >
            {/* Play progress bar */}
            <div className="w-full h-[6px] bg-[#3B6C8A]/40 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[#1C415A] transition-all duration-300 ease-linear rounded-full"
                style={{ width: `${audioProgress}%` }}
              />
            </div>

            {/* Time / Countdown / Status Display */}
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

        {/* Word and Time Tracker line */}
        <div className="flex justify-end gap-6 text-base font-sans font-bold text-gray-700 mb-2 px-7 select-none">
          <span>{wordCount} / 30 words Limit</span>
          <span className="tabular-nums">{formatTime(elapsedTime)}</span>
        </div>

        {/* Textarea Editor Box */}
        <div className="px-7 pb-7 bg-white">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              if (elapsedTime < totalTimeSeconds) {
                setText(e.target.value);
              }
            }}
            disabled={elapsedTime >= totalTimeSeconds}
            placeholder="Type your summary here..."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            className="w-full h-44 p-5 border border-[#bfdbfe]/70 bg-white rounded text-[17px] font-sans focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 resize-y transition shadow-inner placeholder-gray-400 text-gray-800"
          />

          <div className="flex justify-between items-center mt-3 select-none">
            {/* Clipboard buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCut}
                disabled={elapsedTime >= totalTimeSeconds}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Cut
              </button>
              <button
                onClick={handleCopy}
                disabled={elapsedTime >= totalTimeSeconds}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Copy
              </button>
              <button
                onClick={handlePaste}
                disabled={elapsedTime >= totalTimeSeconds}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Paste
              </button>
            </div>

            {/* Bottom-right word count */}
            <span className="text-base font-sans font-bold text-gray-700">
              Word Count: <span className="text-[#0284c7]">{wordCount}</span>
            </span>
          </div>
        </div>

        {/* Practice Footer Panel */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-end items-center select-none rounded-b-lg">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || wordCount === 0 || (audio_url ? audioStatus !== "Audio Finished" : false)}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[13px] uppercase rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Submitting..."
              : audioStatus !== "Audio Finished" && audio_url
              ? "Wait for Audio to Finish"
              : "SUBMIT & CHECK"}
          </button>
        </div>
      </div>
    );
  }

  // 2. SUBMITTED FEEDBACK & REVIEW SCREEN (Vercel Style - Simplified)
  return (
    <div className="space-y-6">
      {/* Sample Correct Answers card */}
      {sampleAnswersList.length > 0 && (
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4 reveal-up">
          <div className="flex justify-between items-center pb-4 border-b border-hairline select-none">
            <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
              Sample Correct Answer(s)
            </span>
          </div>
          <div className="space-y-3 text-base text-ink leading-relaxed select-text font-geist">
            {sampleAnswersList.map((ans, aIdx) => (
              <p key={aIdx} className="leading-relaxed">
                {ans}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Answer Board */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-5 reveal-up">
        <div className="flex justify-between items-center pb-4 border-b border-hairline select-none">
          <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
            Your Attempt & Feedback
          </span>
          {submitted && (
            <span className="text-2xs font-mono font-semibold text-success uppercase bg-success/5 border border-success/15 px-2.5 py-1 rounded">
              Submitted ✓
            </span>
          )}
        </div>

        {/* User response with in-line spelling/grammar highlights */}
        <div className="space-y-4">
          <HighlightedFeedback
            analysis={analysis}
            loading={analysisLoading}
            rawText={text}
          />
          <div className="flex justify-between items-center select-none pt-2">
            <span className="px-2.5 py-1 rounded-full text-2xs font-semibold bg-success/10 border border-success/20 text-success uppercase tracking-wider font-mono">
              Word Count: {wordCount} (Target: {limitMin}-{limitMax})
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-hairline select-none">
          <button
            onClick={handleReset}
            className="h-10 px-6 border border-hairline hover:bg-canvas-soft-2 font-medium text-sm rounded-md transition duration-150 flex items-center justify-center cursor-pointer active:scale-[0.99]"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
