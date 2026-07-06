// One-shot utility: the raw media dump (PTE Material folder) has files named
// with inconsistent prefixes (acronyms like "RS 225.mp3", full names like
// "repeat_sentence154.mp3", mixed case, stray spaces). The trailing number in
// every filename is already the GLOBAL target number used by
// scripts/import_mock_test_questions.js, so this script just needs to figure
// out the category from the prefix and copy the file into
// pte-media/<audio|images>/<category>/<number>.<ext>.
//
// Usage: node scripts/organize_media_files.js <source-dir> <output-dir> [--copy]
// Without --copy it only prints the report (dry run).

const fs = require("fs");
const path = require("path");

const ACRONYMS = {
  asq: "answer_short_question",
  rs: "repeat_sentence",
  rts: "responding_to_situation",
  wfd: "write_from_dictation",
  hiw: "highlight_incorrect_words",
  hi: "highlight_incorrect_words",
  sst: "summarize_spoken_text",
  smw: "select_missing_word",
  di: "describe_image",
};

const FULL_NAMES = [
  "answer_short_question",
  "repeat_sentence",
  "responding_to_situation",
  "write_from_dictation",
  "highlight_incorrect_words",
  "summarize_spoken_text",
  "select_missing_word",
  "listening_fill_in_the_blanks",
  "listening_mcq_multiple",
  "listening_mcq_single",
  "describe_image",
];

// Expected global-number ranges across mock-test 2..15, used only to flag
// suspicious outliers (typos, wrong test's leftover file, etc.) — not to
// block copying.
const EXPECTED_RANGES = {
  repeat_sentence: [144, 284],
  describe_image: [20, 75],
  responding_to_situation: [32, 67],
  answer_short_question: [51, 134],
  summarize_spoken_text: [12, 28],
  listening_mcq_multiple: [24, 42],
  listening_fill_in_the_blanks: [92, 115],
  listening_mcq_single: [20, 39],
  select_missing_word: [24, 39],
  highlight_incorrect_words: [9, 36],
  write_from_dictation: [58, 107],
};

// Known one-off fat-finger fixes: "MOCK1/RS414.mp3" is the missing
// repeat_sentence/141 (134-140,142,143 are all present, 141 is the only gap).
const MANUAL_NUMBER_FIXES = {
  "RS414.mp3": 141,
};

// Known one-off prefix typos that don't fuzzy-match cleanly against an
// acronym or full category name.
const MANUAL_PREFIX_FIXES = {
  "WED80.mp3": "write_from_dictation", // "WED" -> "WFD" (adjacent-key typo)
};

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".m4a", ".ogg"]);

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function resolveCategory(rawPrefix) {
  const norm = rawPrefix.toLowerCase().replace(/[\s_]+/g, "");
  if (ACRONYMS[norm]) return ACRONYMS[norm];

  const normUnderscored = rawPrefix.toLowerCase().trim().replace(/\s+/g, "_");
  if (FULL_NAMES.includes(normUnderscored)) return normUnderscored;

  // fuzzy fallback for typos, e.g. "respondig_to_situation"
  let best = null;
  let bestDist = Infinity;
  for (const name of FULL_NAMES) {
    const nameNorm = name.replace(/_/g, "");
    const dist = levenshtein(norm, nameNorm);
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  if (best && bestDist <= 3) return { fuzzy: best, dist: bestDist };
  return null;
}

function parseFilename(name) {
  const ext = path.extname(name).toLowerCase();
  const base = name.slice(0, -ext.length).trim();
  const match = base.match(/^([a-zA-Z_ ]+?)\s*([0-9]+)$/);
  if (!match) return { ok: false, reason: "no-prefix-number-pattern", ext };
  const [, prefixRaw, numStr] = match;
  const prefix = prefixRaw.trim();
  const number = parseInt(numStr, 10);
  if (MANUAL_PREFIX_FIXES[name]) {
    return { ok: true, prefix, number, category: MANUAL_PREFIX_FIXES[name], ext };
  }
  const category = resolveCategory(prefix);
  if (!category) return { ok: false, reason: `unknown-prefix:${prefix}`, ext };
  return { ok: true, prefix, number, category, ext };
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function main() {
  const [srcDir, outDir, flag] = process.argv.slice(2);
  if (!srcDir || !outDir) {
    console.error("Usage: node scripts/organize_media_files.js <source-dir> <output-dir> [--copy]");
    process.exit(1);
  }
  const doCopy = flag === "--copy";

  const files = walk(srcDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return AUDIO_EXTS.has(ext) || IMAGE_EXTS.has(ext);
  });

  const matched = [];
  const unmatched = [];
  const suspicious = [];
  const targetSeen = new Map(); // target path -> source file (collision detection)

  for (const file of files) {
    const name = path.basename(file);
    let parsed = parseFilename(name);
    const mockFolder = path.relative(srcDir, path.dirname(file)).split(path.sep)[0];

    // Bare-number filenames (e.g. "144.mp3") inside a category-named
    // subfolder (e.g. "RS/") — borrow the category from the parent dir.
    if (!parsed.ok && parsed.reason === "no-prefix-number-pattern") {
      const ext = path.extname(name).toLowerCase();
      const base = name.slice(0, -ext.length).trim();
      if (/^[0-9]+$/.test(base)) {
        const parentDir = path.basename(path.dirname(file));
        const category = resolveCategory(parentDir);
        if (category && typeof category !== "object") {
          parsed = { ok: true, prefix: parentDir, number: parseInt(base, 10), category, ext };
        }
      }
    }

    if (!parsed.ok) {
      unmatched.push({ file, mockFolder, reason: parsed.reason });
      continue;
    }

    if (MANUAL_NUMBER_FIXES[name] !== undefined) {
      parsed.number = MANUAL_NUMBER_FIXES[name];
    }

    let category = parsed.category;
    let fuzzyNote = null;
    if (typeof category === "object") {
      fuzzyNote = `fuzzy-matched "${parsed.prefix}" -> ${category.fuzzy} (dist ${category.dist})`;
      category = category.fuzzy;
    }

    const kind = IMAGE_EXTS.has(parsed.ext) ? "images" : "audio";
    const targetRel = path.join("pte-media", kind, category, `${parsed.number}${parsed.ext}`);

    const range = EXPECTED_RANGES[category];
    const outOfRange = range && (parsed.number < range[0] || parsed.number > range[1]);

    const record = { file, mockFolder, category, number: parsed.number, targetRel, fuzzyNote, outOfRange };

    if (fuzzyNote || outOfRange) {
      suspicious.push(record);
    }

    if (targetSeen.has(targetRel)) {
      suspicious.push({ ...record, collisionWith: targetSeen.get(targetRel) });
    } else {
      targetSeen.set(targetRel, file);
    }

    matched.push(record);
  }

  console.log(`\nMatched: ${matched.length}  Unmatched: ${unmatched.length}  Suspicious: ${suspicious.length}\n`);

  if (unmatched.length) {
    console.log("=== UNMATCHED (need manual review) ===");
    for (const u of unmatched) console.log(`  [${u.mockFolder}] ${path.basename(u.file)}  (${u.reason})`);
    console.log();
  }

  if (suspicious.length) {
    console.log("=== SUSPICIOUS (copied but flagged for review) ===");
    for (const s of suspicious) {
      const bits = [];
      if (s.fuzzyNote) bits.push(s.fuzzyNote);
      if (s.outOfRange) bits.push(`number ${s.number} outside expected range for ${s.category}`);
      if (s.collisionWith) bits.push(`target collides with ${s.collisionWith}`);
      console.log(`  [${s.mockFolder}] ${path.basename(s.file)} -> ${s.targetRel}  (${bits.join("; ")})`);
    }
    console.log();
  }

  if (doCopy) {
    for (const m of matched) {
      const dest = path.join(outDir, m.targetRel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(m.file, dest);
    }
    console.log(`Copied ${matched.length} files into ${outDir}`);
  } else {
    console.log("Dry run (no files copied). Re-run with --copy to write files.");
  }
}

main();
