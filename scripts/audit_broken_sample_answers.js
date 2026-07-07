// Read-only audit: find listening/summarize_spoken_text questions whose
// content.sample_answers array has the "leading stray punctuation" bug
// (fragments starting with "," or "." and/or a "SAMPLE ANSWER:- ....." prefix
// left over from a bad import-time split).
// Usage: node scripts/audit_broken_sample_answers.js
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.resolve(__dirname, "../.env.local");
const env = fs.readFileSync(envPath, "utf8");
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const supabaseServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(supabaseUrl, supabaseServiceKey);

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

  const broken = (data || []).filter((row) => isBroken(row.content?.sample_answers));
  console.log(`Scanned ${data.length} summarize_spoken_text questions, ${broken.length} broken.\n`);
  for (const row of broken) {
    console.log(`${row.id}  "${row.title}"`);
  }
})();
