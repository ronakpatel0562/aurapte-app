"use client";

import React, { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

const AUTOPLAY_DELAY_SECONDS = 3;

/**
 * Steel-blue audio prompt widget used for every speaking task that opens
 * with a spoken prompt (Repeat Sentence, Responding to Situation, Answer
 * Short Question). Copied from the inline box already used by the
 * dashboard question components — see [[project_reuse_audio_component]]:
 * never re-invent this widget, always match its exact look (bg-[#5E94B5],
 * 3s auto-play delay, localStorage-persisted volume).
 */
export default function AudioPromptBox({
  audioUrl,
  onEnded,
}: {
  audioUrl: string | undefined;
  onEnded: () => void;
}) {
  const [prepSeconds, setPrepSeconds] = useState<number | null>(AUTOPLAY_DELAY_SECONDS);
  const [status, setStatus] = useState("Ready");
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    if (prepSeconds === null) return;
    if (prepSeconds > 0) {
      const t = setTimeout(() => setPrepSeconds((prev) => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearTimeout(t);
    }
    setPrepSeconds(null);
    setStatus("Playing");
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.play().catch(() => setStatus("Click to Play"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepSeconds]);

  const handleBoxClick = () => {
    if (status === "Click to Play" && audioRef.current && prepSeconds === null) {
      audioRef.current.play().then(() => setStatus("Playing")).catch(() => setStatus("Click to Play"));
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="flex justify-center py-8 select-none">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            setCurrentTime(el.currentTime);
            if (el.duration) {
              setDuration(el.duration);
              setProgress((el.currentTime / el.duration) * 100);
            }
          }}
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration) setDuration(e.currentTarget.duration);
          }}
          onEnded={() => {
            setStatus("Audio Finished");
            setProgress(100);
            onEnded();
          }}
        />
      )}
      <div
        onClick={handleBoxClick}
        className={`w-[360px] h-[130px] bg-[#5E94B5] rounded shadow flex flex-col justify-between p-4 ${
          status === "Click to Play" ? "cursor-pointer hover:bg-[#5284A3]" : ""
        }`}
      >
        <div className="w-full h-[6px] bg-[#3B6C8A]/40 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-[#1C415A] transition-all duration-300 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
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
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-48 h-[3px] bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
            style={{
              background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
