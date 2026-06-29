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
    .select("id, title, content")
    .eq("task_type", "select_missing_word")
    .limit(5);
    
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  
  console.log("SELECT MISSING WORD CONTENT:");
  data.forEach((r, i) => {
    console.log(`--- Row ${i + 1}: ${r.title} ---`);
    console.log(JSON.stringify(r.content, null, 2));
  });
})();
