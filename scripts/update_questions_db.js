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

const stopWords = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "of", "in", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "this", "that", "these", "those", "with", "from", "as", "about", "into", "through", "during", "after", "before"
]);

function cleanText(text) {
  if (!text) return "";
  if (Array.isArray(text)) text = text.join(" ");
  if (typeof text !== "string") text = String(text);
  return text
    .replace(/\[blank_\d+\]/g, "")
    .replace(/###/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateFriendlyTitle(text, taskType, index) {
  const cleaned = cleanText(text);
  if (!cleaned) {
    return `${taskType.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Practice #${index}`;
  }
  
  const words = cleaned.split(" ").filter(w => w.length > 0);
  
  let titleWords = [];
  let addedCount = 0;
  
  for (let i = 0; i < words.length && addedCount < 4; i++) {
    const wordLower = words[i].toLowerCase();
    
    if (addedCount === 0 && /^\d+$/.test(words[i]) && words.length > i + 1) {
      continue;
    }
    
    if (stopWords.has(wordLower) && addedCount === 0 && i < words.length - 1) {
      continue;
    }
    
    titleWords.push(words[i]);
    addedCount++;
  }
  
  if (titleWords.length === 0) {
    titleWords = words.slice(0, 3);
  }
  
  const capitalized = titleWords
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
    
  return capitalized;
}

function getQuestionText(q) {
  const content = q.content || {};
  let val = "";
  
  if (content.passage) val = content.passage;
  else if (content.passage_with_blanks) val = content.passage_with_blanks;
  else if (content.transcript) val = content.transcript;
  else if (content.audio_script) val = content.audio_script;
  else if (content.transcript_with_blanks) val = content.transcript_with_blanks;
  else if (content.correct_sentence) val = content.correct_sentence;
  else if (content.question_text) val = content.question_text;
  else if (content.question) val = content.question;
  else if (content.prompt) val = content.prompt;
  else if (content.scenario) val = content.scenario;
  else if (content.image_alt) val = content.image_alt;
  else if (content.paragraphs && Array.isArray(content.paragraphs)) {
    val = content.paragraphs.map(p => typeof p === 'object' && p !== null ? (p.text || '') : String(p)).join(" ");
  }
  
  if (typeof val !== "string") {
    val = String(val);
  }
  return val;
}

async function run() {
  console.log("Fetching questions from Supabase...");
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, module, task_type, title, content, difficulty")
    .eq("is_active", true);
    
  if (error) {
    console.error("Error fetching questions:", error);
    return;
  }
  
  console.log(`Fetched ${questions.length} questions. Preparing updates...`);
  
  // Group by category to sort & assign difficulties
  const grouped = {};
  questions.forEach((q) => {
    const key = `${q.module} / ${q.task_type}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  });
  
  const updates = [];
  
  Object.entries(grouped).forEach(([category, list]) => {
    // Sort by content length
    list.forEach(q => {
      q.textLength = getQuestionText(q).length;
    });
    list.sort((a, b) => a.textLength - b.textLength);
    
    const count = list.length;
    const easyLimit = Math.round(count * 0.3);
    const mediumLimit = Math.round(count * 0.7);
    
    list.forEach((q, idx) => {
      let difficulty = "medium";
      if (idx < easyLimit) difficulty = "easy";
      else if (idx >= mediumLimit) difficulty = "hard";
      
      const newTitleBase = generateFriendlyTitle(getQuestionText(q), q.task_type, idx + 1);
      const newTitle = `${newTitleBase} #${idx + 1}`;
      
      updates.push({
        id: q.id,
        title: newTitle,
        difficulty: difficulty
      });
    });
  });
  
  console.log(`Prepared ${updates.length} updates. Running DB updates in batches of 50...`);
  
  let successCount = 0;
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    const promises = batch.map(async (up) => {
      const { error: updateError } = await supabase
        .from("questions")
        .update({ title: up.title, difficulty: up.difficulty })
        .eq("id", up.id);
        
      if (updateError) {
        console.error(`Failed to update question ID ${up.id}:`, updateError.message);
      } else {
        successCount++;
      }
    });
    
    await Promise.all(promises);
    console.log(`Progress: ${successCount} / ${updates.length} updated successfully.`);
  }
  
  console.log("Database update process completed!");
}

run();
