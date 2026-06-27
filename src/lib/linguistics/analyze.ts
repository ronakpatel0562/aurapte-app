/**
 * Lightweight client-side linguistic feedback for free-text responses.
 *
 * Backed by `nspell` + the `dictionary-en` wordlist, loaded dynamically so the
 * ~600 KB dictionary is excluded from the initial JS bundle and only fetched
 * once a candidate actually submits an attempt.
 *
 * Returns a token-level annotation list (kept intentionally simple: the PTE
 * writing tasks are short free-text answers, so we don't need a full parser).
 */

export type TokenKind = "word" | "whitespace" | "punct";

export interface AnnotatedToken {
  text: string;
  kind: TokenKind;
  /** True only when the underlying spell-checker flags the word. */
  misspelled?: boolean;
  /** Up to three spelling suggestions (only populated when misspelled). */
  suggestions?: string[];
}

export interface LinguisticIssue {
  /** The original token as it appeared in the input. */
  token: string;
  /** Sentence-level position of the offending token. */
  index: number;
  /** What we detected. */
  type: "spelling" | "capitalization" | "punctuation" | "duplication";
  /** Human-readable explanation shown in tooltips and lists. */
  message: string;
  /** Up to three spelling suggestions for `spelling` issues. */
  suggestions?: string[];
}

export interface LinguisticAnalysis {
  /** Best-effort sentence count in the candidate text. */
  sentenceCount: number;
  /** Whether the candidate starts with a capital letter. */
  startsWithCapital: boolean;
  /** Whether the candidate ends with a terminal period, exclamation, or question mark. */
  endsWithPunctuation: boolean;
  /** Repeated adjacent words (e.g. "the the"). */
  duplicates: string[];
  /** Tokens with their spelling annotations (whitespace and punctuation preserved). */
  annotatedTokens: AnnotatedToken[];
  /** Flat list of issues for summary panels. */
  issues: LinguisticIssue[];
}

// Module-level cache so the dictionary is loaded only once per browser session.
let spellInstancePromise: Promise<{
  correct: (w: string) => boolean;
  suggest: (w: string) => string[];
}> | null = null;

// The Hunspell .aff and .dic files live in /public/dictionaries/ so they are
// served as plain static assets (Next.js `public/` is the recommended place for
// files that must be reachable at runtime). This keeps the ~600 KB word list
// out of the JS bundle.
const DICT_AFF_URL = "/dictionaries/en.aff";
const DICT_DIC_URL = "/dictionaries/en.dic";

async function loadSpeller(): Promise<{
  correct: (w: string) => boolean;
  suggest: (w: string) => string[];
}> {
  if (spellInstancePromise) return spellInstancePromise;

  spellInstancePromise = (async () => {
    const [{ default: nspell }, affText, dicText] = await Promise.all([
      import("nspell"),
      fetch(DICT_AFF_URL).then((r) => r.text()),
      fetch(DICT_DIC_URL).then((r) => r.text()),
    ]);
    // nspell accepts an .aff string and either a Buffer or string for the .dic
    return nspell(affText, dicText);
  })();

  return spellInstancePromise;
}

/**
 * Splits text into word, whitespace, and punctuation tokens while preserving
 * the original string for lossless reconstruction.
 */
function tokenize(text: string): AnnotatedToken[] {
  const tokens: AnnotatedToken[] = [];
  // Matches runs of letters/apostrophes, runs of whitespace, or single punctuation chars
  const re = /[A-Za-z][A-Za-z'’]*|\s+|[^A-Za-z\s]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const value = match[0];
    if (/^\s+$/.test(value)) {
      tokens.push({ text: value, kind: "whitespace" });
    } else if (/^[A-Za-z]/.test(value)) {
      tokens.push({ text: value, kind: "word" });
    } else {
      tokens.push({ text: value, kind: "punct" });
    }
  }
  return tokens;
}

function countTerminalPunctuation(text: string): number {
  const matches = text.match(/[.!?]+/g);
  return matches ? matches.length : 0;
}

/**
 * Analyse free-text for PTE writing tasks.
 *
 * Returns synchronous-safe defaults when the spell dictionary is still
 * loading; spelling fields will simply be empty until the promise resolves.
 */
export async function analyzeLinguistics(
  text: string
): Promise<LinguisticAnalysis> {
  const trimmed = (text ?? "").trim();
  const tokens = tokenize(trimmed);
  const sentenceCount = countTerminalPunctuation(trimmed);
  const startsWithCapital = trimmed.length > 0 && /^[A-Z]/.test(trimmed);
  const endsWithPunctuation = trimmed.length > 0 && /[.!?]$/.test(trimmed);

  const annotatedTokens: AnnotatedToken[] = tokens.map((t) => ({ ...t }));
  const issues: LinguisticIssue[] = [];

  let speller: Awaited<ReturnType<typeof loadSpeller>> | null = null;
  try {
    speller = await loadSpeller();
  } catch {
    // If the dictionary fails to load we degrade gracefully — the rest of the
    // analysis (capitalization, duplication, sentence count) is still useful.
    speller = null;
  }

  let wordIndex = 0;
  for (let i = 0; i < annotatedTokens.length; i++) {
    const tok = annotatedTokens[i];
    if (tok.kind !== "word") continue;

    const original = tok.text;
    // Strip leading/trailing apostrophes so "don't" is checked as "don't".
    const stripped = original.replace(/^[’'‘]+|[’'‘]+$/g, "");

    let suggestions: string[] | undefined;

    if (speller && stripped.length > 1 && /[a-zA-Z]/.test(stripped)) {
      const correct = speller.correct(stripped);
      const misspelled = !correct;
      if (misspelled) {
        const rawSuggestions = speller.suggest(stripped) || [];
        const preserveCase = (s: string) =>
          /^[A-Z]/.test(stripped)
            ? s.charAt(0).toUpperCase() + s.slice(1)
            : s;
        suggestions = rawSuggestions.slice(0, 3).map(preserveCase);
        tok.misspelled = true;
        tok.suggestions = suggestions;
        issues.push({
          token: original,
          index: wordIndex,
          type: "spelling",
          message: `Possible spelling: "${original}"`,
          suggestions,
        });
      }
    }

    // First word should be capitalised.
    if (wordIndex === 0 && !startsWithCapital) {
      issues.push({
        token: original,
        index: 0,
        type: "capitalization",
        message: "Sentences should start with a capital letter.",
      });
    }

    wordIndex++;
  }

  // Detect repeated adjacent words (e.g. "the the").
  const wordTokens = annotatedTokens.filter((t) => t.kind === "word");
  const duplicates: string[] = [];
  for (let i = 1; i < wordTokens.length; i++) {
    const prev = wordTokens[i - 1].text.toLowerCase();
    const cur = wordTokens[i].text.toLowerCase();
    if (prev === cur && /[a-zA-Z]/.test(prev)) {
      duplicates.push(wordTokens[i].text);
      issues.push({
        token: wordTokens[i].text,
        index: i,
        type: "duplication",
        message: `Repeated word: "${wordTokens[i].text}"`,
      });
    }
  }

  if (trimmed.length > 0 && !endsWithPunctuation) {
    issues.push({
      token: trimmed,
      index: tokens.length,
      type: "punctuation",
      message: "End the sentence with a period, question mark, or exclamation mark.",
    });
  }

  return {
    sentenceCount,
    startsWithCapital,
    endsWithPunctuation,
    duplicates: Array.from(new Set(duplicates)),
    annotatedTokens,
    issues,
  };
}
