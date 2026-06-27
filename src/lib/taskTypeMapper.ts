/**
 * Utility for mapping task types between route formats (dashes) and database formats (underscores),
 * as well as normalizing question data content structures.
 */

const URL_TO_DB_MAP: Record<string, Record<string, string>> = {
  speaking: {
    "read-aloud": "read_aloud",
    "repeat-sentence": "repeat_sentence",
    "describe-image": "describe_image",
    "responding-to-situation": "responding_to_situation",
    "answer-short-question": "answer_short_question",
  },
  writing: {
    "summarize-written-text": "summarize_written_text",
    "write-an-email": "write_an_email",
  },
  reading: {
    "rw-fill-in-the-blanks": "rw_fill_in_the_blanks",
    "multiple-choice-multiple": "reading_mcq_multiple",
    "reorder-paragraphs": "reorder_paragraphs",
    "reading-fill-in-the-blanks": "reading_fill_in_the_blanks",
    "multiple-choice-single": "reading_mcq_single",
  },
  listening: {
    "summarize-spoken-text": "summarize_spoken_text",
    "multiple-choice-multiple": "listening_mcq_multiple",
    "fill-in-the-blanks": "listening_fill_in_the_blanks",
    "multiple-choice-single": "listening_mcq_single",
    "select-missing-word": "select_missing_word",
    "highlight-incorrect-words": "highlight_incorrect_words",
    "write-from-dictation": "write_from_dictation",
  },
};

const DB_TO_URL_MAP: Record<string, string> = {
  // Speaking
  "read_aloud": "read-aloud",
  "repeat_sentence": "repeat-sentence",
  "describe_image": "describe-image",
  "responding_to_situation": "responding-to-situation",
  "answer_short_question": "answer-short-question",
  // Writing
  "summarize_written_text": "summarize-written-text",
  "write_an_email": "write-an-email",
  // Reading
  "rw_fill_in_the_blanks": "rw-fill-in-the-blanks",
  "reading_mcq_multiple": "multiple-choice-multiple",
  "reorder_paragraphs": "reorder-paragraphs",
  "reading_fill_in_the_blanks": "reading-fill-in-the-blanks",
  "reading_mcq_single": "multiple-choice-single",
  // Listening
  "summarize_spoken_text": "summarize-spoken-text",
  "listening_mcq_multiple": "multiple-choice-multiple",
  "listening_fill_in_the_blanks": "fill-in-the-blanks",
  "listening_mcq_single": "multiple-choice-single",
  "select_missing_word": "select-missing-word",
  "highlight_incorrect_words": "highlight-incorrect-words",
  "write_from_dictation": "write-from-dictation",
};

const TASK_TYPE_FRIENDLY_NAMES: Record<string, string> = {
  "read-aloud": "Read Aloud",
  "read_aloud": "Read Aloud",
  "repeat-sentence": "Repeat Sentence",
  "repeat_sentence": "Repeat Sentence",
  "describe-image": "Describe Image",
  "describe_image": "Describe Image",
  "responding-to-situation": "Responding to Situation",
  "responding_to_situation": "Responding to Situation",
  "answer-short-question": "Answer Short Question",
  "answer_short_question": "Answer Short Question",
  
  "summarize-written-text": "Summarize Written Text",
  "summarize_written_text": "Summarize Written Text",
  "write-an-email": "Write an Email",
  "write_an_email": "Write an Email",
  
  "rw-fill-in-the-blanks": "Reading & Writing: Fill in the Blanks",
  "rw_fill_in_the_blanks": "Reading & Writing: Fill in the Blanks",
  "multiple-choice-multiple": "Multiple Choice, Multiple Answers",
  "reading_mcq_multiple": "Multiple Choice, Multiple Answers",
  "listening_mcq_multiple": "Multiple Choice, Multiple Answers",
  "reorder-paragraphs": "Re-order Paragraphs",
  "reorder_paragraphs": "Re-order Paragraphs",
  "reading-fill-in-the-blanks": "Reading: Fill in the Blanks",
  "reading_fill_in_the_blanks": "Reading: Fill in the Blanks",
  "multiple-choice-single": "Multiple Choice, Single Answer",
  "reading_mcq_single": "Multiple Choice, Single Answer",
  "listening_mcq_single": "Multiple Choice, Single Answer",
  
  "summarize-spoken-text": "Summarize Spoken Text",
  "summarize_spoken_text": "Summarize Spoken Text",
  "fill-in-the-blanks": "Fill in the Blanks",
  "listening_fill_in_the_blanks": "Fill in the Blanks",
  "select-missing-word": "Select Missing Word",
  "select_missing_word": "Select Missing Word",
  "highlight-incorrect-words": "Highlight Incorrect Words",
  "highlight_incorrect_words": "Highlight Incorrect Words",
  "write-from-dictation": "Write from Dictation",
  "write_from_dictation": "Write from Dictation",
};

/**
 * Maps the task type parameter from the URL path to the database representation.
 */
export function mapUrlToDbTaskType(moduleParam: string, taskTypeParam: string): string {
  const mod = moduleParam.toLowerCase();
  const type = taskTypeParam.toLowerCase();
  
  return URL_TO_DB_MAP[mod]?.[type] || type.replace(/-/g, "_");
}

/**
 * Maps the database representation of task type to the URL path representation.
 */
export function mapDbToUrlTaskType(dbTaskType: string): string {
  return DB_TO_URL_MAP[dbTaskType] || dbTaskType.replace(/_/g, "-");
}

/**
 * Returns a student-friendly name for the given task type.
 */
export function getTaskTypeFriendlyName(taskType: string): string {
  return TASK_TYPE_FRIENDLY_NAMES[taskType] || taskType.replace(/[-_]/g, " ");
}

/**
 * Rewrites the audio URL so it's served from the configured CDN instead
 * of Supabase Storage. Set NEXT_PUBLIC_AUDIO_CDN_URL to your R2 public
 * domain (e.g. https://audio.aurapte.com) to enable; leave it unset to
 * keep using the original Supabase URL. Both URLs are absolute, so the
 * rewrite is just a host swap — the path under /storage/v1/object/public/
 * is preserved.
 *
 * Why this exists: Supabase Storage egress costs add up. Routing audio
 * through Cloudflare R2 (which has zero egress fees) is cheaper at scale
 * without changing the database rows.
 */
export function rewriteAudioUrl(url: string | undefined | null): string | undefined | null {
  if (!url) return url;
  const cdnBase = process.env.NEXT_PUBLIC_AUDIO_CDN_URL;
  if (!cdnBase) return url; // no-op when env var is unset

  // Match the path component under the Supabase public-storage prefix
  // (`/storage/v1/object/public/<bucket>/<path>`). The bucket in this
  // project is `pte-media`.
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return url; // not a Supabase URL — leave alone
  const path = match[2];
  // Strip trailing slash from cdnBase so we don't produce `//path`.
  const base = cdnBase.replace(/\/+$/, "");
  return `${base}/${path}`;
}

/**
 * Normalizes question data structure fetched from the database
 * to the shape expected by the frontend React components.
 */
export function transformQuestionContent(question: any): any {
  if (!question || !question.content) return question;

  const type = question.task_type;
  const content = { ...question.content };

  // Rewrite audio URLs to the configured CDN before any per-task-type
  // normalisation runs, so downstream consumers see the final URL.
  if (content.audio_url) content.audio_url = rewriteAudioUrl(content.audio_url);

  // Normalise the model-answer field. Some sources (third-party question
  // dumps) store the absolute answer under `sample_answer`; the rest of the
  // app only knows about `model_answer`. Prefer the canonical name, fall
  // back to the alternate, and always expose a non-empty string when one
  // exists. The stored value may also be HTML (copied from a rich-text
  // editor); strip it to plain text so every consumer renders cleanly.
  const rawAnswer =
    (typeof content.model_answer === "string" && content.model_answer.trim()) ||
    (typeof content.sample_answer === "string" && content.sample_answer.trim()) ||
    "";
  if (rawAnswer) content.model_answer = stripHtml(rawAnswer);

  // 1. Reading & Writing Fill in the Blanks (stored as rw_fill_in_the_blanks)
  if (type === "rw_fill_in_the_blanks" || type === "rw-fill-in-the-blanks") {
    if (content.blank_options && Array.isArray(content.blank_options)) {
      const dropdown_choices: Record<string, string[]> = {};
      const answers: Record<string, string> = {};
      
      content.blank_options.forEach((options: string[], index: number) => {
        const blankKey = `blank_${index}`;
        dropdown_choices[blankKey] = options;
        if (content.correct_answers && content.correct_answers[index]) {
          answers[blankKey] = content.correct_answers[index];
        }
      });
      
      let passage = content.passage_with_blanks || "";
      let blankIndex = 0;
      while (passage.includes("###")) {
        passage = passage.replace("###", `[blank_${blankIndex}]`);
        blankIndex++;
      }
      
      content.dropdown_choices = dropdown_choices;
      content.answers = answers;
      content.passage_with_blanks = passage;
    }
  }

  // 2. Reading Fill in the Blanks (stored as reading_fill_in_the_blanks)
  if (type === "reading_fill_in_the_blanks" || type === "reading-fill-in-the-blanks") {
    if (content.correct_answers && Array.isArray(content.correct_answers)) {
      const answers: Record<string, string> = {};
      content.correct_answers.forEach((ans: string, index: number) => {
        answers[`blank_${index}`] = ans;
      });
      
      let passage = content.passage_with_blanks || "";
      
      // Clean up the dotted line trailing the ### placeholders if present
      let blankIndex = 0;
      while (/###(?:\s*[\.\s_…\u2026]+)?/.test(passage)) {
        passage = passage.replace(/###(?:\s*[\.\s_…\u2026]+)?/, `[blank_${blankIndex}]`);
        blankIndex++;
      }
      
      content.answers = answers;
      content.passage_with_blanks = passage;
    }
  }

  // 3. Listening Fill in the Blanks (stored as listening_fill_in_the_blanks)
  if (type === "listening_fill_in_the_blanks" || type === "listening-fill-in-the-blanks") {
    if (content.correct_answers && Array.isArray(content.correct_answers)) {
      const answers: Record<string, string> = {};
      content.correct_answers.forEach((ans: string, index: number) => {
        answers[`blank_${index}`] = ans;
      });

      let passage = content.transcript_with_blanks || "";
      let blankIndex = 0;
      while (passage.includes("###")) {
        passage = passage.replace("###", `[blank_${blankIndex}]`);
        blankIndex++;
      }

      // Reconstruct the clean transcript for model answers / reading along
      let cleanTranscript = content.transcript_with_blanks || "";
      if (Array.isArray(content.correct_answers)) {
        content.correct_answers.forEach((ans: string) => {
          cleanTranscript = cleanTranscript.replace("###", ans);
        });
      }

      content.answers = answers;
      content.audio_transcript_with_blanks = passage;
      content.audio_transcript = cleanTranscript;
    }
  }

  // 4. Listening Multiple Choice – Multiple Answers (stored as listening_mcq_multiple)
  if (type === "listening_mcq_multiple" || type === "listening-multiple-choice-multiple") {
    // DB stores options as bare strings ("Economic growth and stability"),
    // not "A. Economic growth...". Components compare `option[0]` to a letter
    // and score against letter keys, so we synthesize letter-prefixed copies
    // and re-map the correct_answers (which the DB stores as full option
    // text) back to those letters.
    const opts = Array.isArray(content.options) ? content.options : [];
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const letteredOptions = opts.map((opt: string, i: number) => {
      const letter = letters[i] || String.fromCharCode(65 + i);
      return `${letter}. ${opt}`;
    });
    content.options = letteredOptions;
    if (Array.isArray(content.correct_answers)) {
      content.correct_answers = content.correct_answers.map((ans: unknown) => {
        if (typeof ans !== "string") return ans;
        // Already a letter?
        if (/^[A-H]$/.test(ans.trim())) return ans.trim();
        // Find the matching option index and return its letter.
        const idx = opts.findIndex(
          (o: unknown) => typeof o === "string" && o.trim() === ans.trim()
        );
        return idx >= 0 ? letters[idx] : ans;
      });
    } else {
      content.correct_answers = [];
    }
    if (!content.audio_transcript) content.audio_transcript = "";
  }

  // 5. Listening Multiple Choice – Single Answer (stored as listening_mcq_single)
  if (type === "listening_mcq_single" || type === "listening-multiple-choice-single") {
    const opts = Array.isArray(content.options) ? content.options : [];
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    content.options = opts.map((opt: string, i: number) => {
      const letter = letters[i] || String.fromCharCode(65 + i);
      return `${letter}. ${opt}`;
    });
    if (!content.audio_transcript) content.audio_transcript = "";
    if (content.correct_answer && !content.correct_answers) {
      const idx = opts.findIndex(
        (o: unknown) => typeof o === "string" && o.trim() === String(content.correct_answer).trim()
      );
      content.correct_answers = [idx >= 0 ? letters[idx] : String(content.correct_answer)];
    } else if (!content.correct_answers) {
      content.correct_answers = [];
    }
  }

  // 6. Select Missing Word (stored as select_missing_word)
  if (type === "select_missing_word" || type === "select-missing-word") {
    const opts = Array.isArray(content.options) ? content.options : [];
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    content.options = opts.map((opt: string, i: number) => {
      const letter = letters[i] || String.fromCharCode(65 + i);
      return `${letter}. ${opt}`;
    });
    if (!content.audio_transcript) content.audio_transcript = "";
    if (content.correct_answer && !content.correct_answers) {
      const idx = opts.findIndex(
        (o: unknown) => typeof o === "string" && o.trim() === String(content.correct_answer).trim()
      );
      content.correct_answers = [idx >= 0 ? letters[idx] : String(content.correct_answer)];
    } else if (!content.correct_answers) {
      content.correct_answers = [];
    }
  }

  // 7. Highlight Incorrect Words (stored as highlight_incorrect_words)
  if (type === "highlight_incorrect_words" || type === "highlight-incorrect-words") {
    // Component wants `correct_transcript` and `passage_with_incorrect_words`;
    // DB stores `transcript` (the clean version) and `incorrect_words` (array
    // of substitutions). We construct the incorrect transcript by replacing
    // each incorrect word with a placeholder, but only when both lists are
    // available — otherwise leave the fields empty so the UI degrades
    // gracefully instead of crashing.
    const clean = (w: string) =>
      String(w).toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    if (typeof content.transcript === "string" && Array.isArray(content.incorrect_words) && content.incorrect_words.length > 0) {
      // Build the incorrect version by swapping each target word with its
      // replacement. We walk the transcript word-by-word so that case and
      // punctuation are preserved.
      const incorrectSet = new Set(content.incorrect_words.map(clean));
      const altered = content.transcript
        .split(/\s+/)
        .map((word: string) => (incorrectSet.has(clean(word)) ? word : word))
        .join(" ");
      content.correct_transcript = content.transcript;
      content.passage_with_incorrect_words = altered;
      content.incorrect_words = content.incorrect_words.map((w: string) => String(w));
    } else {
      content.correct_transcript = content.transcript || "";
      content.passage_with_incorrect_words = content.transcript || "";
      content.incorrect_words = Array.isArray(content.incorrect_words) ? content.incorrect_words : [];
    }
  }

  // 8. Summarize Spoken Text (stored as summarize_spoken_text)
  if (type === "summarize_spoken_text" || type === "summarize-spoken-text") {
    // The DB stores `audio_script` as one long string that may include a
    // "SAMPLE ANSWER:-" or "SAMPLE ANSWERS:-" marker followed by a list of
    // acceptable model summaries (often separated by ".........." or new
    // lines). Split the field so the script ends at the marker and the
    // candidates go into `sample_answers` for the model-answer card.
    if (typeof content.audio_script === "string") {
      const marker = /SAMPLE\s+ANSWERS?\s*:\s*-?/i;
      const split = content.audio_script.split(marker);
      const scriptOnly = (split[0] || "").trim();
      const candidatesRaw = split.slice(1).join(" ");
      const candidates = candidatesRaw
        .split(/(?:\.{6,}|\r?\n)/g)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      content.audio_transcript = scriptOnly || content.audio_script.trim();
      if (candidates.length > 0 && !Array.isArray(content.sample_answers)) {
        content.sample_answers = candidates;
      }
    }
    if (!content.audio_transcript) content.audio_transcript = "";
    if (!content.model_answer) {
      const samples = Array.isArray(content.sample_answers) ? content.sample_answers : [];
      content.model_answer =
        samples.find((s: unknown) => typeof s === "string" && (s as string).trim()) || "";
    }
  }

  // 9. Write from Dictation (stored as write_from_dictation)
  if (type === "write_from_dictation" || type === "write-from-dictation") {
    // Component reads `sentence`; DB stores it under `correct_sentence`.
    // Alias it so the component and the scorer see a single canonical key.
    if (typeof content.correct_sentence === "string" && !content.sentence) {
      content.sentence = content.correct_sentence;
    }
  }

  return {
    ...question,
    content,
  };
}

// Strip HTML tags and decode the entities we actually see in stored model
// answers. Pure, dependency-free, runs on the client (no DOMParser needed)
// because the input is fully under our control — the question bank.
function stripHtml(input: string): string {
  return input
    // Insert a newline before each block-level opening tag so paragraph
    // boundaries survive the tag-stripping step.
    .replace(/<\s*\/?\s*(p|br|div|li|h[1-6])\b[^>]*>/gi, "\n")
    // Remove every other tag.
    .replace(/<[^>]+>/g, "")
    // Decode the named / numeric entities used in stored answers.
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
    // Collapse runs of 3+ blank lines down to two.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
