// Validate: after transformQuestionContent, does summarize_spoken_text have
// a clean audio_transcript (no "SAMPLE ANSWER:-" tail) and a real model_answer?
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

function transformQuestionContent(question) {
  const content = { ...question.content };
  if (question.task_type === "summarize_spoken_text") {
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
  return content;
}

(async () => {
  const { data } = await sb
    .from("questions")
    .select("content, task_type, title")
    .eq("module", "listening")
    .eq("task_type", "summarize_spoken_text")
    .limit(3);
  for (const row of data || []) {
    const out = transformQuestionContent(row);
    console.log("\n=== " + row.title + " ===");
    console.log("audio_transcript (first 220 chars):");
    console.log("  " + (out.audio_transcript || "").slice(0, 220));
    console.log("contains SAMPLE ANSWER marker?", /SAMPLE\s+ANSWERS?/i.test(out.audio_transcript));
    console.log("model_answer:");
    console.log("  " + (out.model_answer || "(empty)").slice(0, 220));
    console.log("sample_answers count:", (out.sample_answers || []).length);
  }
})();