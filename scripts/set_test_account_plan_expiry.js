const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_EMAIL = "test@aurapte.com";

(async () => {
  const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("listUsers error:", listErr.message);
    process.exit(1);
  }

  const testUser = userList.users.find((u) => u.email === TEST_EMAIL);
  if (!testUser) {
    console.error("No user found with email", TEST_EMAIL);
    process.exit(1);
  }

  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ plan_expiry: farFuture })
    .eq("id", testUser.id);

  if (updateErr) {
    console.error("update error:", updateErr.message);
    process.exit(1);
  }

  console.log(`Set plan_expiry for ${TEST_EMAIL} (${testUser.id}) to ${farFuture}`);
})();
