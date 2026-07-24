"use client";

import React, { useEffect, useRef, useState } from "react";
import PrepCircle from "./PrepCircle";
import RecordingMeter from "./RecordingMeter";
import AudioPromptBox from "./AudioPromptBox";
import { playRecordingBeep } from "@/lib/audio/beep";
import { useRecordedAudio } from "@/lib/audio/useRecordedAudio";

export type SpeakingStep =
  | { kind: "audio"; audioUrl?: string }
  | { kind: "wait"; seconds: number; message: (secondsLeft: number) => string; tone?: "neutral" | "warning" }
  | { kind: "record"; seconds: number };

/**
 * Drives the prep/think/record sequence shared by every speaking task
 * type in the exam clone (Read Aloud, Repeat Sentence, Describe Image,
 * Responding to Situation, Answer Short Question, and the fixed Personal
 * Introduction prompt). One state machine, parametrised by `steps`,
 * instead of re-deriving near-identical timer logic per task type.
 *
 * Mount a fresh instance per question via `key={question.id}` — unmount
 * cleans up timers/recognition automatically, so there's no imperative
 * reset API to wire up.
 */
export default function SpeakingRecorderFlow({
  steps,
  onAnswerChange,
  onLockChange,
  onAudioRecorded,
}: {
  steps: SpeakingStep[];
  onAnswerChange: (transcript: string) => void;
  /** Reports whether the exam shell should disable "Next" and show a
   * "Cannot Skip" prompt. Locked during audio playback and prep/think
   * countdowns, but unlocked as soon as recording begins — the student
   * doesn't have to use the full recording window before moving on. */
  onLockChange?: (locked: boolean) => void;
  /** Fires with a playable blob URL once the "record" step's audio has been
   * captured, so the evaluation screen can offer play-back alongside the
   * transcript — see [[project_reuse_audio_component]] for why this reuses
   * the Question Bank's useRecordedAudio hook instead of a fresh MediaRecorder. */
  onAudioRecorded?: (url: string) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() => stepDuration(steps[0]));
  const [finished, setFinished] = useState(steps.length === 0);
  const [micWarning, setMicWarning] = useState<string | null>(null);

  const step = steps[stepIndex];

  useEffect(() => {
    // Once recording has actually started, let the student move on early —
    // the real exam doesn't require using the full recording window, only
    // the prep/think countdowns are non-skippable.
    onLockChange?.(!finished && step?.kind !== "record");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, stepIndex]);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedAudio = useRecordedAudio();

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const advance = () => {
    stopRecognition();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStepIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        setFinished(true);
        return i;
      }
      setSecondsLeft(stepDuration(steps[next]));
      return next;
    });
  };

  // Countdown for "wait" and "record" steps. The interval only decrements —
  // it must stay a pure updater, since React may invoke it twice (e.g. in
  // StrictMode) to check for purity. Calling `advance()` (which has side
  // effects) from inside it would then fire twice per tick and skip a step.
  useEffect(() => {
    if (!step || step.kind === "audio") return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Advance to the next step once the current step's countdown hits zero.
  useEffect(() => {
    if (!step || step.kind === "audio") return;
    if (secondsLeft <= 0) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, stepIndex]);

  // Beep the instant a "record" step begins, whether reached via a prep/think
  // countdown running out or the student skipping ahead early.
  useEffect(() => {
    if (step?.kind === "record") playRecordingBeep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Surface the captured recording to the exam shell as soon as it's ready.
  useEffect(() => {
    if (recordedAudio.audioUrl) onAudioRecorded?.(recordedAudio.audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordedAudio.audioUrl]);

  // Speech recognition runs for the duration of a "record" step. The
  // browser's own SpeechRecognition permission prompt is unreliable across
  // browsers (some silently no-op instead of prompting), so mic access is
  // requested explicitly first (via useRecordedAudio, which also captures
  // the audio itself for playback) and a warning surfaces if it's denied.
  // Recognition only starts once that request settles — starting it
  // *concurrently* with a second live getUserMedia stream tends to make
  // Chrome renegotiate the shared audio pipeline, aborting/restarting
  // recognition and dropping whatever hadn't been finalised yet.
  useEffect(() => {
    if (!step || step.kind !== "record") return;

    let cancelled = false;
    transcriptRef.current = "";
    finalTranscriptRef.current = "";
    setMicWarning(null);

    const startRecognition = () => {
      const SR =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;
      if (!SR) return;
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const full = (finalTranscriptRef.current + interim).trim();
        transcriptRef.current = full;
        onAnswerChange(full);
      };
      recognition.onerror = () => {};
      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {}
        }
      };
      recognition.start();
    };

    recordedAudio.start().then((ok) => {
      if (cancelled) return;
      if (ok) {
        startRecognition();
      } else {
        setMicWarning("Microphone access was blocked. Allow microphone permission to record your answer.");
      }
    });

    return () => {
      cancelled = true;
      stopRecognition();
      recordedAudio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => () => stopRecognition(), []);

  if (!step) return null;

  if (step.kind === "audio") {
    return <AudioPromptBox audioUrl={step.audioUrl} onEnded={advance} />;
  }

  if (step.kind === "wait") {
    return <PrepCircle count={secondsLeft} label={step.message(secondsLeft)} tone={step.tone} />;
  }

  // "record" step, in progress or just finished.
  const elapsed = step.seconds - secondsLeft;
  const isLastStep = stepIndex === steps.length - 1;
  const completed = finished && isLastStep;
  return (
    <div>
      <RecordingMeter
        elapsedSeconds={completed ? step.seconds : elapsed}
        totalSeconds={step.seconds}
        completed={completed}
      />
      {micWarning && (
        <p className="text-xs text-error-deep text-center -mt-8 mb-4">{micWarning}</p>
      )}
    </div>
  );
}

function stepDuration(step: SpeakingStep | undefined): number {
  if (!step) return 0;
  if (step.kind === "wait" || step.kind === "record") return step.seconds;
  return 0;
}
