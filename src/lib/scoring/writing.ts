/**
 * Pure functions for scoring all PTE Writing task types.
 * These can be reused in practice banks, practice tests, and mock tests.
 */

// 1. Summarize Written Text (Form + Content checks mock)
// PTE scoring is AI-based. We approximate the official 7-point scale by
// evaluating structural constraints the candidate must satisfy:
//  - Word count must be inside the official 5–75 word window
//  - Summary must read as a single sentence (exactly one terminal period)
//  - Length must be plausible (non-trivial content, not just stop words)
export function scoreSummarizeWrittenText(userText: string) {
  const trimmed = (userText || "").trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  const isWithinWordLimit = wordCount >= 5 && wordCount <= 75;
  const isSingleSentence = countTerminalSentences(trimmed) === 1;
  const hasSubstantiveContent = wordCount >= 5;

  // Base 7 points (PTE max per question). Deductions break the form requirement.
  let score = 7;

  if (!isWithinWordLimit) {
    // Heavy deduction for missing the most basic requirement
    score = 1;
  } else if (!isSingleSentence) {
    // 2-point deduction for breaking the "one sentence" rule
    score -= 2;
  } else if (!hasSubstantiveContent) {
    score -= 4;
  }

  // Clamp into [0, 7]
  score = Math.max(0, Math.min(7, score));

  return {
    score,
    maxScore: 7,
    wordCount,
    isWithinWordLimit,
    isSingleSentence,
    hasSubstantiveContent,
  };
}

// Count sentences by detecting terminal punctuation marks (. ! ?)
function countTerminalSentences(text: string): number {
  if (!text) return 0;
  const matches = text.match(/[.!?]+/g);
  return matches ? matches.length : 0;
}

// 2. Write Email (structural scoring)
// PTE Write Email is scored on a 0–7 scale. We approximate it structurally:
//  - Word count must be inside the official 50–120 word window
//  - Body should read as a coherent single piece of prose (>=2 sentences)
//  - Email should contain a greeting and a sign-off (basic discourse markers)
export function scoreWriteEmail(userText: string) {
  const trimmed = (userText || "").trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  const isWithinWordLimit = wordCount >= 50 && wordCount <= 120;
  const sentenceCount = countTerminalSentences(trimmed);
  const hasMultipleSentences = sentenceCount >= 2;
  const lower = trimmed.toLowerCase();
  const hasGreeting =
    /^\s*(dear|hi|hello|hey|good (morning|afternoon|evening)|to whom)/.test(
      lower,
    );
  const hasSignOff =
    /(regards|best|sincerely|kind regards|thank you|thanks|cheers),?\s*$/i.test(
      trimmed,
    );

  let score = 7;

  if (!isWithinWordLimit) {
    score = 1;
  } else {
    if (!hasGreeting) score -= 2;
    if (!hasSignOff) score -= 1;
    if (!hasMultipleSentences) score -= 1;
  }

  score = Math.max(0, Math.min(7, score));

  return {
    score,
    maxScore: 7,
    wordCount,
    isWithinWordLimit,
    hasGreeting,
    hasSignOff,
    hasMultipleSentences,
    sentenceCount,
  };
}
