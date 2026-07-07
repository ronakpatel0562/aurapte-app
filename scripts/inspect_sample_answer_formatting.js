// Read-only: dump the raw content JSON for questions matching a title,
// to inspect how "SAMPLE ANSWER" text is stored/formatted.
// Usage: node scripts/inspect_sample_answer_formatting.js "New Employees Orientation"
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

const term = process.argv[2] || "New Employees Orientation";

(async () => {
  const { data, error } = await sb
    .from("questions")
    .select("id, title, module, task_type, content")
    .ilike("title", `%${term}%`);
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  for (const row of data || []) {
    console.log(`\n=== [${row.module}/${row.task_type}] ${row.title} (${row.id}) ===`);
    console.log(JSON.stringify(row.content, null, 2));
  }
})();
