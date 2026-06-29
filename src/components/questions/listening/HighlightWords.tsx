"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Volume2 } from "lucide-react";
import ScoreBadge from "../shared/ScoreBadge";
import { scoreHighlightIncorrectWords } from "@/lib/scoring/listening";

interface HighlightWordsProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      passage_with_incorrect_words: string;
      incorrect_words: string[];
      audio_transcript?: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

interface WordToken {
  index: number;
  text: string;
  cleanText: string;
  isTarget: boolean;
}

export default function HighlightWords({
  question,
  onSubmitAttempt,
  isSubmitting,
}: HighlightWordsProps) {
  const {
    audio_url,
    passage_with_incorrect_words,
    incorrect_words,
  } = question.content;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

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

  const cleanWord = (word: string) =>
    word
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .trim();

  const incorrectSet = useMemo(
    () => new Set((incorrect_words ?? []).map(cleanWord).filter(Boolean)),
    [incorrect_words]
  );

  const tokens = useMemo<WordToken[]>(() => {
    if (!passage_with_incorrect_words) return [];
    return passage_with_incorrect_words.split(/\s+/).map((word, index) => {
      const cleanText = cleanWord(word);
      return {
        index,
        text: word,
        cleanText,
        isTarget: incorrectSet.has(cleanText),
      };
    });
  }, [passage_with_incorrect_words, incorrectSet]);

  const handleToggle = (index: number) => {
    if (submitted) return;
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSubmit = () => {
    if (submitted) return;
    const userSelectedWords = selectedIndices
      .map((idx) => tokens.find((t) => t.index === idx)?.cleanText || "")
      .filter(Boolean);

    const scoreResult = scoreHighlightIncorrectWords(
      userSelectedWords,
      Array.from(incorrectSet)
    );

    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, userSelectedWords);

    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleReset = () => {
    setSelectedIndices([]);
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

  const hasInteractiveTranscript = tokens.length > 0 && incorrectSet.size > 0;

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
        <div className="px-6 py-5 bg-[#FAF9F6] text-[14px] text-gray-800 font-bold leading-relaxed border-b border-gray-200 select-none">
          You will hear a recording. Below is a transcript of the recording. Some words in the transcription differ from what the speaker(s) said. Please click on the words that are different.
        </div>

        {/* Steel Blue Audio Box */}
        <div className="flex justify-center items-center py-10 bg-white select-none">
          <div
            onClick={handleAudioBoxClick}
            className={`w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 relative ${
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

        {/* Interactive Highlight Section */}
        <div className="px-8 pb-6 bg-white space-y-6">
          {submitted && result && (
            <div className="flex justify-end items-center pb-2 border-b border-gray-100 select-none">
              <ScoreBadge score={result.score} maxScore={result.maxScore} />
            </div>
          )}

          {hasInteractiveTranscript && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#FAF9F6] border border-gray-200 rounded-md select-none">
              <span className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wider">
                Words to find
              </span>
              <span className="flex items-center gap-2 text-sm font-sans">
                <span className="font-bold text-gray-800 tabular-nums">
                  {selectedIndices.length}
                </span>
                <span className="text-gray-400">/</span>
                <span className="font-bold text-gray-800 tabular-nums">
                  {incorrectSet.size}
                </span>
                <span className="text-gray-500 font-medium">selected</span>
              </span>
            </div>
          )}

          {hasInteractiveTranscript ? (
            <div className="text-[15px] text-gray-800 leading-loose font-sans py-5 px-6 border border-gray-200 rounded-lg bg-white select-text">
              {tokens.map((token) => {
                const isSel = selectedIndices.includes(token.index);
                const isWordIncorrect = token.isTarget;

                const highlightClass = (() => {
                  if (submitted) {
                    if (isWordIncorrect && isSel) {
                      return "bg-emerald-50 text-emerald-800 border-b-2 border-emerald-500 font-semibold";
                    }
                    if (!isWordIncorrect && isSel) {
                      return "bg-red-50 text-red-800 border-b-2 border-red-500 font-semibold";
                    }
                    if (isWordIncorrect && !isSel) {
                      return "bg-amber-50 text-amber-800 border-b-2 border-dashed border-amber-500 font-semibold";
                    }
                    return "";
                  }
                  return isSel
                    ? "bg-sky-50 border-b-2 border-sky-500 text-sky-800 font-medium"
                    : "hover:bg-gray-50 border-b border-transparent";
                })();

                return (
                  <span
                    key={token.index}
                    onClick={() => handleToggle(token.index)}
                    className={`inline-block mx-0.5 px-0.5 rounded cursor-pointer transition ${highlightClass}`}
                    title={
                      submitted && isWordIncorrect && !isSel
                        ? `You missed this word: "${token.text}"`
                        : undefined
                    }
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-xs font-bold font-mono uppercase tracking-wider text-amber-800">
                Question Data Missing
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-1">
                This question does not include the spoken passage or the list of
                substituted words needed for interactive practice. The expected
                incorrect words (if any) are listed below for reference.
              </p>
              {incorrect_words.length > 0 && (
                <ul className="text-xs text-gray-600 leading-relaxed mt-2 space-y-1 font-mono list-disc list-inside">
                  {incorrect_words.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Legend — visible during/after submit so the colour coding makes sense. */}
          {submitted && (
            <div className="flex flex-wrap gap-4 text-xs font-mono select-none pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 border-b-2 border-b-emerald-500" />
                <span className="text-gray-600">Correctly flagged (spoken differently)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-50 border border-red-300 border-b-2 border-b-red-500" />
                <span className="text-gray-600">Flagged but actually correct (−1)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300 border-b-2 border-dashed border-b-amber-500" />
                <span className="text-gray-600">Missed incorrect word</span>
              </div>
            </div>
          )}
        </div>

        {/* Silver-grey Practice Footer Panel */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-end items-center select-none rounded-b-lg">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasInteractiveTranscript || audioStatus !== "Audio Finished"}
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
