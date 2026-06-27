// Validate: after transformQuestionContent, do the listening_mcq_multiple
// options carry letter prefixes? Do correct_answers map to letters?
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

function transformQuestionContent(question) {
  const t = question.task_type;
  const content = { ...question.content };
  const letters = ["A","B","C","D","E","F","G","H"];
  if (t === "listening_mcq_multiple") {
    const opts = Array.isArray(content.options) ? content.options : [];
    content.options = opts.map((opt, i) => `${letters[i]}. ${opt}`);
    content.correct_answers = (content.correct_answers || []).map((ans) => {
      if (/^[A-H]$/.test(String(ans).trim())) return ans;
      const idx = opts.findIndex((o) => String(o).trim() === String(ans).trim());
      return idx >= 0 ? letters[idx] : ans;
    });
  }
  if (t === "select_missing_word") {
    const opts = Array.isArray(content.options) ? content.options : [];
    content.options = opts.map((opt, i) => `${letters[i]}. ${opt}`);
    if (content.correct_answer) {
      const idx = opts.findIndex((o) => String(o).trim() === String(content.correct_answer).trim());
      content.correct_answers = [idx >= 0 ? letters[idx] : content.correct_answer];
    }
  }
  return content;
}

(async () => {
  for (const tt of ["listening_mcq_multiple", "select_missing_word"]) {
    const { data } = await sb.from("questions").select("content, task_type").eq("module","listening").eq("task_type", tt).limit(1).maybeSingle();
    const out = transformQuestionContent(data);
    console.log("\n===", tt, "===");
    console.log("options:", out.options);
    console.log("correct_answers:", out.correct_answers);
  }
})();