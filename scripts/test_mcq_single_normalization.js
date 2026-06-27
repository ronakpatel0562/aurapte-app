/**
 * Sanity checks for MCQ Single normalization logic.
 *
 * Mirrors the helpers in src/components/questions/reading/MCQSingle.tsx
 * to confirm scoring works against the live DB shape (singular
 * correct_answer + plain options), the seed shape (plural
 * correct_answers + letter keys), AND edge cases.
 */
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const optionHasPrefix = (opt) => {
  if (!opt || opt.length < 3) return false;
  const first = opt[0];
  return LETTERS.includes(first) && (opt[1] === ")" || opt[1] === ".");
};

const stripPrefix = (opt) =>
  optionHasPrefix(opt) ? opt.slice(2).trim() : opt;

const extractCorrectAnswer = (content, options) => {
  const resolveLetter = (val) => {
    const upper = val.trim().toUpperCase();
    if (upper.length === 1 && LETTERS.includes(upper)) {
      const idx = LETTERS.indexOf(upper);
      if (idx < options.length) return stripPrefix(options[idx]);
    }
    return null;
  };
  if (Array.isArray(content?.correct_answers) && content.correct_answers.length > 0) {
    const first = content.correct_answers[0];
    if (typeof first === "string") {
      return resolveLetter(first) ?? stripPrefix(first);
    }
  }
  if (typeof content?.correct_answer === "string" && content.correct_answer.length > 0) {
    return resolveLetter(content.correct_answer) ?? stripPrefix(content.correct_answer);
  }
  return null;
};

const scoreMCQSingle = (selectedText, correctAnswers) => {
  const correctOption = correctAnswers[0];
  return selectedText && correctOption != null && selectedText.trim().toLowerCase() === correctOption.trim().toLowerCase()
    ? { score: 1, maxScore: 1 }
    : { score: 0, maxScore: 1 };
};

const run = (name, content, selectedIndex, expectedScore) => {
  const raw = extractCorrectAnswer(content, content.options);
  const correctText = raw ? stripPrefix(raw) : null;
  const selectedOpt = content.options[selectedIndex];
  const selectedText = stripPrefix(selectedOpt);
  const result = scoreMCQSingle(selectedText, correctText ? [correctText] : []);
  const ok = result.score === expectedScore;
  if (ok) {
    console.log(`  \u2713 ${name}`);
    return true;
  } else {
    console.error(`  \u2717 ${name}  expected ${expectedScore}, got ${result.score}`);
    return false;
  }
};

let pass = 0, fail = 0;
const cases = [
  ["Live DB shape: plain options + singular correct_answer (correct pick)", {
    options: [
      "explain the variety of ways in which strangers can be treated",
      "explain the difference between the construction of the two bridges",
      "describe how people of different classes behaved when unhappy",
      "describe the way different sections of people like to dress",
    ],
    correct_answer: "describe how people of different classes behaved when unhappy",
  }, 2, 1],
  ["Live DB shape: plain options + singular correct_answer (wrong pick)", {
    options: [
      "explain the variety of ways in which strangers can be treated",
      "explain the difference between the construction of the two bridges",
      "describe how people of different classes behaved when unhappy",
      "describe the way different sections of people like to dress",
    ],
    correct_answer: "describe how people of different classes behaved when unhappy",
  }, 0, 0],
  ["Seed shape: letter-prefixed options + plural correct_answers letter key", {
    options: [
      "A) It rejected the study of classical Greek and Roman texts.",
      "B) It emphasized liberal arts education over medieval religious scholasticism.",
      "C) It aimed to prepare citizens for participation in civic and public life.",
    ],
    correct_answers: ["B"],
  }, 1, 1],
  ["Live listening shape: singular correct_answer (correct pick)", {
    options: ["Strongly agree", "Agree", "Somewhat agree", "Disagree"],
    correct_answer: "Somewhat agree",
  }, 2, 1],
  ["Edge: no correct answer at all (defensive)", {
    options: ["x", "y"],
  }, 0, 0],
  ["Edge: empty options array", {
    options: [],
    correct_answer: "anything",
  }, 0, 0],
];

for (const [name, content, idx, expected] of cases) {
  if (run(name, content, idx, expected)) pass++; else fail++;
}

console.log(`\nResults: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
