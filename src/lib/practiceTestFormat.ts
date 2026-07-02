/**
 * Canonical per-module / per-task_type question counts that make up one
 * practice test — same weightage used to build the fixed practice-test-1..30
 * roster (see scripts/build_bonus_practice_tests.py's FORMAT dict, derived
 * from the legacy tests whose task_type breakdown was fully recovered).
 *
 * This is the single source of truth for "what does a practice test look
 * like" on the TS side. The Python build script has its own copy since it
 * runs outside the Next.js runtime — keep the two in sync if this changes.
 */

export type Module = "speaking" | "writing" | "reading" | "listening";

export const PRACTICE_TEST_FORMAT: Record<Module, Array<[taskType: string, count: number]>> = {
  speaking: [
    ["read_aloud", 6],
    ["repeat_sentence", 10],
    ["describe_image", 4],
    ["responding_to_situation", 2],
    ["answer_short_question", 6],
  ],
  writing: [
    ["summarize_written_text", 2],
    ["write_an_email", 1],
  ],
  reading: [
    ["rw_fill_in_the_blanks", 11],
    ["reading_mcq_multiple", 1],
    ["reading_mcq_single", 1],
  ],
  listening: [
    ["listening_mcq_multiple", 1],
    ["summarize_spoken_text", 3],
    ["listening_mcq_single", 1],
    ["select_missing_word", 1],
    ["write_from_dictation", 5],
  ],
};

/** Module order matching the PTE exam flow. */
export const MODULE_ORDER: Module[] = ["speaking", "writing", "reading", "listening"];

/** test_id every generated random practice test is stamped with — a stable
 *  (not per-generation) value so repeated generations read like retries of
 *  the same test in user_attempts, consistent with how fixed practice tests
 *  already allow unlimited retries under the same test_id. */
export const RANDOM_PRACTICE_TEST_ID = "practice-random";
