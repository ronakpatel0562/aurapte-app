"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import ScoreBadge from "../shared/ScoreBadge";
import { scoreWriteFromDictation } from "@/lib/scoring/listening";

interface WriteDictationProps {
  question: {
    id: string;
    title: string;
    content: {
      audio_url?: string;
      sentence: string;
    };
  };
  onSubmitAttempt: (score: number, maxScore: number, answers: any) => void;
  isSubmitting: boolean;
}

export default function WriteDictation({
  question,
  onSubmitAttempt,
  isSubmitting,
}: WriteDictationProps) {
  const { audio_url, sentence } = question.content;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [typedText, setTypedText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  // Audio status and playback properties
  const [prepSeconds, setPrepSeconds] = useState<number | null>(3); // 3s preparation
  const [audioStatus, setAudioStatus] = useState<string>("Ready");
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // Internal clipboard fallback
  const [internalClipboard, setInternalClipboard] = useState("");

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

  const clean = (text: string) =>
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Highlight analysis
  const analyzedUserWords = React.useMemo(() => {
    if (!submitted) return [];
    
    const userWords = typedText.split(/\s+/).filter(Boolean);
    const correctWords = clean(sentence).split(" ").filter(Boolean);

    // Keep correct words copy to check availability and handle counts
    const correctPool = [...correctWords];

    return userWords.map((word) => {
      const cleaned = clean(word);
      const idx = correctPool.indexOf(cleaned);
      const isMatch = idx !== -1;
      
      if (isMatch) {
        correctPool.splice(idx, 1);
      }

      return {
        word,
        isCorrect: isMatch,
      };
    });
  }, [submitted, typedText, sentence]);

  const handleSubmit = () => {
    if (submitted) return;

    const scoreResult = scoreWriteFromDictation(typedText, sentence);
    setResult(scoreResult);
    setSubmitted(true);
    onSubmitAttempt(scoreResult.score, scoreResult.maxScore, typedText);

    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleReset = () => {
    setTypedText("");
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

  // Textarea Editor Actions (Cut/Copy/Paste)
  const handleCut = () => {
    if (!textareaRef.current || submitted) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = typedText.substring(start, end);

    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
      setInternalClipboard(selectedText);
      const val = typedText.substring(0, start) + typedText.substring(end);
      setTypedText(val);
    }
  };

  const handleCopy = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = typedText.substring(start, end);

    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
      setInternalClipboard(selectedText);
    }
  };

  const handlePaste = () => {
    if (submitted) return;
    navigator.clipboard.readText()
      .then((clipText) => {
        insertText(clipText);
      })
      .catch(() => {
        if (internalClipboard) {
          insertText(internalClipboard);
        }
      });
  };

  const insertText = (clipText: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const val = typedText.substring(0, start) + clipText + typedText.substring(end);
    setTypedText(val);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + clipText.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const wordCount = typedText.trim().split(/\s+/).filter(Boolean).length;
  const isInteractionDisabled = false;

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
          You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.
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

        {/* Textarea Editor Box */}
        <div className="px-8 pb-6 bg-white space-y-6">
          {submitted && result && (
            <div className="flex justify-end items-center pb-2 border-b border-gray-100 select-none">
              <ScoreBadge score={result.score} maxScore={result.maxScore} />
            </div>
          )}

          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              disabled={submitted || isInteractionDisabled}
              placeholder="Type the sentence here..."
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              className="w-full h-32 p-4 border border-gray-300 bg-white rounded text-[15px] font-sans focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 resize-y transition shadow-inner placeholder-gray-400 text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
            />

            <div className="flex justify-between items-center select-none">
              {/* Clipboard buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCut}
                  disabled={submitted || isInteractionDisabled}
                  className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  Cut
                </button>
                <button
                  onClick={handleCopy}
                  disabled={submitted || isInteractionDisabled}
                  className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  Copy
                </button>
                <button
                  onClick={handlePaste}
                  disabled={submitted || isInteractionDisabled}
                  className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-[13px] text-gray-700 font-bold rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  Paste
                </button>
              </div>

              {/* Bottom-right word count */}
              <span className="text-sm font-sans font-bold text-gray-700">
                Word Count: <span className="text-[#0284c7]">{wordCount}</span>
              </span>
            </div>
          </div>

          {/* Word-by-word highlights showing on submit */}
          {submitted && (
            <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-[#FAF9F6] font-sans select-text">
              <span className="text-xs font-bold font-mono text-gray-500 uppercase tracking-wider block select-none">
                Typed Sentence Highlights
              </span>
              <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-sm">
                {analyzedUserWords.length > 0 ? (
                  analyzedUserWords.map((item, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        item.isCorrect
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {item.word}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-xs select-none">Nothing typed.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Silver-grey Practice Footer Panel */}
        <div className="bg-[#b4b7bd]/80 border-t border-gray-300 p-4 flex justify-end items-center select-none rounded-b-lg">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || typedText.trim() === "" || audioStatus !== "Audio Finished"}
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

      {/* Correct Answer Card (shows below player on submit) */}
      {submitted && sentence && (
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-vercel-card space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-hairline select-none">
            <span className="text-xs font-semibold text-mute font-mono uppercase tracking-wider">
              Correct Sentence Key
            </span>
          </div>
          <div className="text-[15px] text-gray-800 leading-relaxed select-text font-sans font-medium">
            {sentence}
          </div>
        </div>
      )}
    </div>
  );
}
