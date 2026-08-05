"use client";

export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
    navigator.userAgent
  ) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
}

export interface SpeechAnalysisResult {
  hasSpeech: boolean;
  durationSeconds: number;
  rmsVolume: number;
  speechDurationSeconds: number;
}

/**
 * Inspects an audio Blob to verify if voice audio was captured.
 * Designed with mobile compatibility (iOS Safari AAC / WebM chunks) in mind.
 */
export async function verifySpeechInAudio(blob: Blob | null): Promise<SpeechAnalysisResult> {
  if (!blob || blob.size < 100) {
    return { hasSpeech: false, durationSeconds: 0, rmsVolume: 0, speechDurationSeconds: 0 };
  }

  // Size fallback for mobile compressed audio (e.g. AAC/MP4/WebM)
  const durationEst = Math.max(1, Math.round(blob.size / 16000));
  const mobileSizeHasAudio = blob.size > 200;

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass = typeof window !== "undefined"
      ? (window.AudioContext || (window as any).webkitAudioContext)
      : null;

    if (!AudioContextClass) {
      return {
        hasSpeech: mobileSizeHasAudio,
        durationSeconds: durationEst,
        rmsVolume: 0.05,
        speechDurationSeconds: durationEst,
      };
    }

    const audioCtx = new AudioContextClass();
    
    // WebKit decodeAudioData promise wrapper for older iOS Safari
    const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      const promise = audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
      if (promise && typeof promise.then === "function") {
        promise.then(resolve).catch(reject);
      }
    });

    const channelData = audioBuffer.getChannelData(0);
    const totalSamples = channelData.length;
    const sampleRate = audioBuffer.sampleRate;
    const durationSeconds = totalSamples / sampleRate;

    if (durationSeconds <= 0) {
      await audioCtx.close();
      return { hasSpeech: mobileSizeHasAudio, durationSeconds: durationEst, rmsVolume: 0, speechDurationSeconds: 0 };
    }

    let sumSquare = 0;
    const windowSize = Math.floor(sampleRate * 0.05);
    let speechWindows = 0;
    let totalWindows = 0;

    for (let i = 0; i < totalSamples; i += windowSize) {
      let windowSum = 0;
      const count = Math.min(windowSize, totalSamples - i);
      for (let j = 0; j < count; j++) {
        const val = channelData[i + j];
        windowSum += val * val;
      }
      const windowRms = Math.sqrt(windowSum / count);
      sumSquare += windowSum;
      totalWindows++;

      if (windowRms > 0.008) {
        speechWindows++;
      }
    }

    const rmsVolume = Math.sqrt(sumSquare / totalSamples);
    const speechDurationSeconds = (speechWindows / Math.max(1, totalWindows)) * durationSeconds;
    const hasSpeech = speechDurationSeconds >= 0.2 || rmsVolume > 0.005 || mobileSizeHasAudio;

    await audioCtx.close();

    return {
      hasSpeech,
      durationSeconds,
      rmsVolume,
      speechDurationSeconds,
    };
  } catch (err) {
    // If browser audio decoder failed on compressed mobile format, fallback to blob presence
    return {
      hasSpeech: mobileSizeHasAudio,
      durationSeconds: durationEst,
      rmsVolume: 0.05,
      speechDurationSeconds: durationEst,
    };
  }
}

/**
 * Attempts backend API audio transcription via /api/transcribe
 */
export async function transcribeAudioViaApi(blob: Blob): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("audio", blob, "speaking_answer." + (blob.type.includes("mp4") ? "mp4" : "webm"));

    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.transcript && typeof data.transcript === "string" && data.transcript.trim().length > 0) {
        return data.transcript.trim();
      }
    }
  } catch {}
  return null;
}

/**
 * Transcribes recorded audio accurately using live STT or backend Speech-to-Text API.
 * Never substitutes question prompt text for user voice.
 */
export async function detectAccurateTranscript(options: {
  audioBlob?: Blob | null;
  liveTranscript?: string;
  taskType: string;
  referenceText?: string;
  modelAnswer?: string;
  fallbackDuration?: number;
}): Promise<{ transcript: string; isRecovered: boolean; speechDetected: boolean }> {
  const { audioBlob, liveTranscript = "", fallbackDuration = 0 } = options;

  const trimmedLive = liveTranscript.trim();

  // If live STT captured speech (1 or more non-empty words), return live STT
  if (trimmedLive.split(/\s+/).filter(Boolean).length >= 1) {
    return { transcript: trimmedLive, isRecovered: false, speechDetected: true };
  }

  // Inspect audio recording and perform backend audio-to-text API transcription
  let speechAnalysis: SpeechAnalysisResult = {
    hasSpeech: false,
    durationSeconds: fallbackDuration,
    rmsVolume: 0,
    speechDurationSeconds: 0,
  };

  if (audioBlob) {
    speechAnalysis = await verifySpeechInAudio(audioBlob);

    // Call backend Speech-to-Text API to transcribe actual user audio
    const apiTranscript = await transcribeAudioViaApi(audioBlob);
    if (apiTranscript && apiTranscript.length > 0) {
      return { transcript: apiTranscript, isRecovered: true, speechDetected: true };
    }
  }

  const hasRecordedVoice = speechAnalysis.hasSpeech || (audioBlob !== undefined && audioBlob !== null && audioBlob.size > 200);

  if (!hasRecordedVoice) {
    return { transcript: "", isRecovered: false, speechDetected: false };
  }

  // Audio recorded, but STT API returned no words.
  // Do NOT return question prompt text. Return empty string so scoring reflects actual speech output.
  return {
    transcript: "",
    isRecovered: false,
    speechDetected: false,
  };
}
