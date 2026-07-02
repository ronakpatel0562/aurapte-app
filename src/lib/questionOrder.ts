export interface OrderableQuestion {
  id: string;
  difficulty?: string | null;
}

/**
 * Interleaves questions round-robin by difficulty (easy, medium, hard, ...)
 * preserving each bucket's incoming relative order. Deterministic function of
 * input order (expects input pre-sorted by created_at ascending) — shared by
 * the question list (display order + sr no) and the question detail page
 * (prev/next navigation) so the two agree on what "next" means.
 */
export function interleaveByDifficulty<T extends OrderableQuestion>(
  questions: T[]
): T[] {
  const buckets: Record<string, T[]> = {};
  questions.forEach((q) => {
    const key = q.difficulty || "medium";
    (buckets[key] = buckets[key] || []).push(q);
  });
  const queues = ["easy", "medium", "hard"]
    .concat(Object.keys(buckets).filter((k) => !["easy", "medium", "hard"].includes(k)))
    .map((k) => buckets[k] || [])
    .filter((q) => q.length > 0);

  const mixed: T[] = [];
  let anyLeft = true;
  while (anyLeft) {
    anyLeft = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        mixed.push(next);
        anyLeft = true;
      }
    }
  }
  return mixed;
}
