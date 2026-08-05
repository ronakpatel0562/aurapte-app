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
  const mimeTypeRef = useRef<string>("");
  const currentBlobRef = useRef<Blob | null>(null);

  const start = useCallback((): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return Promise.resolve(false);
    return navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      .then((stream) => {
        streamRef.current = stream;
        chunksRef.current = [];
        currentBlobRef.current = null;
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
        mimeTypeRef.current = chosenMimeType;

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
          const finalMime = recorder.mimeType || mimeTypeRef.current || "audio/wav";
          const blob = new Blob(chunksRef.current, { type: finalMime });
          currentBlobRef.current = blob;
          setAudioBlob(blob);
          setAudioUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start(100); // 100ms timeslice for mobile streaming
        recorderRef.current = recorder;
        return true;
      })
      .catch(() => false);
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        recorderRef.current = null;
        if (chunksRef.current.length > 0 && !currentBlobRef.current) {
          const finalMime = mimeTypeRef.current || "audio/wav";
          const b = new Blob(chunksRef.current, { type: finalMime });
          currentBlobRef.current = b;
          setAudioBlob(b);
        }
        resolve(currentBlobRef.current);
        return;
      }

      const prevOnStop = recorder.onstop;
      recorder.onstop = (e) => {
        if (prevOnStop) prevOnStop.call(recorder, e);
        const finalMime = recorder.mimeType || mimeTypeRef.current || "audio/wav";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        currentBlobRef.current = blob;
        setAudioBlob(blob);
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch {
        recorderRef.current = null;
        resolve(currentBlobRef.current);
      }
    });
  }, []);

  const reset = useCallback(() => {
    stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    currentBlobRef.current = null;
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [stop]);

  return { audioUrl, audioBlob, start, stop, reset };
}
