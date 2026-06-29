import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/link-questions
 *
 * Body: { pairs: Array<{ legacyMongoId: string; questionId: string }> }
 *
 * Server-side bulk-update of the legacy_mongo_id column on questions.
 * Uses the service role key so RLS doesn't block us — this route is the
 * only place we trust arbitrary ID pairings. We do still validate inputs:
 *
 *   - legacyMongoId must look like a 24-hex string (the original format).
 *   - questionId must be a valid UUID.
 *   - Duplicates within a single batch are rejected (they usually mean a
 *     paste error — two different Mongo IDs pointing at the same question).
 *
 * The migration added a unique partial index on legacy_mongo_id, so we
 * also get DB-level protection against duplicate links.
 *
 * Returns: { linked: number, failed: Array<{ pair, reason }> }
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server misconfigured (missing Supabase env)" },
      { status: 500 }
    );
  }

  // The service role bypasses RLS so we don't need to be logged in as a
  // user. We do still gate on the request being authenticated to defend
  // against drive-by abuse — the page that calls this is also gated.
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

  let body: { pairs?: Array<{ legacyMongoId?: string; questionId?: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pairs = body.pairs ?? [];
  if (pairs.length === 0) {
    return NextResponse.json({ error: "No pairs provided" }, { status: 400 });
  }
  if (pairs.length > 5000) {
    return NextResponse.json(
      { error: "Too many pairs in one batch (max 5000)" },
      { status: 400 }
    );
  }

  const mongoRe = /^[a-f0-9]{24}$/i;
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const valid: Array<{ legacyMongoId: string; questionId: string }> = [];
  const failed: Array<{ pair: any; reason: string }> = [];
  const seenMongo = new Set<string>();
  const seenQuestion = new Set<string>();

  for (const raw of pairs) {
    const m = String(raw.legacyMongoId ?? "").trim().toLowerCase();
    const q = String(raw.questionId ?? "").trim();
    if (!mongoRe.test(m)) {
      failed.push({ pair: raw, reason: "legacyMongoId is not a 24-hex string" });
      continue;
    }
    if (!uuidRe.test(q)) {
      failed.push({ pair: raw, reason: "questionId is not a valid UUID" });
      continue;
    }
    if (seenMongo.has(m)) {
      failed.push({ pair: raw, reason: "duplicate legacyMongoId in batch" });
      continue;
    }
    if (seenQuestion.has(q)) {
      failed.push({ pair: raw, reason: "duplicate questionId in batch" });
      continue;
    }
    seenMongo.add(m);
    seenQuestion.add(q);
    valid.push({ legacyMongoId: m, questionId: q });
  }

  // Apply in chunks of 100 to keep request sizes sane.
  const CHUNK = 100;
  let linked = 0;
  const linkFailures: Array<{ pair: any; reason: string }> = [];

  for (let i = 0; i < valid.length; i += CHUNK) {
    const chunk = valid.slice(i, i + CHUNK);
    // The Supabase JS SDK doesn't have a great bulk-update-by-id API, so
    // we do one update per pair. 100 round-trips per batch is acceptable
    // for a one-time admin task and gives precise error reporting per pair.
    for (const p of chunk) {
      const { error } = await admin
        .from("questions")
        .update({ legacy_mongo_id: p.legacyMongoId })
        .eq("id", p.questionId);
      if (error) {
        linkFailures.push({ pair: p, reason: error.message });
      } else {
        linked += 1;
      }
    }
  }

  return NextResponse.json({
    linked,
    failed: [...failed, ...linkFailures],
  });
}
