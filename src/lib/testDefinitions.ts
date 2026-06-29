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

export interface TestSection {
  module: "speaking" | "writing" | "reading" | "listening";
  /** Original Mongo ObjectIDs (kept for future exact-ID lookup). */
  legacyIds: string[];
  /** Number of questions this section expects (derived from legacyIds length). */
  targetCount: number;
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
  statusCode?: number;
  data: {
    practiceTests?: RawTestEntry[];
    mockTests?: RawTestEntry[];
  };
}

interface RawTestEntry {
  _id: string;
  testName: string;
  sections: {
    Reading?: string[];
    Writing?: string[];
    Listening?: string[];
    Speaking?: string[];
  };
  status?: string;
  totalDuration?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Normalise the JSON dump (a single object with practiceTests/mockTests
 * arrays) into TestDefinition objects with section order matching the PTE
 * exam: Speaking → Writing → Reading → Listening.
 */
export function parseTestDefinitions(raw: RawTestJson): {
  practice: TestDefinition[];
  mock: TestDefinition[];
} {
  const practice: TestDefinition[] = (raw.data?.practiceTests ?? []).map((t, i) =>
    buildDefinition(t, "practice", i + 1)
  );
  const mock: TestDefinition[] = (raw.data?.mockTests ?? []).map((t, i) =>
    buildDefinition(t, "mock", i + 1)
  );
  return { practice, mock };
}

function buildDefinition(t: RawTestEntry, kind: "practice" | "mock", testNumber: number): TestDefinition {
  // Display order matches the PTE exam flow. The JSON file happens to
  // alphabetise the keys, but the section *order* on the page should
  // match the real exam.
  const sectionOrder: Array<{ key: keyof RawTestEntry["sections"]; module: TestSection["module"] }> = [
    { key: "Speaking", module: "speaking" },
    { key: "Writing", module: "writing" },
    { key: "Reading", module: "reading" },
    { key: "Listening", module: "listening" },
  ];

  const sections: TestSection[] = sectionOrder
    .map(({ key, module }) => ({
      module,
      legacyIds: Array.isArray(t.sections[key]) ? (t.sections[key] as string[]) : [],
      targetCount: Array.isArray(t.sections[key]) ? (t.sections[key] as string[]).length : 0,
    }))
    .filter((s) => s.targetCount > 0);

  const totalQuestions = sections.reduce((sum, s) => sum + s.targetCount, 0);
  const isMock = kind === "mock";
  const label = isMock ? `Full Mock Test #${testNumber}` : `Practice Test #${testNumber}`;
  const id = isMock ? `mock-test-${testNumber}` : `practice-test-${testNumber}`;

  return { id, kind, testNumber, title: label, totalQuestions, isMock, sections };
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
