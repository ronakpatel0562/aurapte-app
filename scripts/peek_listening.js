// One-shot inspect: peek at a real listening_mcq_multiple row's options shape.
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.resolve(__dirname, "../.env.local");
const env = fs.readFileSync(envPath, "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

(async () => {
  for (const tt of [
    "listening_mcq_multiple",
    "select_missing_word",
    "highlight_incorrect_words",
    "summarize_spoken_text",
    "listening_fill_in_the_blanks",
  ]) {
    const { data } = await sb
      .from("questions")
      .select("content")
      .eq("module", "listening")
      .eq("task_type", tt)
      .limit(1)
      .maybeSingle();
    console.log("\n===", tt, "===");
    console.log(JSON.stringify(data?.content, null, 2).slice(0, 1500));
  }
})();