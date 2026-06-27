// Verify which audio files exist for each task type and which question rows
// actually have working URLs. This catches cases where the DB has audio_url
// pointing at a file that doesn't exist on storage.
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

(async () => {
  const { data, error } = await sb
    .from("questions")
    .select("id, title, task_type, content")
    .eq("module", "listening");
  if (error) { console.error(error.message); process.exit(1); }

  // Probe the first 3 audio_urls per task type with HEAD. Bounded so we don't
  // hammer Supabase Storage while we're trying to figure out the data shape.
  const byType = {};
  for (const r of data || []) {
    if (!byType[r.task_type]) byType[r.task_type] = [];
    if (byType[r.task_type].length < 3) byType[r.task_type].push(r);
  }

  for (const [tt, rows] of Object.entries(byType)) {
    console.log(`\n=== ${tt} (${rows.length} sampled) ===`);
    for (const r of rows) {
      const audioUrl = r.content?.audio_url;
      console.log(`  ${r.title}`);
      console.log(`    audio_url: ${audioUrl || "(none)"}`);
    }
  }
})();