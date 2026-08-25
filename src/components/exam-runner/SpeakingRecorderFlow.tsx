"use client";

import React, { useEffect, useRef, useState } from "react";
import PrepCircle from "./PrepCircle";
import RecordingMeter from "./RecordingMeter";
import AudioPromptBox from "./AudioPromptBox";
import { playRecordingBeep } from "@/lib/audio/beep";
import { useRecordedAudio } from "@/lib/audio/useRecordedAudio";
import { detectAccurateTranscript, isMobileDevice } from "@/lib/audio/transcriptDetector";
import { useSpeechRecognition } from "@/lib/audio/useSpeechRecognition";

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
  taskType,
  referenceText,
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
  taskType?: string;
  referenceText?: string;
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

  const transcriptRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedAudio = useRecordedAudio();
  const speech = useSpeechRecognition({
    onTranscriptChange: (newTranscript) => {
      transcriptRef.current = newTranscript;
      onAnswerChange(newTranscript);
    },
  });

  const advance = async () => {
    speech.stopRecognition();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const blob = await recordedAudio.stop();
    if (blob) {
      const res = await detectAccurateTranscript({
        audioBlob: blob,
        liveTranscript: transcriptRef.current,
        taskType: taskType || "read_aloud",
        referenceText: referenceText || "",
        fallbackDuration: step?.kind === "record" ? step.seconds : 30,
      });
      if (res.transcript) {
        transcriptRef.current = res.transcript;
        onAnswerChange(res.transcript);
      }
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

  // Surface the captured recording to the exam shell and recover mobile transcript if needed.
  useEffect(() => {
    if (recordedAudio.audioUrl) onAudioRecorded?.(recordedAudio.audioUrl);
    if (recordedAudio.audioBlob) {
      detectAccurateTranscript({
        audioBlob: recordedAudio.audioBlob,
        liveTranscript: transcriptRef.current,
        taskType: taskType || "read_aloud",
        referenceText: referenceText || "",
        fallbackDuration: step?.kind === "record" ? step.seconds : 30,
      }).then((res) => {
        if (res.transcript && res.transcript !== transcriptRef.current) {
          transcriptRef.current = res.transcript;
          onAnswerChange(res.transcript);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordedAudio.audioUrl, recordedAudio.audioBlob]);

  // Speech recognition runs for the duration of a "record" step. On mobile,
  // we initialize SpeechRecognition instantly to avoid gesture token loss and stagger
  // MediaRecorder to prevent audio hardware conflicts and initialization delays.
  useEffect(() => {
    if (!step || step.kind !== "record") return;

    let cancelled = false;
    transcriptRef.current = "";
    speech.resetTranscript();
    setMicWarning(null);

    if (isMobileDevice()) {
      // On mobile browsers (iOS Safari, Android Chrome), starting MediaRecorder (getUserMedia)
      // simultaneously with Web Speech API terminates or silences SpeechRecognition due to mobile
      // hardware single-stream restrictions. We let SpeechRecognition run exclusively on mobile.
      speech.startRecognition();
      return () => {
        cancelled = true;
        speech.stopRecognition();
        recordedAudio.stop();
      };
    } else {
      recordedAudio.start().then((ok) => {
        if (cancelled) return;
        if (ok) {
          speech.startRecognition();
        } else {
          setMicWarning("Microphone access was blocked. Allow microphone permission to record your answer.");
        }
      });
      return () => {
        cancelled = true;
        speech.stopRecognition();
        recordedAudio.stop();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

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
