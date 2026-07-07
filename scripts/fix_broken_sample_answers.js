// Fix listening/summarize_spoken_text questions whose content.sample_answers
// array has leading stray punctuation (a "," or "." at the very start of a
// fragment) and/or a "SAMPLE ANSWER:- ............." prefix left over from a
// bad import-time split (see scripts/verify_summarize_split.js). This is why
// the sample-answer card renders with a stray comma/period stuck at the start
// of the 2nd/3rd paragraph.
//
// Cleanup per fragment:
//   1. Strip a leading "SAMPLE ANSWER(S):-" marker and any run of dots/spaces.
//   2. Strip a leading stray "," or "." (with following whitespace).
//   3. Trim, then capitalize the first letter.
//   4. Add a trailing "." if the fragment doesn't already end in . ! or ?
//
// content.model_answer is also refreshed to the first cleaned fragment when
// it currently matches the old (unclean) first fragment or is empty.
//
// Usage:
//   node scripts/fix_broken_sample_answers.js            # dry run, prints diffs
//   node scripts/fix_broken_sample_answers.js --apply    # writes changes
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.resolve(__dirname, "../.env.local");
const env = fs.readFileSync(envPath, "utf8");
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const supabaseServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(supabaseUrl, supabaseServiceKey);

const APPLY = process.argv.includes("--apply");

function cleanFragment(raw) {
  let s = raw;
  // Drop everything up to and including the last "SAMPLE ANSWER(S)[:-]" marker.
  // Some rows accidentally duplicated the full audio transcript before the
  // marker (see Phone Interview #42/#46) - only the text after it is the
  // actual answer. The UI already renders its own "Sample Correct Answer(s)"
  // heading, so the label itself is redundant and dropped entirely.
  const markerRe = /SAMPLE\s+ANSWERS?\s*:?\s*-?/gi;
  let lastEnd = -1;
  let m;
  while ((m = markerRe.exec(s)) !== null) {
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd >= 0) s = s.slice(lastEnd);
  s = s.replace(/^[.\s]*\.{3,}[.\s\d]*/, ""); // leading dot-leader run (with optional trailing digit artifact)
  s = s.trim();
  s = s.replace(/^[.,]\s*/, ""); // single stray leading , or .
  s = s.trim();
  if (s.length > 0) {
    s = s[0].toUpperCase() + s.slice(1);
    if (!/[.!?]$/.test(s)) s += ".";
  }
  return s;
}

function isBroken(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.some(
    (s) =>
      typeof s === "string" &&
      (/^[.,]\s*\S/.test(s.trim()) || /SAMPLE\s+ANSWERS?\b/i.test(s) || /\.{4,}/.test(s))
  );
}

(async () => {
  const { data, error } = await sb
    .from("questions")
    .select("id, title, task_type, content")
    .eq("module", "listening")
    .eq("task_type", "summarize_spoken_text");
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  const targets = (data || []).filter((row) => isBroken(row.content?.sample_answers));
  console.log(`${targets.length} question(s) need cleanup. Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  let updated = 0;
  for (const row of targets) {
    const oldAnswers = row.content.sample_answers;
    const newAnswers = oldAnswers.map(cleanFragment).filter(Boolean);

    const nextContent = { ...row.content, sample_answers: newAnswers };
    const oldModel = typeof row.content.model_answer === "string" ? row.content.model_answer.trim() : "";
    if (!oldModel || oldModel === (oldAnswers[0] || "").trim()) {
      nextContent.model_answer = newAnswers[0] || "";
    }

    console.log(`=== ${row.title} (${row.id}) ===`);
    oldAnswers.forEach((s, i) => console.log(`  [old ${i}] ${s}`));
    newAnswers.forEach((s, i) => console.log(`  [new ${i}] ${s}`));
    console.log("");

    if (APPLY) {
      const { error: updErr } = await sb
        .from("questions")
        .update({ content: nextContent })
        .eq("id", row.id);
      if (updErr) {
        console.error(`  Failed to update: ${updErr.message}`);
        continue;
      }
      updated++;
    }
  }

  console.log(APPLY ? `Done. ${updated} question(s) updated.` : "Dry run complete. Re-run with --apply to write changes.");
})();
