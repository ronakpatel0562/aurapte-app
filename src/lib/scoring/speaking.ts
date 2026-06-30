/**
 * Scoring functions for PTE Speaking task types.
 * All functions return integer percentages (0–100).
 */

// Fluency: approximated by words-per-minute relative to ideal PTE speaking pace (~110 WPM).
// Each WPM of deviation from the ideal costs 0.7 points, floored at 0.
export function scoreFluency(transcript: string, recordingSeconds: number): number {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || recordingSeconds <= 0) return 0;
  const wpm = (words.length / recordingSeconds) * 60;
  const deviation = Math.abs(wpm - 110);
  return Math.round(Math.max(0, 100 - deviation * 0.7));
}

// Pronunciation (Read Aloud) / Accuracy (Repeat Sentence):
// Measures how many reference words appear in the transcript in the correct relative order
// using Longest Common Subsequence over normalised word lists.
export function scorePronunciation(transcript: string, reference: string): number {
  return wordMatchScore(transcript, reference);
}

export function scoreAccuracy(transcript: string, reference: string): number {
  return wordMatchScore(transcript, reference);
}

function wordMatchScore(transcript: string, reference: string): number {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const tWords = norm(transcript).split(/\s+/).filter(Boolean);
  const rWords = norm(reference).split(/\s+/).filter(Boolean);
  if (rWords.length === 0 || tWords.length === 0) return 0;
  const matched = lcsLength(tWords, rWords);
  return Math.round((matched / rWords.length) * 100);
}

function lcsLength(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
