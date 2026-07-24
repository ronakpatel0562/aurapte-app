/**
 * Short synthesised tone played the instant a speaking recording window
 * starts, matching the real PTE driver's "prep countdown ends → beep →
 * recording begins" cue. Synthesised via Web Audio API (same approach as
 * HeadsetCheckScreen's chime) since there's no real exam audio asset for it.
 */
export function playRecordingBeep(): void {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 1000;
  gain.gain.value = 0.2;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
  osc.onended = () => ctx.close().catch(() => {});
}
