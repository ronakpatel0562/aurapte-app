// Verify transformQuestionContent produces the shape each listening
// component expects. Reads one row per task type, runs it through the
// real transformer (compiled via ts-node-shim), and prints the resulting
// field names so we can spot mismatches before pushing.
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

// Inline copy of stripHtml + the new normalisation rules. Keeping this in
// sync with src/lib/taskTypeMapper.ts is what `npm run lint` catches.
function stripHtml(input) {
  return input
    .replace(/<\s*\/?\s*(p|br|div|li|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&rsquo;/gi, "\u2019")
    .replace(/&lsquo;/gi, "\u2018")
    .replace(/&ldquo;/gi, "\u201C")
    .replace(/&rdquo;/gi, "\u201D")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function transformQuestionContent(question) {
  if (!question || !question.content) return question;
  const type = question.task_type;
  const content = { ...question.content };
  const rawAnswer =
    (typeof content.model_answer === "string" && content.model_answer.trim()) ||
    (typeof content.sample_answer === "string" && content.sample_answer.trim()) ||
    "";
  if (rawAnswer) content.model_answer = stripHtml(rawAnswer);

  if (type === "listening_fill_in_the_blanks") {
    if (Array.isArray(content.correct_answers)) {
      const answers = {};
      content.correct_answers.forEach((ans, i) => (answers[`blank_${i}`] = ans));
      let passage = content.transcript_with_blanks || "";
      let blankIndex = 0;
      while (passage.includes("###")) {
        passage = passage.replace("###", `[blank_${blankIndex}]`);
        blankIndex++;
      }
      let cleanTranscript = content.transcript_with_blanks || "";
      content.correct_answers.forEach((ans) => (cleanTranscript = cleanTranscript.replace("###", ans)));
      content.answers = answers;
      content.audio_transcript_with_blanks = passage;
      content.audio_transcript = cleanTranscript;
    }
  }
  if (type === "listening_mcq_multiple") {
    const opts = Array.isArray(content.options) ? content.options : [];
    const letters = ["A","B","C","D","E","F","G","H"];
    content.options = opts.map((opt, i) => `${letters[i] || String.fromCharCode(65+i)}. ${opt}`);
    if (Array.isArray(content.correct_answers)) {
      content.correct_answers = content.correct_answers.map((ans) => {
        if (typeof ans !== "string") return ans;
        if (/^[A-H]$/.test(ans.trim())) return ans.trim();
        const idx = opts.findIndex((o) => typeof o === "string" && o.trim() === ans.trim());
        return idx >= 0 ? letters[idx] : ans;
      });
    } else {
      content.correct_answers = [];
    }
    if (!content.audio_transcript) content.audio_transcript = "";
  }
  if (type === "listening_mcq_single") {
    const opts = Array.isArray(content.options) ? content.options : [];
    const letters = ["A","B","C","D","E","F","G","H"];
    content.options = opts.map((opt, i) => `${letters[i] || String.fromCharCode(65+i)}. ${opt}`);
    if (!content.audio_transcript) content.audio_transcript = "";
    if (content.correct_answer && !content.correct_answers) {
      const idx = opts.findIndex((o) => typeof o === "string" && o.trim() === String(content.correct_answer).trim());
      content.correct_answers = [idx >= 0 ? letters[idx] : String(content.correct_answer)];
    } else if (!content.correct_answers) {
      content.correct_answers = [];
    }
  }
  if (type === "select_missing_word") {
    const opts = Array.isArray(content.options) ? content.options : [];
    const letters = ["A","B","C","D","E","F","G","H"];
    content.options = opts.map((opt, i) => `${letters[i] || String.fromCharCode(65+i)}. ${opt}`);
    if (!content.audio_transcript) content.audio_transcript = "";
    if (content.correct_answer && !content.correct_answers) {
      const idx = opts.findIndex((o) => typeof o === "string" && o.trim() === String(content.correct_answer).trim());
      content.correct_answers = [idx >= 0 ? letters[idx] : String(content.correct_answer)];
    } else if (!content.correct_answers) {
      content.correct_answers = [];
    }
  }
  if (type === "highlight_incorrect_words") {
    const clean = (w) =>
      String(w).toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    if (typeof content.transcript === "string" && Array.isArray(content.incorrect_words)) {
      const incorrectSet = new Set(content.incorrect_words.map(clean));
      const altered = content.transcript
        .split(/\s+/)
        .map((word) => (incorrectSet.has(clean(word)) ? word : word))
        .join(" ");
      content.correct_transcript = content.transcript;
      content.passage_with_incorrect_words = altered;
      content.incorrect_words = content.incorrect_words.map(String);
    } else {
      content.correct_transcript = content.transcript || "";
      content.passage_with_incorrect_words = content.transcript || "";
      content.incorrect_words = Array.isArray(content.incorrect_words) ? content.incorrect_words : [];
    }
  }
  if (type === "summarize_spoken_text") {
    if (typeof content.audio_script === "string") {
      const marker = /SAMPLE\s+ANSWERS?\s*:\s*-?/i;
      const split = content.audio_script.split(marker);
      const scriptOnly = (split[0] || "").trim();
      const candidatesRaw = split.slice(1).join(" ");
      const candidates = candidatesRaw.split(/(?:\.{6,}|\r?\n)/g).map((s) => s.trim()).filter(Boolean);
      content.audio_transcript = scriptOnly || content.audio_script.trim();
      if (candidates.length > 0 && !Array.isArray(content.sample_answers)) {
        content.sample_answers = candidates;
      }
    }
    if (!content.audio_transcript) content.audio_transcript = "";
    if (!content.model_answer) {
      const samples = Array.isArray(content.sample_answers) ? content.sample_answers : [];
      content.model_answer = samples.find((s) => typeof s === "string" && s.trim()) || "";
    }
  }

  return { ...question, content };
}

(async () => {
  const wanted = [
    "listening_fill_in_the_blanks",
    "highlight_incorrect_words",
    "listening_mcq_multiple",
    "select_missing_word",
    "summarize_spoken_text",
  ];
  for (const tt of wanted) {
    const { data, error } = await sb
      .from("questions")
      .select("id, title, task_type, content")
      .eq("module", "listening")
      .eq("task_type", tt)
      .limit(1)
      .maybeSingle();
    if (error) { console.error(tt, error.message); continue; }
    if (!data) { console.log(`\n=== ${tt} ===\n  (no rows)`); continue; }
    const out = transformQuestionContent(data);
    console.log(`\n=== ${tt} ===`);
    console.log(`title: ${data.title}`);
    console.log(`raw content fields: ${Object.keys(data.content).join(", ")}`);
    console.log(`normalised fields:  ${Object.keys(out.content).join(", ")}`);
  }
})();