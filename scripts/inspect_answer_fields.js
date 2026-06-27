// One-off inspection: how many writing rows have model_answer vs sample_answer?
// Usage: node scripts/inspect_answer_fields.js
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
    console.error(error.message);
    process.exit(1);
  }
  const stats = {};
  const missing = [];
  for (const r of data || []) {
    const tt = r.task_type;
    if (!stats[tt])
      stats[tt] = { total: 0, has_model: 0, has_sample: 0, both: 0, neither: 0 };
    stats[tt].total++;
    const c = r.content || {};
    const m = !!(c.model_answer && String(c.model_answer).trim());
    const s = !!(c.sample_answer && String(c.sample_answer).trim());
    if (m && s) stats[tt].both++;
    else if (m) stats[tt].has_model++;
    else if (s) stats[tt].has_sample++;
    else {
      stats[tt].neither++;
      missing.push({ id: r.id, task_type: tt, title: r.title });
    }
  }
  console.log("STATS:", JSON.stringify(stats, null, 2));
  console.log("\nMISSING ANSWERS (first 10):");
  for (const m of missing.slice(0, 10))
    console.log(`  [${m.task_type}] ${m.title}`);
})();