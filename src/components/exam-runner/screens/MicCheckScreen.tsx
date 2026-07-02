"use client";

import React, { useRef, useState } from "react";
import { Mic, Square, Play } from "lucide-react";

type Phase = "idle" | "recording" | "recorded" | "playing";

/**
 * "Microphone Check" — Record / Stop / Playback segmented control matching
 * the real PTE test driver. Uses the actual mic (MediaRecorder) so the
 * check is genuine, not simulated.
 */
export default function MicCheckScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        audioUrlRef.current = URL.createObjectURL(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setPhase("recorded");
      };
      recorder.start();
      recorderRef.current = recorder;
      setPhase("recording");
    } catch {
      setError("Microphone access was blocked. Allow microphone permission to continue.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const playback = () => {
    if (!audioUrlRef.current) return;
    const el = audioElRef.current;
    if (!el) return;
    el.src = audioUrlRef.current;
    el.onended = () => setPhase("recorded");
    el.play().catch(() => {});
    setPhase("playing");
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Microphone Check</h2>
      <p className="text-sm text-gray-800 mb-4">
        This is an opportunity to check that your microphone is functioning correctly.
      </p>
      <ol className="space-y-2 text-sm text-gray-800 mb-6">
        <li>1. Make sure your headset is on and the microphone is in the downward position near your mouth.</li>
        <li>2. When you are ready, click on the [Record] button and say &quot;Testing, testing, one, two, three&quot; into the microphone.</li>
        <li>3. After you have spoken, click on the [Stop] button. Your recording is now complete.</li>
        <li>4. Now click on the [Playback] button. You should clearly hear yourself speaking.</li>
        <li>5. If you cannot hear your voice clearly, please raise your hand to get the attention of the Test Administrator.</li>
      </ol>

      <audio ref={audioElRef} />

      <div className="inline-flex items-center bg-white border border-gray-300 rounded-full overflow-hidden mb-3 shadow-sm">
        <button
          onClick={startRecording}
          disabled={phase === "recording"}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition ${
            phase === "recording"
              ? "bg-red-500 text-white animate-pulse cursor-default"
              : "text-gray-800 hover:bg-[#1e7a9c] hover:text-white cursor-pointer"
          }`}
        >
          <Mic className="w-3.5 h-3.5" /> Record
        </button>
        <span className="w-px h-5 bg-gray-300" />
        <button
          onClick={stopRecording}
          disabled={phase !== "recording"}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition ${
            phase === "recording"
              ? "text-gray-800 hover:bg-[#1e7a9c] hover:text-white cursor-pointer"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <Square className="w-3.5 h-3.5" /> Stop
        </button>
        <span className="w-px h-5 bg-gray-300" />
        <button
          onClick={playback}
          disabled={phase !== "recorded" && phase !== "playing"}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition ${
            phase === "playing"
              ? "bg-[#1e7a9c] text-white cursor-default"
              : phase === "recorded"
              ? "text-gray-800 hover:bg-[#1e7a9c] hover:text-white cursor-pointer"
              : "text-gray-300 cursor-not-allowed"
          }`}
        >
          <Play className="w-3.5 h-3.5" /> Playback
        </button>
      </div>

      {error && <p className="text-xs text-error-deep mb-3">{error}</p>}

      <p className="text-xs text-gray-600">
        During the practice you will not have [Record], [Playback] and [Stop] buttons. The voice recording will
        start automatically.
      </p>
    </div>
  );
}
