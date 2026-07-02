import { scoreFluency, scorePronunciation, scoreAccuracy } from "@/lib/scoring/speaking";
import { scoreSummarizeWrittenText, scoreWriteEmail } from "@/lib/scoring/writing";
import {
  scoreRWFillInBlanks,
  scoreReadingFillInBlanks,
  scoreReorderParagraphs,
  scoreMCQMultiple,
  scoreMCQSingle,
} from "@/lib/scoring/reading";
import {
  scoreSummarizeSpoken,
  scoreListeningFillInBlanks,
  scoreListeningMCQMultiple,
  scoreListeningMCQSingle,
  scoreSelectMissingWord,
  scoreHighlightIncorrectWords,
  scoreWriteFromDictation,
} from "@/lib/scoring/listening";
import type { RunnerQuestion } from "@/components/test-runner/QuestionRunner";

/**
 * Reading/listening exam bodies serialise their structured answers (records,
 * arrays) to JSON strings before handing them to ExamRunner's string-only
 * answer store — see ExamQuestionBody. `decodeJson` reverses that so the
 * scorer (and the evaluation screen) can read the structured shape back.
 */
export function decodeJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Single source of truth for turning one stored exam answer into a
 * { score, maxScore } pair. Used both when persisting attempts during the
 * exam (ExamRunner) and when rendering the post-submit evaluation screen so
 * the palette colours and the per-question badges never disagree.
 *
 * Speaking task types have no deterministic key, so they fall back to the
 * heuristic fluency/pronunciation/accuracy scorers — the evaluation screen
 * surfaces these as "recorded, indicative score" rather than a hard result.
 */
export function scoreAnswer(
  question: RunnerQuestion,
  answer: string
): { score: number; maxScore: number } {
  const { task_type, content } = question;
  switch (task_type) {
    case "read_aloud":
      return { score: scorePronunciation(answer, content.passage || ""), maxScore: 100 };
    case "repeat_sentence":
      return { score: scoreAccuracy(answer, content.sentence || content.transcript || ""), maxScore: 100 };
    case "describe_image":
      return { score: scoreFluency(answer, 40), maxScore: 100 };
    case "responding_to_situation":
      return { score: scoreFluency(answer, 40), maxScore: 100 };
    case "answer_short_question": {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      const expected = content.correct_answer ? norm(content.correct_answer).split(/\s+/).filter(Boolean) : [];
      const actual = norm(answer).split(/\s+/).filter(Boolean);
      const correct = expected.length > 0 && expected.every((w) => actual.includes(w));
      return { score: correct ? 1 : 0, maxScore: 1 };
    }
    case "summarize_written_text": {
      const r = scoreSummarizeWrittenText(answer);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "write_an_email": {
      const r = scoreWriteEmail(answer);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "rw_fill_in_the_blanks": {
      const r = scoreRWFillInBlanks(decodeJson(answer, {}), content.answers || {});
      return { score: r.score, maxScore: r.maxScore };
    }
    case "reading_fill_in_the_blanks": {
      const r = scoreReadingFillInBlanks(decodeJson(answer, {}), content.answers || {});
      return { score: r.score, maxScore: r.maxScore };
    }
    case "reorder_paragraphs": {
      const r = scoreReorderParagraphs(decodeJson<string[]>(answer, []), content.correct_order || []);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "reading_mcq_multiple": {
      const r = scoreMCQMultiple(decodeJson<string[]>(answer, []), content.correct_answers || []);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "reading_mcq_single": {
      const selected = decodeJson<string[]>(answer, [])[0] ?? null;
      const r = scoreMCQSingle(selected, content.correct_answers || []);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "summarize_spoken_text": {
      const r = scoreSummarizeSpoken(answer, 20, 30);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "listening_fill_in_the_blanks": {
      const r = scoreListeningFillInBlanks(decodeJson(answer, {}), content.answers || {});
      return { score: r.score, maxScore: r.maxScore };
    }
    case "listening_mcq_multiple": {
      const r = scoreListeningMCQMultiple(decodeJson<string[]>(answer, []), content.correct_answers || []);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "listening_mcq_single": {
      const selected = decodeJson<string[]>(answer, [])[0] ?? null;
      const r = scoreListeningMCQSingle(selected, content.correct_answers || []);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "select_missing_word": {
      const selected = decodeJson<string[]>(answer, [])[0] ?? null;
      const r = scoreSelectMissingWord(selected, content.correct_answers || []);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "highlight_incorrect_words": {
      // Encoded as "index:word" so repeated words toggle independently —
      // strip the index prefix back off before comparing to incorrect_words.
      const selected = decodeJson<string[]>(answer, []).map((k) => k.slice(k.indexOf(":") + 1));
      const r = scoreHighlightIncorrectWords(selected, content.incorrect_words || []);
      return { score: r.score, maxScore: r.maxScore };
    }
    case "write_from_dictation": {
      const r = scoreWriteFromDictation(answer, content.sentence || "");
      return { score: r.score, maxScore: r.maxScore };
    }
    default:
      return { score: 0, maxScore: 1 };
  }
}

/** Task types that are recorded audio and can't be deterministically graded. */
export const SPEAKING_TASK_TYPES = new Set([
  "read_aloud",
  "repeat_sentence",
  "describe_image",
  "responding_to_situation",
  "answer_short_question",
]);
