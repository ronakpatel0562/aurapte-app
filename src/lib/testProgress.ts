/**
 * Aggregates raw `user_attempts` rows (one row per question) into per-test
 * progress. There is no dedicated "test session" table — a mock/practice
 * test's completion and score are derived by grouping its attempt rows by
 * `test_id`. Retakes insert new rows rather than updating old ones, so for
 * each question we keep only the most recent attempt before summing.
 */

export interface TestAttemptRow {
  test_id: string | null;
  question_id: string;
  score: number | null;
  max_score: number | null;
  attempted_at: string;
}

export interface TestProgress {
  testId: string;
  /** Distinct questions attempted for this test_id (deduped by question_id). */
  distinctQuestions: number;
  totalScore: number;
  totalMaxScore: number;
  /** Rounded 0-100 score across the deduped attempts. */
  scorePercent: number;
  lastAttemptedAt: string;
}

export function summarizeTestProgress(rows: TestAttemptRow[]): Map<string, TestProgress> {
  const latestByTestQuestion = new Map<string, Map<string, TestAttemptRow>>();

  for (const row of rows) {
    if (!row.test_id) continue;
    let byQuestion = latestByTestQuestion.get(row.test_id);
    if (!byQuestion) {
      byQuestion = new Map();
      latestByTestQuestion.set(row.test_id, byQuestion);
    }
    const existing = byQuestion.get(row.question_id);
    if (!existing || row.attempted_at > existing.attempted_at) {
      byQuestion.set(row.question_id, row);
    }
  }

  const result = new Map<string, TestProgress>();
  Array.from(latestByTestQuestion.entries()).forEach(([testId, byQuestion]) => {
    let totalScore = 0;
    let totalMaxScore = 0;
    let lastAttemptedAt = "";
    Array.from(byQuestion.values()).forEach((row) => {
      totalScore += row.score ?? 0;
      totalMaxScore += row.max_score ?? 0;
      if (row.attempted_at > lastAttemptedAt) lastAttemptedAt = row.attempted_at;
    });
    result.set(testId, {
      testId,
      distinctQuestions: byQuestion.size,
      totalScore,
      totalMaxScore,
      scorePercent: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0,
      lastAttemptedAt,
    });
  });
  return result;
}

export function isTestComplete(progress: TestProgress | undefined, totalQuestions: number): boolean {
  return !!progress && totalQuestions > 0 && progress.distinctQuestions >= totalQuestions;
}
