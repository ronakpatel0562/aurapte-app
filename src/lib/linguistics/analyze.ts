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
  /** The type of issue detected for this token (if any). */
  issueType?: "spelling" | "capitalization" | "punctuation" | "duplication" | "grammar";
  /** Up to three spelling suggestions (only populated when misspelled or grammar issue). */
  suggestions?: string[];
}

export interface LinguisticIssue {
  /** The original token as it appeared in the input. */
  token: string;
  /** Sentence-level position of the offending token. */
  index: number;
  /** What we detected. */
  type: "spelling" | "capitalization" | "punctuation" | "duplication" | "grammar";
  /** Human-readable explanation shown in tooltips and lists. */
  message: string;
  /** Up to three suggestions for spelling/grammar issues. */
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

const IRREGULAR_PAST_MAP: Record<string, string> = {
  came: "come",
  went: "go",
  saw: "see",
  ate: "eat",
  wrote: "write",
  gave: "give",
  took: "take",
  done: "do",
  had: "have",
  said: "say",
  made: "make",
  kept: "keep",
  thought: "think",
  brought: "bring",
  bought: "buy",
  told: "tell",
  felt: "feel",
  found: "find",
  heard: "hear",
  left: "leave",
  lost: "lose",
  met: "meet",
  slept: "sleep",
  spent: "spend",
  stood: "stand",
  understood: "understand",
  spoke: "speak",
  broke: "break",
  chose: "choose",
  forgot: "forget",
  froze: "freeze",
  shook: "shake",
  stole: "steal",
  woke: "wake",
  blew: "blow",
  drew: "draw",
  grew: "grow",
  knew: "know",
  threw: "throw",
  flew: "fly",
  fell: "fall",
  rode: "ride",
  rang: "ring",
  sang: "sing",
  sank: "sink",
  sprang: "spring",
  swam: "swim",
  began: "begin",
  ran: "run",
  won: "win",
};

const DO_VERBS = new Set(["do", "does", "did", "don't", "doesn't", "didn't", "dont", "doesnt", "didnt"]);

function getBaseFormFromIng(word: string, speller?: any): string {
  const lower = word.toLowerCase();
  if (lower === "coming") return "come";
  if (lower === "having") return "have";
  if (lower === "making") return "make";
  if (lower === "taking") return "take";
  if (lower === "giving") return "give";
  if (lower === "writing") return "write";
  if (lower === "running") return "run";
  if (lower === "getting") return "get";
  if (lower === "sitting") return "sit";
  if (lower === "swimming") return "swim";
  if (lower === "putting") return "put";
  if (lower === "stopping") return "stop";
  if (lower === "beginning") return "begin";
  if (lower === "planning") return "plan";

  if (/(.)\1ing$/i.test(lower)) {
    return word.slice(0, -4);
  }
  if (/[bcdfghjklmnpqrstvwxyz]ing$/i.test(lower)) {
    const stripped = word.slice(0, -3);
    const withE = stripped + "e";
    if (speller && !speller.correct(stripped) && speller.correct(withE)) {
      return withE;
    }
    return stripped;
  }
  return word.slice(0, -3);
}

function getBaseFormFromEd(word: string, speller?: any): string {
  const lower = word.toLowerCase();
  if (lower.endsWith("ied")) {
    return word.slice(0, -3) + "y";
  }
  if (lower.endsWith("ed")) {
    const stripped = word.slice(0, -2);
    if (speller && !speller.correct(stripped) && speller.correct(stripped + "e")) {
      return stripped + "e";
    }
    return stripped;
  }
  return word;
}

function getBaseFormFromS(word: string, speller?: any): string {
  const lower = word.toLowerCase();
  if (lower.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  }
  if (lower.endsWith("es")) {
    const stripped = word.slice(0, -2);
    if (speller && speller.correct(stripped)) return stripped;
    const strippedS = word.slice(0, -1);
    if (speller && speller.correct(strippedS)) return strippedS;
    return stripped;
  }
  if (lower.endsWith("s") && !lower.endsWith("ss") && !lower.endsWith("us") && !lower.endsWith("is") && !lower.endsWith("as")) {
    return word.slice(0, -1);
  }
  return word;
}

const SINGULAR_PRONOUNS = new Set(["he", "she", "it"]);
const PLURAL_PRONOUNS = new Set(["they", "we", "you", "i"]);

const COMMON_BASE_VERBS: Record<string, string> = {
  have: "has",
  do: "does",
  go: "goes",
  want: "wants",
  need: "needs",
  like: "likes",
  love: "loves",
  see: "sees",
  say: "says",
  think: "thinks",
  know: "knows",
  make: "makes",
  take: "takes",
  get: "gets",
  come: "comes",
  give: "gives",
  find: "finds",
  tell: "tells",
  feel: "feels",
  try: "tries",
  work: "works",
  study: "studies",
  play: "plays",
  run: "runs",
  speak: "speaks",
  write: "writes",
  read: "reads",
  use: "uses",
  create: "creates",
  help: "helps",
};

const COMMON_SINGULAR_VERBS: Record<string, string> = {};
for (const [base, sing] of Object.entries(COMMON_BASE_VERBS)) {
  COMMON_SINGULAR_VERBS[sing] = base;
}

const MODAL_VERBS = new Set(["should", "would", "could", "can", "will", "shall", "may", "might", "must"]);

const DOUBLE_NEGATIVES = new Set(["no", "nothing", "nobody", "never"]);
const NEGATIVE_WORDS = new Set(["not", "n't", "don't", "doesn't", "didn't", "cannot", "can't", "won't", "wouldn't", "never"]);

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
        tok.issueType = "spelling";
        tok.suggestions = suggestions;
        issues.push({
          token: original,
          index: wordIndex,
          type: "spelling",
          message: "Possible spelling mistake found.",
          suggestions,
        });
      }
    }

    // First word should be capitalised.
    if (wordIndex === 0 && !startsWithCapital) {
      tok.issueType = "capitalization";
      issues.push({
        token: original,
        index: 0,
        type: "capitalization",
        message: "Sentences should start with a capital letter.",
      });
    }

    wordIndex++;
  }

  // Detect grammar issues & duplicates on the clean word tokens array
  const wordTokens = annotatedTokens.filter((t) => t.kind === "word");  for (let i = 0; i < wordTokens.length; i++) {
    const tok = wordTokens[i];
    if (tok.issueType) continue;
    const wordLower = tok.text.toLowerCase();

    // 1. Auxiliary 'do/does/did' check
    if (i > 0) {
      const prevWord = wordTokens[i - 1].text.toLowerCase();
      let hasAuxDo = false;
      let aux = "";

      if (DO_VERBS.has(prevWord)) {
        hasAuxDo = true;
        aux = wordTokens[i - 1].text;
      } else if (prevWord === "not" && i > 1) {
        const prevPrevWord = wordTokens[i - 2].text.toLowerCase();
        if (DO_VERBS.has(prevPrevWord)) {
          hasAuxDo = true;
          aux = wordTokens[i - 2].text;
        }
      }

      if (hasAuxDo) {
        let isGrammarError = false;
        let baseFormSuggestion = "";

        if (wordLower.endsWith("ing")) {
          isGrammarError = true;
          baseFormSuggestion = getBaseFormFromIng(tok.text, speller);
        } else if (wordLower.endsWith("ed") || IRREGULAR_PAST_MAP[wordLower]) {
          isGrammarError = true;
          baseFormSuggestion = IRREGULAR_PAST_MAP[wordLower] || getBaseFormFromEd(tok.text, speller);
        } else if (wordLower.endsWith("s") && !wordLower.endsWith("ss") && !wordLower.endsWith("us") && !wordLower.endsWith("is") && !wordLower.endsWith("as")) {
          const exclude = new Set(["has", "is", "was", "does", "its", "his", "this", "us", "thus", "as"]);
          if (!exclude.has(wordLower)) {
            isGrammarError = true;
            baseFormSuggestion = getBaseFormFromS(tok.text, speller);
          }
        }

        if (isGrammarError) {
          const original = tok.text;
          const suggestions = baseFormSuggestion ? [baseFormSuggestion] : [];
          tok.issueType = "grammar";
          tok.suggestions = suggestions;
          issues.push({
            token: original,
            index: i,
            type: "grammar",
            message: `The auxiliary verb '${aux}' requires the base form of the verb.`,
            suggestions,
          });
        }
      }
    }

    // 2. 'a' vs 'an' check
    if (i > 0) {
      const prevWord = wordTokens[i - 1].text.toLowerCase();
      const VOWELS = new Set(["a", "e", "i", "o", "u"]);

      if (prevWord === "a") {
        if (VOWELS.has(wordLower[0])) {
          const isException = wordLower.startsWith("uni") || wordLower.startsWith("use") || wordLower.startsWith("one");
          if (!isException) {
            wordTokens[i - 1].issueType = "grammar";
            wordTokens[i - 1].suggestions = ["an"];
            issues.push({
              token: wordTokens[i - 1].text,
              index: i - 1,
              type: "grammar",
              message: 'Use "an" instead of "a" before a vowel sound.',
              suggestions: ["an"],
            });
          }
        }
      } else if (prevWord === "an") {
        if (!VOWELS.has(wordLower[0])) {
          const isException = wordLower.startsWith("hour") || wordLower.startsWith("honest") || wordLower.startsWith("honor");
          if (!isException) {
            wordTokens[i - 1].issueType = "grammar";
            wordTokens[i - 1].suggestions = ["a"];
            issues.push({
              token: wordTokens[i - 1].text,
              index: i - 1,
              type: "grammar",
              message: 'Use "a" instead of "an" before a consonant sound.',
              suggestions: ["a"],
            });
          }
        }
      }
    }

    // 3. Subject-verb agreement (singular/plural pronouns)
    if (i > 0) {
      const prevWord = wordTokens[i - 1].text.toLowerCase();
      if (SINGULAR_PRONOUNS.has(prevWord) && COMMON_BASE_VERBS[wordLower]) {
        const suggestion = COMMON_BASE_VERBS[wordLower];
        tok.issueType = "grammar";
        tok.suggestions = [suggestion];
        issues.push({
          token: tok.text,
          index: i,
          type: "grammar",
          message: `Subject-verb agreement: "${prevWord}" requires the third-person singular verb form "${suggestion}".`,
          suggestions: [suggestion],
        });
      } else if (PLURAL_PRONOUNS.has(prevWord) && COMMON_SINGULAR_VERBS[wordLower]) {
        const suggestion = COMMON_SINGULAR_VERBS[wordLower];
        tok.issueType = "grammar";
        tok.suggestions = [suggestion];
        issues.push({
          token: tok.text,
          index: i,
          type: "grammar",
          message: `Subject-verb agreement: "${prevWord}" requires the plural verb form "${suggestion}".`,
          suggestions: [suggestion],
        });
      }
    }

    // 4. Modal verbs base form validation
    if (i > 0) {
      const prevWord = wordTokens[i - 1].text.toLowerCase();
      let hasModal = false;
      let modal = "";

      if (MODAL_VERBS.has(prevWord)) {
        hasModal = true;
        modal = wordTokens[i - 1].text;
      } else if (prevWord === "not" && i > 1) {
        const prevPrevWord = wordTokens[i - 2].text.toLowerCase();
        if (MODAL_VERBS.has(prevPrevWord)) {
          hasModal = true;
          modal = wordTokens[i - 2].text;
        }
      }

      if (hasModal) {
        let isGrammarError = false;
        let baseFormSuggestion = "";

        if (wordLower.endsWith("ing")) {
          isGrammarError = true;
          baseFormSuggestion = getBaseFormFromIng(tok.text, speller);
        } else if (wordLower.endsWith("ed") || IRREGULAR_PAST_MAP[wordLower]) {
          isGrammarError = true;
          baseFormSuggestion = IRREGULAR_PAST_MAP[wordLower] || getBaseFormFromEd(tok.text, speller);
        } else if (wordLower.endsWith("s") && !wordLower.endsWith("ss") && !wordLower.endsWith("us") && !wordLower.endsWith("is") && !wordLower.endsWith("as")) {
          const exclude = new Set(["has", "is", "was", "does", "its", "his", "this", "us", "thus", "as"]);
          if (!exclude.has(wordLower)) {
            isGrammarError = true;
            baseFormSuggestion = getBaseFormFromS(tok.text, speller);
          }
        }

        if (isGrammarError) {
          const original = tok.text;
          const suggestions = baseFormSuggestion ? [baseFormSuggestion] : [];
          tok.issueType = "grammar";
          tok.suggestions = suggestions;
          issues.push({
            token: original,
            index: i,
            type: "grammar",
            message: `The modal verb '${modal}' requires the base form of the verb.`,
            suggestions,
          });
        }
      }
    }

    // 5. Infinitive 'to' validation
    if (i > 0) {
      const prevWord = wordTokens[i - 1].text.toLowerCase();
      if (prevWord === "to") {
        let isGrammarError = false;
        let baseFormSuggestion = "";

        if (wordLower.endsWith("ed") || IRREGULAR_PAST_MAP[wordLower]) {
          isGrammarError = true;
          baseFormSuggestion = IRREGULAR_PAST_MAP[wordLower] || getBaseFormFromEd(tok.text, speller);
        }

        if (isGrammarError) {
          const original = tok.text;
          const suggestions = baseFormSuggestion ? [baseFormSuggestion] : [];
          tok.issueType = "grammar";
          tok.suggestions = suggestions;
          issues.push({
            token: original,
            index: i,
            type: "grammar",
            message: `The infinitive 'to' requires the base form of the verb.`,
            suggestions,
          });
        }
      }
    }

    // 6. Double negatives check
    if (DOUBLE_NEGATIVES.has(wordLower)) {
      let foundDoubleNegative = false;
      let negWord = "";
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const checkWord = wordTokens[j].text.toLowerCase();
        if (NEGATIVE_WORDS.has(checkWord)) {
          foundDoubleNegative = true;
          negWord = wordTokens[j].text;
          break;
        }
      }

      if (foundDoubleNegative) {
        let suggestion = "";
        if (wordLower === "nothing") suggestion = "anything";
        else if (wordLower === "no") suggestion = "any";
        else if (wordLower === "nobody") suggestion = "anybody";
        else if (wordLower === "never") suggestion = "ever";

        const suggestions = suggestion ? [suggestion] : [];
        tok.issueType = "grammar";
        tok.suggestions = suggestions;
        issues.push({
          token: tok.text,
          index: i,
          type: "grammar",
          message: `Avoid double negatives (combining '${negWord}' with '${tok.text}').`,
          suggestions,
        });
      }
    }
  }

  // Detect repeated adjacent words (e.g. "the the").
  const duplicates: string[] = [];
  for (let i = 1; i < wordTokens.length; i++) {
    const prev = wordTokens[i - 1].text.toLowerCase();
    const cur = wordTokens[i].text.toLowerCase();
    if (prev === cur && /[a-zA-Z]/.test(prev)) {
      duplicates.push(wordTokens[i].text);
      wordTokens[i].issueType = "duplication";
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
