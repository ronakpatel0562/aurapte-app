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

async function inspect() {
  for (const type of ["reading_mcq_single", "reorder_paragraphs", "reading_mcq_multiple"]) {
    const { data } = await supabase
      .from("questions")
      .select("title, content")
      .eq("task_type", type)
      .limit(1);
    console.log(`\n=== ${type} ===`);
    console.log(JSON.stringify(data?.[0], null, 2));
  }
}

inspect();
