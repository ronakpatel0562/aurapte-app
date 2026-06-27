// Backfill `model_answer` for writing questions that are missing it.
// Run: node scripts/backfill_writing_model_answers.js
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hand-curated model summaries keyed by a stable substring match against the
// question's `title` column. Using a substring match avoids breaking when the
// DB stores a slightly different prefix or trailing index (e.g. "#1").
const MODEL_ANSWERS = [
  {
    match: "Climate Change Represents One",
    task_type: "summarize_written_text",
    answer:
      "Climate change, driven largely by greenhouse gas emissions, is intensifying extreme weather and threatening food, water, and health security, demanding urgent international cooperation, renewable energy adoption, and sustainable practices across all sectors.",
  },
  {
    match: "Requesting Extension",
    task_type: "write_an_email",
    answer:
      "Subject: Request for Assignment Extension - [Your Name]\n\nDear Dr. Jenkins,\n\nI hope this email finds you well. I am writing to request a short extension of three days on the upcoming research assignment, originally due this Friday. Unfortunately, I have contracted a severe illness and have been advised by my doctor to rest.\n\nI am confident that a three-day extension until next Monday will allow me to complete the work to a high standard. I have attached my medical certificate for your reference.\n\nThank you for your time and understanding.\n\nSincerely,\n[Your Name]\nStudent ID: 12345",
  },
  {
    match: "IT Support ticket",
    task_type: "write_an_email",
    answer:
      "Subject: Database Crash - Urgent IT Support Request\n\nDear IT Support Team,\n\nI am writing to report a recurring issue with my company laptop. Every time I attempt to launch the database software, the entire system crashes and displays a blue screen error.\n\nThis is severely impacting my ability to perform my daily reports. I would appreciate it if we could schedule a troubleshooting session as soon as possible to resolve this.\n\nBest regards,\n[Your Name]",
  },
];

async function backfill(taskType) {
  const { data: rows, error } = await supabase
    .from("questions")
    .select("id, title, content")
    .eq("module", "writing")
    .eq("task_type", taskType);

  if (error) {
    console.error(`Failed to fetch ${taskType} questions:`, error.message);
    return 0;
  }

  let updated = 0;
  for (const row of rows || []) {
    const current = row.content?.model_answer;
    if (current && typeof current === "string" && current.trim().length > 0) {
      continue;
    }
    const match = MODEL_ANSWERS.find(
      (m) => m.task_type === taskType && row.title.includes(m.match),
    );
    if (!match) {
      console.warn(
        `No hand-curated answer for "${row.title}" (id=${row.id}) — skipping.`,
      );
      continue;
    }
    const nextContent = { ...(row.content || {}), model_answer: match.answer };
    const { error: updErr } = await supabase
      .from("questions")
      .update({ content: nextContent })
      .eq("id", row.id);
    if (updErr) {
      console.error(`Failed to update "${row.title}":`, updErr.message);
      continue;
    }
    console.log(`Updated "${row.title}" with a model answer.`);
    updated++;
  }
  return updated;
}

async function main() {
  const summaryUpdated = await backfill("summarize_written_text");
  const emailUpdated = await backfill("write_an_email");
  console.log(
    `\nDone. ${summaryUpdated} summarize + ${emailUpdated} email question(s) updated.`,
  );
}

main();
