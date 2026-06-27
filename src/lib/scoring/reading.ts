/**
 * Pure functions for scoring all PTE Reading task types.
 * These can be reused in practice banks, practice tests, and mock tests.
 */

// 1. Reading & Writing Fill in the Blanks
export function scoreRWFillInBlanks(
  userAnswers: Record<string, string>,
  correctAnswers: Record<string, string>
) {
  const blankKeys = Object.keys(correctAnswers);
  const maxScore = blankKeys.length;
  let score = 0;

  blankKeys.forEach((key) => {
    if (
      userAnswers[key] &&
      userAnswers[key].trim().toLowerCase() === correctAnswers[key].trim().toLowerCase()
    ) {
      score += 1;
    }
  });

  return { score, maxScore };
}

// 2. Multiple Choice – Multiple Answers (Negative marking applies, min 0)
export function scoreMCQMultiple(
  selectedOptions: string[],
  correctAnswers: string[]
) {
  const maxScore = correctAnswers.length;
  let score = 0;

  selectedOptions.forEach((option) => {
    if (correctAnswers.includes(option)) {
      score += 1;
    } else {
      score -= 1; // Negative marking for wrong selections
    }
  });

  // Score cannot fall below 0
  score = Math.max(0, score);

  return { score, maxScore };
}

// 3. Re-order Paragraphs (Adjacent pair scoring method)
export function scoreReorderParagraphs(
  userOrder: string[],
  correctOrder: string[]
) {
  const maxScore = Math.max(0, correctOrder.length - 1);
  let score = 0;

  if (maxScore === 0) {
    return { score: 0, maxScore: 0 };
  }

  // Create a set of correct adjacent pairs (e.g., "A-B")
  const correctPairs = new Set<string>();
  for (let i = 0; i < correctOrder.length - 1; i++) {
    correctPairs.add(`${correctOrder[i]}-${correctOrder[i + 1]}`);
  }

  // Count user correct pairs
  for (let i = 0; i < userOrder.length - 1; i++) {
    const pair = `${userOrder[i]}-${userOrder[i + 1]}`;
    if (correctPairs.has(pair)) {
      score += 1;
    }
  }

  return { score, maxScore };
}

// 4. Reading Fill in the Blanks (Dropdown Selectors)
export function scoreReadingFillInBlanks(
  userAnswers: Record<string, string>,
  correctAnswers: Record<string, string>
) {
  // Shares the exact same score logic as RW blanks (1 pt per blank)
  return scoreRWFillInBlanks(userAnswers, correctAnswers);
}

// 5. Multiple Choice – Single Answer (1 or 0)
export function scoreMCQSingle(
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
