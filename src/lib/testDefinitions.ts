/**
 * Test definitions parsed from the legacy JSON dumps (PracticeTest.txt
 * and MockTest.txt) provided as Aura's source of truth for which
 * questions belong to which test.
 *
 * Why this exists:
 *   - The original data lives in MongoDB with ObjectIDs (24-hex strings).
 *   - AuraPTE's Supabase `questions` table uses UUIDs.
 *   - Until we build a one-time import that maps Mongo IDs to Supabase
 *     UUIDs, we treat the JSON as a *plan* — it tells us "Test N has
 *     13 Reading questions, 3 Writing, 11 Listening, 28 Speaking" — and
 *     the runner fetches that many active questions from the matching
 *     module at runtime.
 *   - Once you populate the `legacy_mongo_id` column on `questions`
 *     (or run the import script in supabase/migrations/), the runner
 *     switches to exact-ID lookups automatically.
 *
 * Each section also has a `targetCount` we use as the expected size; the
 * runner may fall back to "all questions for this module" if fewer exist.
 */

export interface TestSectionCategory {
  /** DB task_type this group of legacy IDs belongs to, or null if the
   *  category couldn't be recovered from the legacy source dump (falls
   *  back to a generic same-module top-up at fetch time). */
  taskType: string | null;
  legacyIds: string[];
}

export interface TestSection {
  module: "speaking" | "writing" | "reading" | "listening";
  /** Original Mongo ObjectIDs (kept for future exact-ID lookup). */
  legacyIds: string[];
  /** Number of questions this section expects (derived from legacyIds length). */
  targetCount: number;
  /** legacyIds grouped by their intended task_type, recovered positionally
   *  from the legacy source dump (aus_data) — see extract script notes.
   *  Optional: only practice tests currently have this; mock test rosters
   *  don't overlap with the imported question bank at all, so there's
   *  nothing to recover the category from. */
  categories?: TestSectionCategory[];
}

export interface TestDefinition {
  id: string; // e.g. "practice-test-1"
  kind: "practice" | "mock";
  testNumber: number;
  title: string;
  /** Total expected question count, summed from section targetCounts. */
  totalQuestions: number;
  /** True if this is the timed full PTE-simulation track. */
  isMock: boolean;
  /** Sections in display order (matches PTE exam flow). */
  sections: TestSection[];
}

interface RawTestJson {
  data: {
    practiceTests?: TestDefinition[];
    mockTests?: TestDefinition[];
  };
}

/**
 * The JSON files (`testDefinitions.practice.json` / `.mock.json`) are
 * already shaped as `TestDefinition[]` — they were pre-built from the
 * original Mongo dump by `scripts/extract_test_definitions.py`, not left
 * as raw Mongo documents. So there is nothing to "parse" here; this just
 * validates the shape and keeps a stable import point for the rest of the
 * app (and a single place to add real parsing back if the JSON source
 * ever reverts to a raw dump).
 */
export function parseTestDefinitions(raw: RawTestJson): {
  practice: TestDefinition[];
  mock: TestDefinition[];
} {
  return {
    practice: raw.data?.practiceTests ?? [],
    mock: raw.data?.mockTests ?? [],
  };
}

/**
 * Inline copies of the parsed JSON data so the runner works without
 * hitting the filesystem or making a network call. Kept in code (not as
 * a DB migration) because the JSON is the source of truth until the
 * questions are imported — at which point this constant can be deleted.
 */
import practiceJson from "./testDefinitions.practice.json";
import mockJson from "./testDefinitions.mock.json";

const parsedPractice = parseTestDefinitions(practiceJson as unknown as RawTestJson);
const parsedMock = parseTestDefinitions(mockJson as unknown as RawTestJson);

const PRACTICE_BY_ID = new Map<string, TestDefinition>(parsedPractice.practice.map((t) => [t.id, t]));
const MOCK_BY_ID = new Map<string, TestDefinition>(parsedMock.mock.map((t) => [t.id, t]));

export function getPracticeTest(id: string): TestDefinition | undefined {
  return PRACTICE_BY_ID.get(id);
}
export function getMockTest(id: string): TestDefinition | undefined {
  return MOCK_BY_ID.get(id);
}

export function allPracticeTests(): TestDefinition[] {
  return parsedPractice.practice;
}
export function allMockTests(): TestDefinition[] {
  return parsedMock.mock;
}
