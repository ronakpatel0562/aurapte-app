"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isMobileDevice } from "./transcriptDetector";

export interface UseSpeechRecognitionOptions {
  onTranscriptChange?: (transcript: string) => void;
  lang?: string;
}

/**
 * Dedicated hook for Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * engineered specifically to overcome common mobile browser (iOS Safari, Android Chrome) blockers:
 *
 * 1. Vendor prefixes: Properly targets webkitSpeechRecognition on Safari/iOS.
 * 2. Strict mobile user-gesture requirements: Exposes synchronous startRecognition() to be called directly inside onClick/onTouchEnd event handlers without async promise gaps.
 * 3. HTTPS and microphone permission handling: Evaluates secure context requirements and handles permission denials in onerror without spin-looping.
 * 4. Audio hardware initialization delays: Implements timed backoffs before restarting onend to accommodate mobile mic teardown and reset latency.
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { onTranscriptChange, lang = "en-US" } = options;

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const latestTranscriptRef = useRef("");
  const shouldListenRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTranscriptChangeRef = useRef(onTranscriptChange);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    shouldListenRef.current = false;
    clearRestartTimeout();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearRestartTimeout]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    latestTranscriptRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  const startRecognition = useCallback(() => {
    // Prevent duplicate initialization if session is already active
    if (shouldListenRef.current && recognitionRef.current) {
      return;
    }

    // Check for secure HTTPS context (mandatory for Web Speech API on mobile Chrome/Safari)
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.startsWith("127.")
    ) {
      const msg = "Speech recognition usually requires a secure HTTPS connection on mobile devices.";
      console.warn(msg);
    }

    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SR) {
      console.warn("SpeechRecognition / webkitSpeechRecognition is not supported in this browser.");
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    shouldListenRef.current = true;
    clearRestartTimeout();
    setError(null);

    const setupAndStart = () => {
      if (!shouldListenRef.current) return;

      try {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let currentSessionText = "";

          // On mobile Android Chrome (Google Voice Typing) and some mobile Web Speech engines,
          // when continuous is true, each item in event.results often returns the cumulative
          // transcript of the entire session rather than individual phrase segments.
          // Appending every item across event.results causes exponential word repetition.
          if (isMobileDevice() && event.results.length > 0) {
            // Take the latest result, which on mobile represents the complete utterance so far
            const lastIdx = event.results.length - 1;
            currentSessionText = (event.results[lastIdx][0]?.transcript || "").trim();
          } else {
            // On desktop browsers, concatenate sequential phrases while protecting against duplication
            for (let i = 0; i < event.results.length; i++) {
              const text = (event.results[i][0]?.transcript || "").trim();
              if (!text) continue;
              if (text.toLowerCase().startsWith(currentSessionText.toLowerCase()) && currentSessionText.length > 0) {
                currentSessionText = text;
              } else {
                currentSessionText += (currentSessionText ? " " : "") + text;
              }
            }
          }

          const full = (finalTranscriptRef.current + " " + currentSessionText).trim();
          latestTranscriptRef.current = full;
          setTranscript(full);
          onTranscriptChangeRef.current?.(full);
        };

        recognition.onerror = (event: any) => {
          const errType = event.error;
          // Handle explicit mobile permission block or security failures
          if (errType === "not-allowed" || errType === "service-not-allowed" || errType === "security") {
            const msg = "Microphone permission denied or service blocked for speech recognition.";
            console.warn(msg, event);
            setError(msg);
            shouldListenRef.current = false; // Do not auto-restart if permission was denied
            setIsListening(false);
          } else {
            // Transient mobile errors like 'no-speech', 'aborted', or 'network' are common
            // when speech pauses or audio hardware transitions. We allow onend to restart cleanly.
            console.debug("Transient speech recognition error:", errType);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          // Save whatever total transcript was recognized before this session ended into finalTranscriptRef,
          // so when the next session starts, new words append cleanly after previous words without duplication.
          if (latestTranscriptRef.current) {
            finalTranscriptRef.current = latestTranscriptRef.current;
          }
          if (shouldListenRef.current && recognitionRef.current === recognition) {
            // Audio hardware initialization & release delays on mobile devices:
            // Immediate synchronous restarts on mobile Safari/Chrome trigger InvalidStateError
            // or break microphone audio routing. Use 300ms backoff on mobile, 50ms on desktop.
            const delay = isMobileDevice() ? 300 : 50;
            clearRestartTimeout();
            restartTimeoutRef.current = setTimeout(() => {
              if (shouldListenRef.current) {
                setupAndStart();
              }
            }, delay);
          }
        };

        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Failed to start speech recognition:", err);
        if (shouldListenRef.current) {
          // Retry starting after a delay if mobile hardware was mid-release or initializing
          const delay = isMobileDevice() ? 400 : 100;
          clearRestartTimeout();
          restartTimeoutRef.current = setTimeout(() => {
            if (shouldListenRef.current) {
              setupAndStart();
            }
          }, delay);
        }
      }
    };

    setupAndStart();
  }, [clearRestartTimeout, lang]);

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return {
    transcript,
    latestTranscriptRef,
    finalTranscriptRef,
    isListening,
    error,
    startRecognition,
    stopRecognition,
    resetTranscript,
  };
}
