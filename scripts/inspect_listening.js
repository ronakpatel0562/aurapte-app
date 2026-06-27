// One-off inspection: how many listening rows exist per task_type,
// and what fields are populated?
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
    .eq("module", "listening");
  if (error) { console.error(error.message); process.exit(1); }
  const by = {};
  for (const r of data || []) {
    const tt = r.task_type;
    if (!by[tt]) by[tt] = [];
    by[tt].push({
      id: r.id,
      title: r.title,
      fields: Object.keys(r.content || {}),
    });
  }
  console.log("LISTENING ROW COUNTS BY TASK TYPE:");
  for (const [tt, rows] of Object.entries(by)) {
    console.log(`\n  ${tt}: ${rows.length}`);
    console.log(`    sample fields: ${JSON.stringify(rows[0]?.fields)}`);
    console.log(`    sample title:  ${rows[0]?.title}`);
  }
  console.log("\nGRAND TOTAL:", data?.length || 0);
})();