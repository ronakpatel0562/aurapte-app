// One-shot migration: copy every audio file from Supabase Storage
// (pte-media bucket) into a Cloudflare R2 bucket.
//
// Usage (after you've set up R2 in the Cloudflare dashboard):
//
//   # 1. Create an R2 API token with "Object Read & Write" permission
//   #    scoped to your bucket. CF gives you:
//   #    - Access Key ID
//   #    - Secret Access Key
//   #    - Account ID (in the URL of the dashboard)
//
//   # 2. Set the four env vars below and run:
//   CLOUDFLARE_ACCOUNT_ID=xxx \
//   R2_ACCESS_KEY_ID=xxx \
//   R2_SECRET_ACCESS_KEY=*** \
//   R2_BUCKET=aurapte-audio \
//     node scripts/migrate_audio_to_r2.js
//
//   # 3. In the CF dashboard, attach a custom domain to the bucket
//   #    (e.g. audio.aurapte.com) so it's publicly reachable.
//   #    Then set NEXT_PUBLIC_AUDIO_CDN_URL=https://audio.aurapte.com
//   #    in your Vercel env. The app's taskTypeMapper will then serve
//   #    audio from R2 instead of Supabase.
//
// The script is idempotent — it skips files that already exist in R2
// with the same size. Run it again any time you add new questions.

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1].trim();
const bucket = process.env.R2_BUCKET || "aurapte-audio";

if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error(
    "Missing env vars. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (and optionally R2_BUCKET) before running."
  );
  process.exit(1);
}

// ---- S3-compatible request signing for R2 ----------------------------------
// R2 supports the S3 API. We hand-sign requests because we don't want
// another dep and the request count here is small (221 files).

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function signRequest({ method, host, region, service, path: reqPath, payloadHash, accessKey, secretKey }) {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [method, reqPath, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");

  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  return {
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };
}

function r2Put({ host, region, path: reqPath, body, contentType }) {
  return new Promise((resolve, reject) => {
    const payloadHash = sha256Hex(body);
    const headers = signRequest({
      method: "PUT",
      host,
      region,
      service: "s3",
      path: reqPath,
      payloadHash,
      accessKey: process.env.R2_ACCESS_KEY_ID,
      secretKey: process.env.R2_SECRET_ACCESS_KEY,
    });
    const opts = {
      method: "PUT",
      host,
      path: reqPath,
      headers: {
        ...headers,
        "content-type": contentType,
        "content-length": body.length,
      },
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`PUT ${reqPath} → ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function r2Head({ host, region, path: reqPath }) {
  return new Promise((resolve) => {
    const headers = signRequest({
      method: "HEAD",
      host,
      region,
      service: "s3",
      path: reqPath,
      payloadHash: sha256Hex(""),
      accessKey: process.env.R2_ACCESS_KEY_ID,
      secretKey: process.env.R2_SECRET_ACCESS_KEY,
    });
    const opts = { method: "HEAD", host, path: reqPath, headers };
    const req = https.request(opts, (res) => resolve(res));
    req.on("error", () => resolve(null));
    req.end();
  });
}

// ---- Enumerate source files via the questions table ------------------------

const sb = createClient(supabaseUrl, serviceKey);

async function listAudioPaths() {
  const paths = new Set();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb
      .from("questions")
      .select("content")
      .not("content->audio_url", "is", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    data.forEach((row) => {
      const u = row.content?.audio_url || "";
      const m = u.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      if (m) paths.add(m[1]);
    });
    from += PAGE;
    if (data.length < PAGE) break;
  }
  return [...paths];
}

function fetchSupabaseFile(relPath) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/storage/v1/object/public/pte-media/${relPath}`;
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${url} → ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            body: Buffer.concat(chunks),
            contentType: res.headers["content-type"] || "application/octet-stream",
          })
        );
      })
      .on("error", reject);
  });
}

(async () => {
  const paths = await listAudioPaths();
  console.log(`Found ${paths.length} audio files to migrate.`);
  const host = `${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const region = "auto";

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  for (const relPath of paths) {
    process.stdout.write(`[${uploaded + skipped + failed + 1}/${paths.length}] ${relPath} ... `);
    try {
      const head = await r2Head({ host, region, path: `/${bucket}/${relPath}` });
      if (head && head.statusCode === 200) {
        console.log("skip (exists)");
        skipped++;
        continue;
      }
      const { body, contentType } = await fetchSupabaseFile(relPath);
      await r2Put({ host, region, path: `/${bucket}/${relPath}`, body, contentType });
      console.log(`uploaded (${body.length} bytes)`);
      uploaded++;
    } catch (err) {
      console.error("FAIL:", err.message);
      failed++;
    }
  }
  console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
})();