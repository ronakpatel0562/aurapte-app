// One-off migration: copy content.sample_answer -> content.model_answer for
// every writing question where the canonical field is missing. After this
// runs once, the app can rely on `model_answer` being the single source of
// truth. Safe to re-run (idempotent — skips rows that already have a
// non-empty `model_answer`).
//
// Usage: node scripts/migrate_sample_answer_to_model_answer.js
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.resolve(__dirname, "../.env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim().replace(/['"]/g, "");
  if (keyMatch) supabaseServiceKey = keyMatch[1].trim().replace(/['"]/g, "");
}
const sb = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  const { data, error } = await sb
    .from("questions")
    .select("id, title, task_type, content")
    .eq("module", "writing");
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  let migrated = 0;
  let skipped = 0;
  for (const row of data || []) {
    const c = row.content || {};
    const hasModel =
      typeof c.model_answer === "string" && c.model_answer.trim().length > 0;
    const sample =
      typeof c.sample_answer === "string" ? c.sample_answer.trim() : "";
    if (hasModel || !sample) {
      skipped++;
      continue;
    }
    const next = { ...c, model_answer: sample };
    const { error: updErr } = await sb
      .from("questions")
      .update({ content: next })
      .eq("id", row.id);
    if (updErr) {
      console.error(`Failed to update "${row.title}":`, updErr.message);
      continue;
    }
    console.log(`Migrated [${row.task_type}] "${row.title}"`);
    migrated++;
  }

  console.log(`\nDone. ${migrated} migrated, ${skipped} skipped.`);
})();