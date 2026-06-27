// Quick peek at the audio URL pattern stored in the DB so we can map
// it to an R2 URL scheme.
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1].trim();
const sb = createClient(url, key);

(async () => {
  const { data, error } = await sb
    .from("questions")
    .select("task_type, content")
    .eq("module", "listening")
    .not("content->audio_url", "is", null)
    .limit(3);
  if (error) {
    console.error(error);
    return;
  }
  data.forEach((row, i) => {
    console.log(`#${i + 1}`, row.task_type);
    console.log("   url:", row.content?.audio_url);
  });

  // Group by URL pattern to count
  const { data: all } = await sb
    .from("questions")
    .select("task_type, content")
    .eq("module", "listening")
    .not("content->audio_url", "is", null);
  const patterns = {};
  all.forEach((row) => {
    const u = row.content?.audio_url || "";
    const match = u.match(/audio\/([a-z_-]+)\//);
    const t = match ? match[1] : "OTHER";
    patterns[t] = (patterns[t] || 0) + 1;
  });
  console.log("\nGrouped by URL pattern:");
  Object.entries(patterns).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
})();