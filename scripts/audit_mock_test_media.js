// Full audit: for every mock test (src/lib/testDefinitions.mock.json), resolve
// each question's legacyId (original_id) to its questions row, pull out
// content.audio_url / content.image_url, and check whether that path
// actually exists in the pte-media storage bucket (not just that the DB
// column is non-null — a broken/never-uploaded reference still has a URL
// string, it just 404s).
//
// Usage: node scripts/audit_mock_test_media.js

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

const STORAGE_BUCKET = "pte-media";

function storagePathFromUrl(mediaUrl) {
  const marker = `/public/${STORAGE_BUCKET}/`;
  const idx = mediaUrl.indexOf(marker);
  if (idx === -1) return null;
  return mediaUrl.slice(idx + marker.length);
}

async function listAllStoragePaths() {
  const paths = new Set();
  async function walk(prefix) {
    const { data, error } = await sb.storage.from(STORAGE_BUCKET).list(prefix, { limit: 1000 });
    if (error) throw error;
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        // folder (no id) — recurse
        await walk(full);
      } else {
        paths.add(full);
      }
    }
  }
  await walk("");
  return paths;
}

async function main() {
  const defs = require("../src/lib/testDefinitions.mock.json");
  const mockTests = defs.data.mockTests;

  const allLegacyIds = new Set();
  for (const t of mockTests) for (const s of t.sections) for (const id of s.legacyIds) allLegacyIds.add(id);

  console.log(`Resolving ${allLegacyIds.size} unique legacyIds against the questions table...`);
  const idList = Array.from(allLegacyIds);
  const BATCH = 150;
  const questions = [];
  for (let i = 0; i < idList.length; i += BATCH) {
    const batch = idList.slice(i, i + BATCH);
    const { data, error } = await sb
      .from("questions")
      .select("original_id, task_type, content, has_audio, has_image")
      .in("original_id", batch);
    if (error) throw error;
    questions.push(...data);
  }

  const byLegacyId = new Map(questions.map((q) => [q.original_id, q]));

  console.log("Listing all files actually present in the pte-media bucket...");
  const existingPaths = await listAllStoragePaths();
  console.log(`Found ${existingPaths.size} files in storage.\n`);

  const report = [];
  for (const t of mockTests) {
    let expectedMedia = 0;
    let missingRows = []; // legacyId not found in questions table at all
    let missingMedia = []; // row found, has audio/image, but file not in storage
    let noMediaExpected = 0;

    for (const s of t.sections) {
      for (const legacyId of s.legacyIds) {
        const q = byLegacyId.get(legacyId);
        if (!q) {
          missingRows.push({ legacyId, module: s.module });
          continue;
        }
        const mediaUrl = q.content?.audio_url || q.content?.image_url;
        if (!mediaUrl) {
          noMediaExpected++;
          continue;
        }
        expectedMedia++;
        const storagePath = storagePathFromUrl(mediaUrl);
        if (!storagePath || !existingPaths.has(storagePath)) {
          missingMedia.push({ legacyId, task_type: q.task_type, mediaUrl });
        }
      }
    }

    report.push({
      id: t.id,
      totalQuestions: t.totalQuestions,
      expectedMedia,
      noMediaExpected,
      missingRows,
      missingMedia,
    });
  }

  for (const r of report) {
    const ok = r.missingRows.length === 0 && r.missingMedia.length === 0;
    console.log(
      `${r.id}: ${r.totalQuestions} questions, ${r.expectedMedia} need media — ${
        ok ? "ALL PRESENT" : `${r.missingMedia.length} missing media, ${r.missingRows.length} unresolved rows`
      }`
    );
    for (const m of r.missingRows) console.log(`    [unresolved row] legacyId ${m.legacyId} (${m.module})`);
    for (const m of r.missingMedia) console.log(`    [missing file] ${m.task_type} legacyId ${m.legacyId} -> ${m.mediaUrl}`);
  }

  const totalMissing = report.reduce((a, r) => a + r.missingMedia.length + r.missingRows.length, 0);
  console.log(`\nTotal issues across all mock tests: ${totalMissing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
