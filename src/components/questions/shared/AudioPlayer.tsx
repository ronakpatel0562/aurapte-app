"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, RotateCcw, Info, Loader2 } from "lucide-react";

interface AudioPlayerProps {
  /** Optional. If provided, the player uses an <audio> element pointed at
   *  this URL. If absent or the URL fails, falls back to transcript-only
   *  mode so the UI still works for rows without audio. */
  audioUrl?: string | null;
  /** Transcript text. Shown only after the user submits (so the answer
   *  isn't accidentally given away up-front). */
  transcript?: string;
  /** Whether the user has submitted their answer. The transcript is hidden
   *  before submit and revealed after. */
  hasSubmitted?: boolean;
  /** When true (default), show a 3-2-1 countdown overlay before audio
   *  playback so the user has a moment to focus. Set false for tasks where
   *  a delay would be inappropriate. */
  countdown?: boolean;
}

/**
 * Listening audio player. Designed to match the real PTE flow:
 *
 *   1. The transcript is HIDDEN until submit. (Reading the transcript
 *      before listening defeats the listening test.)
 *   2. The first time the user presses play, a 3-2-1 countdown runs so
 *      they have a moment to focus. After that, play is instant.
 *   3. The audio element is mounted the moment the question renders, with
 *      preload="auto" so the first buffered chunk is downloading before
 *      the user even clicks play. On a fast network this often means
 *      playback starts immediately when the countdown hits 0.
 *   4. Speed control + reset are wired to the real <audio> element.
 *
 * Two failure modes the player handles gracefully:
 *   - audioUrl fails (404 / network) → falls back to transcript-only mode
 *   - browser blocks autoplay / decoding → countdown still shows
 */
export default function AudioPlayer({
  audioUrl,
  transcript,
  hasSubmitted = false,
  countdown = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasRealAudio, setHasRealAudio] = useState<boolean>(!!audioUrl);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [buffered, setBuffered] = useState(0);
  const fallbackTickerRef = useRef(0);
  const countdownIntervalRef = useRef<number | null>(null);

  // Reset state when the question (and thus audioUrl) changes.
  useEffect(() => {
    setHasRealAudio(!!audioUrl);
    setLoadFailed(false);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setCountdownValue(null);
    fallbackTickerRef.current = 0;
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [audioUrl]);

  // Apply playback rate changes to the real element.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Fallback ticker: when there's no real audio, animate the bar so the
  // UI still responds to the play button.
  useEffect(() => {
    if (hasRealAudio || !isPlaying || loadFailed) return;
    const id = window.setInterval(() => {
      fallbackTickerRef.current += 2 * speed;
      if (fallbackTickerRef.current >= 100) {
        fallbackTickerRef.current = 0;
        setIsPlaying(false);
      }
      // Force a re-render so the bar moves. setState on the same number is
      // a no-op, so we toggle through progress.
      setProgress(fallbackTickerRef.current);
    }, 500);
    return () => window.clearInterval(id);
  }, [hasRealAudio, isPlaying, loadFailed, speed]);

  const effectiveProgress = hasRealAudio && !loadFailed
    ? duration > 0 ? (currentTime / duration) * 100 : 0
    : progress;

  const startCountdownThenPlay = () => {
    if (!countdown) {
      void doPlay();
      return;
    }
    // 3-2-1-GO. Each tick is 700ms so the full countdown is ~2.1s. That
    // matches the PTE-style "audio begins shortly" pacing.
    setCountdownValue(3);
    let n = 3;
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = window.setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCountdownValue(n);
      } else {
        if (countdownIntervalRef.current !== null) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdownValue(null);
        void doPlay();
      }
    }, 700);
  };

  const doPlay = async () => {
    if (hasRealAudio && !loadFailed && audioRef.current) {
      try {
        // Reset to start if at the end.
        if (audioRef.current.ended || audioRef.current.currentTime >= audioRef.current.duration - 0.05) {
          audioRef.current.currentTime = 0;
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setLoadFailed(true);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const handlePlayPause = () => {
    // If a countdown is already running, ignore further clicks.
    if (countdownValue !== null) return;
    if (isPlaying) {
      if (hasRealAudio && !loadFailed && audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // First play of the session runs a countdown so the user is ready.
      // Subsequent plays (pause/resume or replay) skip it.
      if (currentTime === 0 && progress === 0 && countdown) {
        startCountdownThenPlay();
      } else {
        void doPlay();
      }
    }
  };

  const handleReset = () => {
    if (countdownValue !== null) {
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountdownValue(null);
    }
    if (hasRealAudio && !loadFailed && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    } else {
      fallbackTickerRef.current = 0;
      setProgress(0);
      setIsPlaying(false);
    }
  };

  const handleAudioError = () => {
    setLoadFailed(true);
    setIsPlaying(false);
  };

  // Read buffered ranges so we can show a "loading" indicator while the
  // first chunk is still downloading.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onProgress = () => {
      try {
        if (audio.buffered.length > 0 && audio.duration > 0) {
          setBuffered((audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100);
        }
      } catch {
        // Some browsers throw if you read buffered too early; ignore.
      }
    };
    audio.addEventListener("progress", onProgress);
    audio.addEventListener("canplay", onProgress);
    return () => {
      audio.removeEventListener("progress", onProgress);
      audio.removeEventListener("canplay", onProgress);
    };
  }, [audioUrl]);

  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const showRealAudio = hasRealAudio && !loadFailed;
  const showTranscript = hasSubmitted && !!transcript;
  const isLoading = showRealAudio && duration === 0 && !loadFailed;

  return (
    <div className="bg-canvas border border-hairline rounded-lg p-5 space-y-4 shadow-vercel-card">
      {showRealAudio && (
        // preload="auto" tells the browser to fetch metadata + start
        // buffering immediately. The actual play() call later is then
        // much faster because the first chunk is already on the wire.
        <audio
          ref={audioRef}
          src={audioUrl!}
          preload="auto"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(100);
          }}
          onError={handleAudioError}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            disabled={!!countdownValue || (isLoading && !hasRealAudio)}
            className="relative w-10 h-10 rounded-full bg-primary text-on-primary hover:bg-opacity-90 flex items-center justify-center transition shadow active:scale-95 cursor-pointer disabled:cursor-wait"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {countdownValue !== null ? (
              <span className="text-sm font-mono font-bold text-on-primary tabular-nums">
                {countdownValue}
              </span>
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-on-primary" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5 text-on-primary" />
            )}
          </button>

          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full border border-hairline hover:bg-canvas-soft-2 text-mute hover:text-ink flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Reset"
            aria-label="Reset audio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 border border-hairline rounded-md bg-canvas-soft-2 p-0.5 ml-2">
            {[1.0, 1.2, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-3xs font-mono font-semibold rounded transition cursor-pointer ${
                  speed === s
                    ? "bg-canvas text-ink shadow-sm"
                    : "text-mute hover:text-ink"
                }`}
                aria-pressed={speed === s}
              >
                {s.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-2xs font-semibold text-mute font-mono uppercase bg-canvas-soft-2 border border-hairline px-3 py-1.5 rounded-md">
          {showRealAudio ? (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                {countdownValue !== null
                  ? `Starting in ${countdownValue}…`
                  : isPlaying
                  ? "Playing audio..."
                  : isLoading
                  ? "Buffering audio…"
                  : "Audio Ready"}
              </span>
            </>
          ) : loadFailed ? (
            <>
              <Info className="w-3.5 h-3.5" />
              <span>Audio unavailable</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading audio…</span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="relative h-1.5 w-full bg-canvas-soft-2 rounded-full overflow-hidden border border-hairline">
          {/* Buffered (lighter) under the playhead so the user can see
              download progress while they wait. */}
          {showRealAudio && (
            <div
              className="absolute inset-y-0 left-0 bg-hairline-strong/40 transition-[width] duration-300"
              style={{ width: `${buffered}%` }}
            />
          )}
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300 ease-linear"
            style={{ width: `${effectiveProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-3xs font-mono text-mute">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Audio failure notice */}
      {loadFailed && audioUrl && (
        <div className="bg-warning-soft/30 border border-warning/30 rounded-md p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-warning-deep mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-3xs font-bold font-mono uppercase tracking-wider text-warning-deep">
              Audio could not be loaded
            </p>
            <p className="text-3xs text-body leading-relaxed">
              We&apos;ll fall back to the transcript below (available after
              you submit your answer).
            </p>
          </div>
        </div>
      )}

      {/* Transcript — hidden until the user submits, so reading the
          transcript can't be used to cheat the listening test. */}
      {transcript && (
        <div className="border border-hairline rounded-md overflow-hidden bg-canvas-soft">
          <div className="w-full px-3 py-2 text-3xs font-semibold font-mono uppercase text-mute text-left flex justify-between items-center">
            <span>Transcript</span>
            <span className="text-[10px] normal-case tracking-normal">
              {showTranscript ? "Available now" : "Revealed after you submit"}
            </span>
          </div>
          {showTranscript && (
            <div className="p-3.5 border-t border-hairline bg-canvas text-xs text-body leading-relaxed font-geist">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}