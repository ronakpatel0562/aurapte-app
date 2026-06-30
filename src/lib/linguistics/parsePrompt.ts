/**
 * Helpers for parsing writing-task prompt text coming from the database.
 *
 * The `prompt` field for `write_an_email` and `summarize_written_text` questions
 * can arrive in several shapes depending on how it was originally authored:
 *
 *   1. A plain instruction sentence (e.g. "Write an email requesting a 3-day
 *      extension on your assignment.")
 *
 *   2. A long concatenated string that mixes:
 *        - the situation paragraph
 *        - a word-count rule ("You should write between 80 and 120 words.")
 *        - a themes clause ("Your ideas must come from the following three
 *          themes: Date, time and location of the party Food that will be
 *          served Activities planned for the party")
 *      …all glued together with periods, sometimes with no trailing period on
 *      the themes list.
 *
 *   3. An explicit `bullet_points` array (preferred — see WriteEmail.tsx).
 *
 * The original naive splitter (`.split(/\.\s+/)`) breaks on shape #2 because
 * the themes list is missing trailing periods — the splitter consumed them
 * into one giant string and lost the visual structure expected by PTE practice
 * UIs (situation paragraph + 3 distinct theme bullets).
 *
 * These helpers recover the structure robustly.
 */

export interface ParsedPrompt {
  /** Plain instruction paragraph (everything before "themes:"). */
  instruction: string;
  /** Theme strings, one per bullet. Empty array if no themes detected. */
  themes: string[];
  /** Optional word-count rule extracted from the prompt (e.g. "80–120 words"). */
  wordRule?: string;
}

const THEMES_REGEXES: RegExp[] = [
  // "Your ideas must come from the following three themes: X Y Z"
  // "The following points should be covered: X, Y, Z"
  /following\s+(?:\w+\s+)?themes?\s*:\s*([\s\S]+)$/i,
  /following\s+(?:\w+\s+)?(?:points|ideas|elements)\b[^:]*:\s*([\s\S]+)$/i,
  // "Themes: X Y Z" (shorthand at the end of the prompt)
  /themes?\s*:\s*([\s\S]+)$/i,
];

const WORD_COUNT_REGEX = /write\s+between\s+(\d+)\s+and\s+(\d+)\s+words?/i;

/**
 * Parse a writing-task prompt into structured fields. Safe to call with any
 * input (returns a sensible default for empty strings).
 */
export function parsePrompt(prompt: string | undefined | null): ParsedPrompt {
  const empty: ParsedPrompt = { instruction: "", themes: [] };
  if (!prompt || typeof prompt !== "string") return empty;

  let working = prompt.trim();

  // 1. Extract word-count rule, if present.
  let wordRule: string | undefined;
  const wcMatch = working.match(WORD_COUNT_REGEX);
  if (wcMatch) {
    wordRule = `${wcMatch[1]}–${wcMatch[2]} words`;
    // Drop the entire sentence containing the rule (not just the matched
    // phrase) so the UI doesn't show "You should . Your ideas must come…"
    // with a dangling space where the rule used to be. The rule typically
    // lives in a sentence like "You should write between 80 and 120 words."
    // so we strip from the start of that sentence through its terminating
    // period (or end of string).
    const matchIndex = wcMatch.index ?? 0;
    const sentenceStart = working.lastIndexOf(".", matchIndex) + 1;
    const safeStart =
      sentenceStart > 0 ? sentenceStart : Math.max(0, matchIndex - 1);
    // Find the next period after the rule, or end of string.
    const after = working.indexOf(".", matchIndex + wcMatch[0].length);
    const safeEnd = after > 0 ? after + 1 : working.length;
    working = (working.slice(0, safeStart) + working.slice(safeEnd)).trim();
    // Collapse any double spaces left behind.
    working = working.replace(/\s{2,}/g, " ");
  }

  // 2. Try to find a "themes:" clause at the end of the prompt.
  for (const re of THEMES_REGEXES) {
    const m = working.match(re);
    if (m && m[1]) {
      const themesRaw = m[1].trim();
      let instruction = working.slice(0, m.index).trim();

      // Trim any trailing lead-in phrases from the themes clause so the
      // instruction text doesn't end with a dangling "Your ideas must come
      // from the" or "The three themes are". We do this by chopping the
      // last sentence of the instruction when it ends with a connector
      // phrase that points forward to the themes list.
      const leadInMatch = instruction.match(
        /\b(you\s+should|your\s+ideas?\s+must\s+come\s+from|the\s+(?:following|three|four|five|\d+)\s+themes?\s+are|themes?\s+(?:are|include)|ideas?\s+(?:should|must))\s*[\s\S]*$/i,
      );
      if (leadInMatch && leadInMatch.index !== undefined) {
        instruction = instruction.slice(0, leadInMatch.index).trim();
      }

      // The themes clause often arrives as a comma-or-space-separated list
      // with inconsistent delimiters:
      //   "Date, time and location of the party Food that will be served
      //    Activities planned for the party"
      // Split into the three expected chunks by capitalising the first
      // letter of each theme (sentences that don't end with a period).
      const themes = splitThemes(themesRaw);

      return {
        instruction,
        themes,
        wordRule,
      };
    }
  }

  // 3. No themes clause detected — return the whole prompt as instruction.
  return { instruction: working, themes: [], wordRule };
}

/**
 * Split a themes clause into individual themes.
 *
 * Two parsing strategies, applied in order:
 *   (a) Comma-separated — "Date, time, location" → one theme ("Date, time,
 *       location"). This is the most common case for cleanly authored
 *       questions.
 *   (b) Capital-letter segmentation — when there are no commas, look for
 *       capital letters that start a new theme: "Date A Food B Activities C"
 *       → ["Date A", "Food B", "Activities C"].
 *
 * If neither produces a clean split, the whole string is returned as a single
 * theme so we never silently drop text.
 */
function splitThemes(raw: string): string[] {
  const trimmed = raw.replace(/\.+$/, "").trim();
  if (!trimmed) return [];

  // Strategy (a): comma-separated.
  if (trimmed.includes(",")) {
    const parts = trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // If a single comma-split part still contains a capital-letter theme
    // boundary (e.g. "Date, time and location of the party Food that will be
    // served Activities planned for the party" → ["Date", "time and location
    // of the party Food that will be served Activities planned for the
    // party"]), recursively split that part by capital letters.
    const expanded: string[] = [];
    for (const part of parts) {
      if (/(?<=\s)(?=[A-Z])/.test(part)) {
        expanded.push(
          ...part
            .split(/(?<=\s)(?=[A-Z])/)
            .map((s) => s.trim())
            .filter(Boolean),
        );
      } else {
        expanded.push(part);
      }
    }

    // Glue short leading fragments back onto the next theme. The Enna
    // example produces ["Date", "time and location of the party", "Food
    // ...", "Activities ..."] — the leading "Date" is a phrase fragment
    // (no theme starts with a single word in PTE practice prompts), so we
    // merge it into the following theme with the original comma+space.
    const glued = glueShortFragments(expanded);
    if (glued.length >= 2) return glued;
  }

  // Strategy (b): segment by capital letters. A new theme starts whenever a
  // capital letter appears after a lowercase letter or after the end of a
  // "and"/"or" connector. To avoid splitting inside acronyms we require the
  // capital to be preceded by a space.
  const segmented = trimmed.split(/(?<=\s)(?=[A-Z])/);
  if (segmented.length >= 2) {
    return glueShortFragments(
      segmented.map((s) => s.trim()).filter(Boolean),
    );
  }

  // Fallback: single theme.
  return [trimmed];
}

/**
 * Merge a leading fragment that has 1-2 words (and no verb/noun phrase of
 * its own) into the following theme. Without this, themes that contain an
 * internal comma like "Date, time and location" get split into two themes
 * ("Date" + "time and location of the party …") and the rendering reads
 * oddly.
 *
 * This only applies to the comma-split branch — themes that were recovered
 * by capital-letter segmentation are kept as-is. The comma branch is the
 * one that produces false-positive short fragments like "Date" because the
 * source author used commas inside a single theme.
 */
function glueShortFragments(parts: string[]): string[] {
  if (parts.length < 2) return parts;
  const SHORT_WORD_LIMIT = 2; // only glue very short fragments (1-2 words)
  const result: string[] = [];
  let carry = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const wordCount = part.split(/\s+/).filter(Boolean).length;
    if (
      !carry &&
      wordCount <= SHORT_WORD_LIMIT &&
      i < parts.length - 1 &&
      /^[A-Z]/.test(part)
    ) {
      // Treat as a leading fragment to merge.
      carry = part;
    } else if (carry) {
      result.push(`${carry}, ${part}`);
      carry = "";
    } else {
      result.push(part);
    }
  }
  if (carry) result.push(carry); // dangling fragment, keep as-is
  return result;
}

/**
 * Truncate text for preview chips, with a sensible word-boundary fallback.
 */
export function truncate(text: string, max = 120): string {
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.substring(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.substring(0, lastSpace) : cut) + "…";
}