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

async function check() {
  const { data, error } = await supabase
    .from("questions")
    .select("id, title, content, is_active")
    .eq("task_type", "rw_fill_in_the_blanks");
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  let validCount = 0;
  let invalidCount = 0;
  data.forEach((q) => {
    const content = q.content || {};
    const hasOptions = content.blank_options && content.blank_options.length > 0;
    const hasAnswers = content.correct_answers && content.correct_answers.length > 0;
    const hasPassage = !!content.passage_with_blanks;
    
    if (hasOptions && hasAnswers && hasPassage) {
      validCount++;
    } else {
      invalidCount++;
      console.log(`Invalid question: ${q.title} (ID: ${q.id})`);
    }
  });
  
  console.log(`Total rw_fill_in_the_blanks: ${data.length}`);
  console.log(`Valid: ${validCount}`);
  console.log(`Invalid: ${invalidCount}`);
}

check();
