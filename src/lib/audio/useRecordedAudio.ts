"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Captures the actual mic audio during a recording phase, separately from
 * SpeechRecognition (which only ever exposes a transcript, never the audio
 * itself) — so the student can play back what they actually said instead of
 * only reading the auto-transcript. Call `start()` when the recording phase
 * begins and `stop()` when it ends; the resulting blob URL lands in
 * `audioUrl` once the recorder flushes. `reset()` revokes the previous URL
 * ahead of a fresh attempt.
 */
export function useRecordedAudio() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Returns a promise that resolves once the recorder is actually rolling
  // (or immediately if mic access fails) — callers that also run
  // SpeechRecognition on the same device should await this before starting
  // it. Requesting a second live getUserMedia stream *while* SpeechRecognition
  // is mid-session tends to force Chrome to renegotiate the shared audio
  // pipeline (echo-cancellation/AGC), which can abort and restart the
  // recognition session and drop whatever hadn't been finalised yet — hence
  // disabling audio processing here and sequencing the two acquisitions
  // instead of racing them.
  // Resolves `true` once the recorder is actually rolling, `false` if mic
  // access failed — callers that also run SpeechRecognition on the same
  // device should await this before starting it, and can use the boolean to
  // decide whether to surface a "microphone blocked" warning.
  const start = useCallback((): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return Promise.resolve(false);
    return navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      .then((stream) => {
        streamRef.current = stream;
        chunksRef.current = [];
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          stream.getTracks().forEach((t) => t.stop());
          return false;
        }
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
        recorderRef.current = recorder;
        return true;
      })
      .catch(() => false);
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [stop]);

  return { audioUrl, start, stop, reset };
}
