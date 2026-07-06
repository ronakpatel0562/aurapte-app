const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

const bucketKind = "mock_only";

(async () => {
  const { data, error } = await sb
    .from("questions")
    .select("content")
    .eq("task_type", "describe_image")
    .eq("pool", bucketKind);
  if (error) throw error;
  const bad = data.filter((r) => /\/(1[6-9]|[2-7][0-9])\.\w+$/.test(r.content.image_url));
  console.log("rows still pointing at broken 16-75 range:", bad.length);
  console.log("sample of 5 current urls:", data.slice(0, 5).map((r) => r.content.image_url));
})();
