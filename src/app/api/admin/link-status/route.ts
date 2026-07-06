import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  allPracticeTests,
  allMockTests,
} from "@/lib/testDefinitions";
import { isAdminEmail } from "@/lib/admin";

/**
 * GET /api/admin/link-status
 *
 * Returns coverage stats for the legacy_mongo_id linking task:
 *   - How many of the 1,532 Mongo IDs in PracticeTest.txt + MockTest.txt
 *     are already linked to a Supabase question.
 *   - Per-test breakdown: for each of the 12 practice + 15 mock tests,
 *     how many of its section questions are linked.
 *
 * Read-only (no PII) but still restricted to ADMIN_EMAILS — it exposes
 * internal question-bank structure and this tool shouldn't be discoverable
 * by regular accounts at all.
 */
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!bearer) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: authErr,
  } = await admin.auth.getUser(bearer);
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Collect every distinct Mongo ID across all tests.
  const allIds = new Set<string>();
  const testsWithSections: Array<{ id: string; kind: "practice" | "mock"; sections: { module: string; legacyIds: string[] }[] }> = [];

  for (const t of [...allPracticeTests(), ...allMockTests()]) {
    testsWithSections.push({
      id: t.id,
      kind: t.kind,
      sections: t.sections.map((s) => ({ module: s.module, legacyIds: s.legacyIds })),
    });
    for (const s of t.sections) for (const id of s.legacyIds) allIds.add(id);
  }

  const allIdsArr = Array.from(allIds);

  // Look up which Mongo IDs are already linked. Pull only the rows we need.
  const linkedSet = new Set<string>();
  // Chunk because Supabase has URL length limits with large IN clauses.
  const CHUNK = 200;
  for (let i = 0; i < allIdsArr.length; i += CHUNK) {
    const { data } = await admin
      .from("questions")
      .select("legacy_mongo_id")
      .in("legacy_mongo_id", allIdsArr.slice(i, i + CHUNK))
      .not("legacy_mongo_id", "is", null);
    for (const row of data ?? []) {
      if (row.legacy_mongo_id) linkedSet.add(row.legacy_mongo_id);
    }
  }

  const totalIds = allIdsArr.length;
  const linkedCount = linkedSet.size;
  const missingCount = totalIds - linkedCount;

  // Per-test breakdown.
  const perTest = testsWithSections.map((t) => {
    const sections = t.sections.map((s) => {
      const linked = s.legacyIds.filter((id) => linkedSet.has(id)).length;
      return {
        module: s.module,
        expected: s.legacyIds.length,
        linked,
      };
    });
    const expected = sections.reduce((sum, s) => sum + s.expected, 0);
    const linkedTotal = sections.reduce((sum, s) => sum + s.linked, 0);
    return {
      id: t.id,
      kind: t.kind,
      expected,
      linked: linkedTotal,
      ready: linkedTotal === expected && expected > 0,
      sections,
    };
  });

  return NextResponse.json({
    totalIds,
    linked: linkedCount,
    missing: missingCount,
    coveragePct: totalIds > 0 ? Math.round((linkedCount / totalIds) * 100) : 0,
    perTest,
  });
}
