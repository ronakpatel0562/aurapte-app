const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envLocalPath = path.resolve(__dirname, "../.env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/);
  if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim().replace(/['"]/g, "");
  if (keyMatch && keyMatch[1]) supabaseServiceKey = keyMatch[1].trim().replace(/['"]/g, "");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function audit() {
  const { data } = await supabase
    .from("questions")
    .select("content")
    .eq("task_type", "reading_mcq_single")
    .limit(100);
  const plural = data.filter((q) => Array.isArray(q.content.correct_answers));
  const singular = data.filter(
    (q) => typeof q.content.correct_answer === "string"
  );
  console.log("Total checked:", data.length);
  console.log("Has correct_answers (plural array):", plural.length);
  console.log("Has correct_answer (singular string):", singular.length);
}

audit();
