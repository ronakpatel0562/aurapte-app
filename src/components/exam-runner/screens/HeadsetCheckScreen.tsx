"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

const CHIME_DURATION = 4; // seconds — matches the real driver's "0:04" sample

/**
 * "Headset Check" — the first screen of the real PTE test driver. Plays a
 * short chime so the candidate can confirm their headset works before the
 * timed section begins. There's no real exam audio asset for this step,
 * so a short tone is synthesised with the Web Audio API instead of
 * shipping a static file.
 */
export default function HeadsetCheckScreen({
  onLockChange,
}: {
  /** Reports whether the exam shell should disable "Next" — locked while
   *  the chime is playing, same as a speaking prep/think countdown. */
  onLockChange?: (locked: boolean) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => onLockChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setPlaying(false);
    onLockChange?.(false);
  };

  const play = () => {
    if (playing) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = volume * 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + CHIME_DURATION);
    ctxRef.current = ctx;
    gainRef.current = gain;

    setPlaying(true);
    onLockChange?.(true);
    setCurrentTime(0);
    const start = Date.now();
    tickRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed >= CHIME_DURATION) {
        setCurrentTime(CHIME_DURATION);
        stop();
      } else {
        setCurrentTime(elapsed);
      }
    }, 100);
  };

  const toggle = () => (playing ? stop() : play());

  const formatTime = (s: number) => `0:${Math.floor(s).toString().padStart(2, "0")}`;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Headset Check</h2>
      <p className="text-sm text-gray-800 mb-4">
        This is an opportunity to check that your headset is working correctly.
      </p>
      <ol className="space-y-2 text-sm text-gray-800 mb-6">
        <li>1. Put your headset on and adjust it so that it fits comfortably over your ears.</li>
        <li>2. When you are ready, click on the [Play] button. You will hear a short recording.</li>
        <li>
          3. If you do not hear anything in your headphones while the status reads [Playing], raise your
          hand to get the attention of the Test Administrator.
        </li>
      </ol>

      <div className="flex items-center gap-3 bg-gray-100 border border-gray-300 rounded px-4 py-2.5 w-fit mb-6">
        <button onClick={toggle} className="text-gray-700 hover:text-gray-900" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <span className="text-xs font-mono tabular-nums text-gray-600">
          {formatTime(currentTime)} / {formatTime(CHIME_DURATION)}
        </span>
        <div className="w-40 h-1 bg-gray-300 rounded-full overflow-hidden">
          <div className="h-full bg-gray-500" style={{ width: `${(currentTime / CHIME_DURATION) * 100}%` }} />
        </div>
        <Volume2 className="w-4 h-4 text-gray-600" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (gainRef.current) gainRef.current.gain.value = v * 0.15;
          }}
          className="w-20 accent-gray-600"
        />
      </div>

      <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
        <li>During the practice you will not have [Play] and [Stop] buttons. The audio recording will start playing automatically.</li>
        <li>Please do not remove your headset. You should wear it throughout the test.</li>
      </ul>
    </div>
  );
}
