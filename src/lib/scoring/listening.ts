/**
 * Pure functions for scoring all PTE Listening task types.
 */

// 1. Summarize Spoken Text (AI evaluation mock)
export function scoreSummarizeSpoken(userText: string, min = 50, max = 70) {
  const words = userText.trim().split(/\s+/).filter(Boolean).length;
  // Standard PTE range is 50-70 words
  const isWithinLimit = words >= min && words <= max;
  
  return {
    score: isWithinLimit ? 10 : 5, // Mocked content/form score
    maxScore: 10,
    isWithinLimit,
    wordCount: words,
  };
}

// 2. Listening Multiple Choice – Multiple Answers
export function scoreListeningMCQMultiple(
  selectedOptions: string[],
  correctAnswers: string[]
) {
  const maxScore = correctAnswers.length;
  let score = 0;

  selectedOptions.forEach((option) => {
    if (correctAnswers.includes(option)) {
      score += 1;
    } else {
      score -= 1; // Negative marking
    }
  });

  score = Math.max(0, score);
  return { score, maxScore };
}

// 3. Listening Fill in the Blanks
export function scoreListeningFillInBlanks(
  userAnswers: Record<string, string>,
  correctAnswers: Record<string, string>
) {
  const keys = Object.keys(correctAnswers);
  const maxScore = keys.length;
  let score = 0;

  keys.forEach((key) => {
    if (
      userAnswers[key] &&
      userAnswers[key].trim().toLowerCase() === correctAnswers[key].trim().toLowerCase()
    ) {
      score += 1;
    }
  });

  return { score, maxScore };
}

// 4. Listening Multiple Choice – Single Answer
export function scoreListeningMCQSingle(
  selectedOption: string | null,
  correctAnswers: string[]
) {
  const maxScore = 1;
  const correctOption = correctAnswers[0];
  const score =
    selectedOption &&
    selectedOption.trim().toUpperCase() === correctOption.trim().toUpperCase()
      ? 1
      : 0;

  return { score, maxScore };
}

// 5. Select Missing Word
export function scoreSelectMissingWord(
  selectedOption: string | null,
  correctAnswers: string[]
) {
  // Uses same logic as MCQ Single
  return scoreListeningMCQSingle(selectedOption, correctAnswers);
}

// 6. Highlight Incorrect Words (Correct flags - Wrong flags, min 0)
export function scoreHighlightIncorrectWords(
  selectedWords: string[], // Words user clicked
  incorrectWords: string[] // Words that were actually incorrect in transit
) {
  const maxScore = incorrectWords.length;
  let correctCount = 0;
  let wrongCount = 0;

  selectedWords.forEach((word) => {
    if (incorrectWords.includes(word)) {
      correctCount += 1;
    } else {
      wrongCount += 1; // Penalty for flagging correct words
    }
  });

  const score = Math.max(0, correctCount - wrongCount);

  return { score, maxScore, correctCount, wrongCount };
}

// 7. Write from Dictation (Word-by-word tokenized comparison)
export function scoreWriteFromDictation(
  userText: string,
  correctSentence: string
) {
  const clean = (text: string) =>
    text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const userWords = clean(userText).split(" ").filter(Boolean);
  const correctWords = clean(correctSentence).split(" ").filter(Boolean);

  const maxScore = correctWords.length;
  let score = 0;

  // Count correct words matching correct list sequence
  const correctWordSet = [...correctWords];
  userWords.forEach((w) => {
    const idx = correctWordSet.indexOf(w);
    if (idx !== -1) {
      score += 1;
      // Remove word to avoid duplicate matches (same word appearing once in key but multiple in input)
      correctWordSet.splice(idx, 1);
    }
  });

  return { score, maxScore };
}
