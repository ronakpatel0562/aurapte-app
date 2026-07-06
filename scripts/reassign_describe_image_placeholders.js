// mock-test 1..15 describe_image rows (pool='mock_only') all point at
// content.image_url paths that were never uploaded to storage (see
// scripts/organize_media_files.js conversation — no image files exist in
// any of the source PTE Material dumps). Since describe_image content has
// no text tied to the image (just image_url/image_type/image_alt, and
// image_alt is always ""), the fix is to repoint each broken row at one of
// the already-working 'shared' pool images instead of sourcing new ones.
//
// Grouping: mock_only rows are chunked into groups of 4 in ascending
// content.image_url index order, which reproduces the original per-test
// assignment order from import_mock_test_questions.js's running counter
// (each mock test contributed exactly 4 describe_image rows, in test
// order). Within each group of 4, shared-pool images are shuffled and
// assigned without repeats (falls back to allowing repeats only if the
// shared pool has fewer than 4 images).
//
// Usage: node scripts/reassign_describe_image_placeholders.js [--apply]
// Without --apply it only prints the planned reassignment (dry run).

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

function imageIndex(url) {
  const m = url && url.match(/\/(\d+)\.\w+$/);
  return m ? parseInt(m[1], 10) : null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const { data: rows, error } = await sb
    .from("questions")
    .select("id, pool, content, title")
    .eq("task_type", "describe_image");
  if (error) throw error;

  const shared = rows.filter((r) => r.pool === "shared" && r.content?.image_url);
  const mockOnly = rows
    .filter((r) => r.pool === "mock_only")
    .sort((a, b) => (imageIndex(a.content?.image_url) ?? 0) - (imageIndex(b.content?.image_url) ?? 0));

  if (shared.length === 0) {
    console.error("No working 'shared' describe_image images found — nothing to reassign from.");
    process.exit(1);
  }

  console.log(`Found ${shared.length} shared source images, ${mockOnly.length} mock_only rows to reassign.\n`);

  // group into chunks of 4 (one group per mock test, in original assignment order)
  const groups = [];
  for (let i = 0; i < mockOnly.length; i += 4) groups.push(mockOnly.slice(i, i + 4));

  const updates = [];
  groups.forEach((group, testIdx) => {
    const pickFrom = shared.length >= group.length ? shuffle(shared) : shuffle(shared);
    group.forEach((row, i) => {
      const source = pickFrom[i % pickFrom.length];
      updates.push({
        id: row.id,
        title: row.title,
        testNumber: testIdx + 1,
        oldUrl: row.content?.image_url,
        newUrl: source.content.image_url,
        newContent: { ...row.content, image_url: source.content.image_url },
      });
    });
  });

  for (const u of updates) {
    console.log(`  mock-test-${u.testNumber}  ${u.title}  ${u.oldUrl}  ->  ${u.newUrl}`);
  }

  if (!apply) {
    console.log("\nDry run (no DB writes). Re-run with --apply to write changes.");
    return;
  }

  for (const u of updates) {
    const { error: updErr } = await sb.from("questions").update({ content: u.newContent }).eq("id", u.id);
    if (updErr) throw updErr;
  }
  console.log(`\nUpdated ${updates.length} rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
