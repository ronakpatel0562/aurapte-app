const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

const [from, to] = process.argv.slice(2);
if (!from || !to) {
  console.error("Usage: node scripts/rename_storage_file.js <from-path> <to-path>");
  process.exit(1);
}

(async () => {
  const { data, error } = await sb.storage.from("pte-media").move(from, to);
  if (error) throw error;
  console.log("Renamed:", data);
})();
