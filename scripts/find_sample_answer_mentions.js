// Read-only scan: find questions whose `content` column contains a
// "sample answer"-like phrase anywhere in it (any field, case-insensitive).
// Usage: node scripts/find_sample_answer_mentions.js
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

// Add/remove phrases here as needed.
const PATTERNS = [/sample\s*answer/i, /model\s*answer/i, /sample\s*response/i];

(async () => {
  const { data, error } = await sb
    .from("questions")
    .select("id, title, module, task_type, content");
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  const hits = [];
  for (const row of data || []) {
    const text = JSON.stringify(row.content || {});
    const matched = PATTERNS.filter((re) => re.test(text)).map(
      (re) => re.source
    );
    if (matched.length) {
      hits.push({ ...row, matched });
    }
  }

  console.log(`Scanned ${data.length} questions, ${hits.length} matched.\n`);
  for (const h of hits) {
    console.log(
      `[${h.module}/${h.task_type}] id=${h.id} "${h.title}" — matched: ${h.matched.join(", ")}`
    );
  }
})();
