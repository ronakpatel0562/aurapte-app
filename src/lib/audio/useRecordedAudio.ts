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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
        
        let chosenMimeType = "";
        if (typeof MediaRecorder !== "undefined") {
          const candidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
            "audio/aac",
            "audio/ogg",
            "audio/wav",
          ];
          chosenMimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
        }

        try {
          recorder = chosenMimeType
            ? new MediaRecorder(stream, { mimeType: chosenMimeType })
            : new MediaRecorder(stream);
        } catch {
          try {
            recorder = new MediaRecorder(stream);
          } catch {
            stream.getTracks().forEach((t) => t.stop());
            return false;
          }
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const finalMime = recorder.mimeType || chosenMimeType || "audio/wav";
          const blob = new Blob(chunksRef.current, { type: finalMime });
          setAudioBlob(blob);
          setAudioUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start(100); // 100ms timeslice to ensure frequent dataavailable on mobile
        recorderRef.current = recorder;
        return true;
      })
      .catch(() => false);
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {}
    }
    recorderRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setAudioBlob(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [stop]);

  return { audioUrl, audioBlob, start, stop, reset };
}
