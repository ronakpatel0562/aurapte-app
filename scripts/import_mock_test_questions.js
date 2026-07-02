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
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (checked env and .env.local).");
  process.exit(1);
}
const sb = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_BUCKET = "pte-media";

// Mirror everything to a file too — this environment's background-shell
// stdout capture has proven unreliable for long-running scripts, so a
// self-written log is the only trustworthy record of progress/completion.
const LOG_FILE = "C:\\Users\\ronak\\AppData\\Local\\Temp\\claude\\F--Learning-Projects-Micro-AuraPTE-com\\455aec6c-0972-44eb-a46c-39ff31e2503c\\scratchpad\\import_progress.log";
fs.writeFileSync(LOG_FILE, `[start] ${new Date().toISOString()}\n`);
const origLog = console.log.bind(console);
console.log = (...a) => {
  origLog(...a);
  fs.appendFileSync(LOG_FILE, a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ") + "\n");
};

const args = process.argv.slice(2);
const jsonPath = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const poolArg = args.includes("--tier") ? args[args.indexOf("--tier") + 1] : "mock_only";
const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1], 10) : null;
if (!jsonPath) {
  console.error("Usage: node scripts/import_mock_test_questions.js <path-to-json> [--tier shared|mock_only] [--dry-run]");
  process.exit(1);
}

const CATEGORY_TO_TASK_TYPE = {
  "Speaking/Read Aloud": "read_aloud",
  "Speaking/Repeat Sentence": "repeat_sentence",
  "Speaking/Describe Image": "describe_image",
  "Speaking/Responding To Situation": "responding_to_situation",
  "Speaking/Answer Short Question": "answer_short_question",
  "Writing/Summarize Written Text": "summarize_written_text",
  "Writing/Write An Email": "write_an_email",
  "Reading/Reading & Writing: Fill In The Blanks": "rw_fill_in_the_blanks",
  "Reading/Multiple Choice-Choose Multiple Answer": "reading_mcq_multiple",
  "Reading/Re-order Paragraphs": "reorder_paragraphs",
  "Reading/Reading: Fill In The Blanks": "reading_fill_in_the_blanks",
  "Reading/Multiple Choice-Choose Single Answer": "reading_mcq_single",
  "Listening/Summarize Spoken Item": "summarize_spoken_text",
  "Listening/Multiple Choice-Choose Multiple Answer": "listening_mcq_multiple",
  "Listening/Fill In The Blanks": "listening_fill_in_the_blanks",
  "Listening/Multiple Choice-Choose Single Answer": "listening_mcq_single",
  "Listening/Select Missing Word Item": "select_missing_word",
  "Listening/Highlight Incorrect Words": "highlight_incorrect_words",
  "Listening/Write From Dictation": "write_from_dictation",
};

const AUDIO_TASK_TYPES = new Set([
  "repeat_sentence", "responding_to_situation", "answer_short_question",
  "summarize_spoken_text", "listening_mcq_multiple", "listening_fill_in_the_blanks",
  "listening_mcq_single", "select_missing_word", "highlight_incorrect_words",
  "write_from_dictation",
]);
const IMAGE_TASK_TYPES = new Set(["describe_image"]);

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, "").trim();
}

function parseBlankOptions(options) {
  return (options || []).map((opt) => opt.split("*").map((c) => c.trim()).filter(Boolean));
}

function parseOrderString(orderStr) {
  if (!orderStr) return [];
  return orderStr.split("*").map((s) => s.trim()).filter(Boolean);
}

function parseSampleAnswers(raw) {
  const clean = stripHtml(raw);
  const parts = clean.split(/\.{3,}\s*\d+\s*/);
  const answers = parts.map((p) => p.trim()).filter((p) => p.length > 20);
  return answers.length > 0 ? answers : [clean.trim()];
}

function parseAsqSampleAnswer(raw) {
  const clean = stripHtml(raw).trim();
  const parts = clean.split(/\s{2,}|\n/);
  if (parts.length >= 2) {
    const q = parts[0].trim();
    const a = parts.slice(1).join(" ").trim();
    const alts = a.split(/[,/]/).map((x) => x.trim().toLowerCase());
    return { questionText: q, correctAnswer: a, alternateAnswers: alts };
  }
  return { questionText: clean, correctAnswer: "", alternateAnswers: [] };
}

function extractEmailBullets(paragraph) {
  const lines = (paragraph || "").replace(/\r\n/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = [];
  const promptLines = [];
  let inBullets = false;
  for (const line of lines) {
    if (/^[-•*]/.test(line) || (inBullets && line)) {
      inBullets = true;
      bullets.push(line.replace(/^[-•*]\s*/, ""));
    } else {
      promptLines.push(line);
    }
  }
  return { prompt: promptLines.join(" ").trim(), bullets };
}

// ─── Content builders (ported 1:1 from Script/import_questions.py) ─────────
const CONTENT_BUILDERS = {
  read_aloud: (q) => ({ passage: (q.questionParagraph || "").trim() }),

  repeat_sentence: (q, mediaUrl) => ({
    audio_url: mediaUrl || "",
    transcript: stripHtml(q.sampleAnswer || ""),
  }),

  describe_image: (q, mediaUrl) => ({
    image_url: mediaUrl || "",
    image_type: "other",
    image_alt: q.tag || "",
  }),

  responding_to_situation: (q, mediaUrl) => ({
    audio_url: mediaUrl || "",
    scenario: (q.questionParagraph || "").trim(),
    sample_answer: q.sampleAnswer || "",
  }),

  answer_short_question: (q, mediaUrl) => {
    const raw = stripHtml(q.sampleAnswer || "");
    const { questionText, correctAnswer, alternateAnswers } = parseAsqSampleAnswer(raw);
    return {
      audio_url: mediaUrl || "",
      question_text: questionText,
      correct_answer: correctAnswer,
      alternate_answers: alternateAnswers,
    };
  },

  summarize_written_text: (q) => ({
    passage: (q.questionParagraph || "").trim(),
    sample_answer: q.sampleAnswer || "",
    word_limit_min: 5,
    word_limit_max: 75,
    time_limit_seconds: 600,
  }),

  write_an_email: (q) => {
    const { prompt, bullets } = extractEmailBullets(q.questionParagraph || "");
    return {
      prompt,
      bullet_points: bullets,
      sample_answer: q.sampleAnswer || "",
      word_limit_min: 80,
      word_limit_max: 120,
      time_limit_seconds: 540,
    };
  },

  rw_fill_in_the_blanks: (q) => {
    const passage = (q.questionParagraph || "").trim();
    return {
      passage_with_blanks: passage,
      blank_options: parseBlankOptions(q.options || []),
      correct_answers: q.correctAnswer || [],
      blank_count: (passage.match(/###/g) || []).length,
    };
  },

  reading_mcq_multiple: (q) => ({
    passage: (q.questionParagraph || "").trim(),
    question: q.questionTitle || q.question || "",
    options: q.options || [],
    correct_answers: q.correctAnswer || [],
    negative_marking: true,
  }),

  reorder_paragraphs: (q) => {
    const shuffledTexts = parseOrderString(q.questionOrder || "");
    const correctTexts = parseOrderString(q.correctOrder || "");
    const paragraphs = shuffledTexts.map((text, i) => ({ id: String.fromCharCode(65 + i), text }));
    const textToId = new Map(paragraphs.map((p) => [p.text, p.id]));
    const correctOrderIds = [];
    for (const text of correctTexts) {
      let matchedId = textToId.get(text);
      if (!matchedId) {
        for (const [storedText, pid] of textToId) {
          if (text.slice(0, 30) === storedText.slice(0, 30)) {
            matchedId = pid;
            break;
          }
        }
      }
      if (matchedId) correctOrderIds.push(matchedId);
    }
    const shuffledOrderIds = paragraphs.map((p) => p.id);
    return {
      paragraphs,
      shuffled_order: shuffledOrderIds,
      correct_order: correctOrderIds.length ? correctOrderIds : shuffledOrderIds,
    };
  },

  reading_fill_in_the_blanks: (q) => {
    const passage = (q.questionParagraph || "").trim();
    return {
      passage_with_blanks: passage,
      word_bank: q.options || [],
      correct_answers: q.correctAnswer || [],
      blank_count: (passage.match(/###/g) || []).length,
    };
  },

  reading_mcq_single: (q) => {
    const correct = q.correctAnswer || [];
    return {
      passage: (q.questionParagraph || "").trim(),
      question: q.questionTitle || q.question || "",
      options: q.options || [],
      correct_answer: correct[0] || "",
    };
  },

  summarize_spoken_text: (q, mediaUrl) => {
    const rawScript = q.audioScript || stripHtml(q.sampleAnswer || "");
    const sampleAnswers = parseSampleAnswers(q.sampleAnswer || q.audioScript || "");
    return {
      audio_url: mediaUrl || "",
      audio_script: rawScript.trim(),
      sample_answers: sampleAnswers,
      word_limit_min: 50,
      word_limit_max: 70,
      time_limit_seconds: 600,
    };
  },

  listening_mcq_multiple: (q, mediaUrl) => ({
    audio_url: mediaUrl || "",
    question: q.question || q.questionTitle || "",
    options: q.options || [],
    correct_answers: q.correctAnswer || [],
    negative_marking: true,
  }),

  listening_fill_in_the_blanks: (q, mediaUrl) => {
    const transcript = (q.question || "").trim();
    return {
      audio_url: mediaUrl || "",
      transcript_with_blanks: transcript,
      correct_answers: q.correctAnswer || [],
      blank_count: (transcript.match(/###/g) || []).length,
    };
  },

  listening_mcq_single: (q, mediaUrl) => {
    const correct = q.correctAnswer || [];
    return {
      audio_url: mediaUrl || "",
      question: q.question || q.questionTitle || "",
      options: q.options || [],
      correct_answer: correct[0] || "",
    };
  },

  select_missing_word: (q, mediaUrl) => {
    const correct = q.correctAnswer || [];
    return {
      audio_url: mediaUrl || "",
      options: q.options || [],
      correct_answer: correct[0] || "",
    };
  },

  highlight_incorrect_words: (q, mediaUrl) => ({
    audio_url: mediaUrl || "",
    transcript: (q.questionParagraph || "").trim(),
    incorrect_words: q.correctAnswer || [],
  }),

  write_from_dictation: (q, mediaUrl) => {
    const correct = q.correctAnswer || [];
    return {
      audio_url: mediaUrl || "",
      correct_sentence: correct[0] || "",
    };
  },
};

// ─── Friendly title generation (ported from scripts/update_questions_db.js) ─
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "of", "in", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "this", "that", "these", "those", "with", "from",
  "as", "about", "into", "through", "during", "after", "before",
]);

function cleanText(text) {
  if (!text) return "";
  if (Array.isArray(text)) text = text.join(" ");
  if (typeof text !== "string") text = String(text);
  return text
    .replace(/\[blank_\d+\]/g, "")
    .replace(/###/g, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPrimaryText(content) {
  return (
    content.passage ||
    content.passage_with_blanks ||
    content.transcript ||
    content.audio_script ||
    content.transcript_with_blanks ||
    content.correct_sentence ||
    content.question_text ||
    content.question ||
    content.prompt ||
    content.scenario ||
    ""
  );
}

function generateFriendlyTitle(taskType, content, index) {
  const cleaned = cleanText(getPrimaryText(content));
  const friendlyType = taskType.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (!cleaned) return `${friendlyType} #${index}`;

  const words = cleaned.split(" ").filter((w) => w.length > 0);
  let titleWords = [];
  let addedCount = 0;
  for (let i = 0; i < words.length && addedCount < 4; i++) {
    const wordLower = words[i].toLowerCase();
    if (addedCount === 0 && /^\d+$/.test(words[i]) && words.length > i + 1) continue;
    if (STOP_WORDS.has(wordLower) && addedCount === 0 && i < words.length - 1) continue;
    titleWords.push(words[i]);
    addedCount++;
  }
  if (titleWords.length === 0) titleWords = words.slice(0, 3);
  const capitalized = titleWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return `${capitalized} #${index}`;
}

// ─── Storage path helpers ───────────────────────────────────────────────────
function extFromUrl(url, fallback) {
  const clean = (url || "").split("?")[0];
  const m = clean.match(/\.(\w+)$/);
  return m ? `.${m[1]}` : fallback;
}

async function nextIndexByTaskType(taskTypes) {
  const { data, error } = await sb.from("questions").select("task_type, content").in("task_type", [...taskTypes]);
  if (error) throw error;
  const max = {};
  for (const t of taskTypes) max[t] = 0;
  for (const row of data || []) {
    const url = row.content?.audio_url || row.content?.image_url;
    if (!url) continue;
    const m = url.match(/\/(\d+)\.\w+$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (n > (max[row.task_type] || 0)) max[row.task_type] = n;
  }
  return max;
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const questionResults = raw?.data?.result?.questionResults;
  if (!Array.isArray(questionResults)) {
    console.error("Expected data.result.questionResults array in the JSON file.");
    process.exit(1);
  }

  const entries = questionResults.map((r) => r.questionId);
  const originalIds = entries.map((q) => q._id);

  const { data: existingRows, error: existingErr } = await sb
    .from("questions")
    .select("original_id")
    .in("original_id", originalIds);
  if (existingErr) throw existingErr;
  const existingIds = new Set((existingRows || []).map((r) => r.original_id));

  let toImport = entries.filter((q) => !existingIds.has(q._id));
  if (limitArg) toImport = toImport.slice(0, limitArg);
  console.log(`Source questions: ${entries.length}. Already in DB: ${existingIds.size}. To import: ${toImport.length}.`);
  if (toImport.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const mediaTaskTypes = new Set(
    toImport
      .map((q) => CATEGORY_TO_TASK_TYPE[`${q.section}/${q.category}`])
      .filter((t) => AUDIO_TASK_TYPES.has(t) || IMAGE_TASK_TYPES.has(t))
  );
  const nextIndex = await nextIndexByTaskType(mediaTaskTypes);

  const rows = [];
  const manifest = []; // { source, target, taskType, kind }
  const perTypeCounter = {}; // running index within this import per task_type

  for (const q of toImport) {
    const key = `${q.section}/${q.category}`;
    const taskType = CATEGORY_TO_TASK_TYPE[key];
    if (!taskType) {
      console.warn(`  ! No task_type mapping for "${key}" (id ${q._id}) — skipping.`);
      continue;
    }
    const module = q.section.toLowerCase();

    let mediaUrl = null;
    const hasAudio = AUDIO_TASK_TYPES.has(taskType) && q.audioFile;
    const hasImage = IMAGE_TASK_TYPES.has(taskType) && q.imageFile;

    if (hasAudio || hasImage) {
      perTypeCounter[taskType] = (perTypeCounter[taskType] || nextIndex[taskType] || 0) + 1;
      const idx = perTypeCounter[taskType];
      const sourceUrl = hasAudio ? q.audioFile : q.imageFile;
      const kind = hasAudio ? "audio" : "images";
      const ext = extFromUrl(sourceUrl, hasAudio ? ".mp3" : ".png");
      const storagePath = `${kind}/${taskType}/${idx}${ext}`;
      mediaUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
      manifest.push({ source: sourceUrl, target: `${STORAGE_BUCKET}/${storagePath}`, taskType, kind });
    }

    const builder = CONTENT_BUILDERS[taskType];
    const content = builder(q, mediaUrl);
    const title = generateFriendlyTitle(taskType, content, rows.length + 1);

    rows.push({
      original_id: q._id,
      module,
      task_type: taskType,
      title,
      tag: null,
      difficulty: "medium",
      is_active: true,
      is_premium: false,
      pool: poolArg,
      content,
    });
  }

  console.log(`\nBuilt ${rows.length} rows. Module breakdown:`);
  const byModule = {};
  for (const r of rows) byModule[r.module] = (byModule[r.module] || 0) + 1;
  console.log(byModule);

  if (manifest.length > 0) {
    console.log(`\n${manifest.length} question(s) need media uploaded to Supabase Storage bucket "${STORAGE_BUCKET}":`);
    console.log("(source URL -> upload target; the row's audio_url/image_url already points at the target, so once");
    console.log(" the file is uploaded there it goes live with no further DB changes needed)\n");
    for (const m of manifest) {
      console.log(`  [${m.taskType}] ${m.source}`);
      console.log(`    -> ${m.target}`);
    }
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Not writing to the database.");
    return;
  }

  const { data, error } = await sb.from("questions").insert(rows).select("id");
  if (error) {
    console.error("Insert failed:", error.message);
    fs.appendFileSync(LOG_FILE, `[error] insert failed: ${error.message}\n`);
    return;
  }
  console.log(`\nDone. Inserted ${data.length} question rows with pool='${poolArg}'.`);
  fs.appendFileSync(LOG_FILE, `[end] ${new Date().toISOString()}\n`);
}

main().catch((e) => {
  console.error(e);
  fs.appendFileSync(LOG_FILE, `[error] ${new Date().toISOString()} ${e?.stack || e}\n`);
  process.exit(1);
});
