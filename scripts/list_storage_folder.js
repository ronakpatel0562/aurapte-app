const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(path.resolve(__dirname, "../.env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)[1].trim().replace(/['"]/g, "");
const sb = createClient(url, key);

const folder = process.argv[2];

(async () => {
  const { data, error } = await sb.storage.from("pte-media").list(folder, { limit: 1000 });
  if (error) throw error;
  const names = data.map((d) => d.name).sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    return na - nb;
  });
  console.log(names.join("\n"));
})();
