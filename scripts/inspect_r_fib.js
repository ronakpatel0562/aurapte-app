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
  const { data: list1, error: err1 } = await supabase
    .from("questions")
    .select("id, title, content")
    .eq("task_type", "reading_fill_in_the_blanks")
    .limit(3);
    
  console.log("--- reading_fill_in_the_blanks samples ---");
  console.log(JSON.stringify(list1, null, 2));

  const { data: list2, error: err2 } = await supabase
    .from("questions")
    .select("id, title, content")
    .eq("task_type", "rw_fill_in_the_blanks")
    .limit(3);
    
  console.log("--- rw_fill_in_the_blanks samples ---");
  console.log(JSON.stringify(list2, null, 2));
}

inspect();
