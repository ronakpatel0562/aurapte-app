const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envLocalPath = path.resolve(__dirname, "../.env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/);

  if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim().replace(/['"]/g, "");
  if (keyMatch && keyMatch[1]) supabaseServiceKey = keyMatch[1].trim().replace(/['"]/g, "");
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
  const email = "test@aurapte.com";
  const newPassword = "Password123!";

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);
  if (!existingUser) {
    console.error(`User ${email} not found.`);
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password: newPassword,
  });

  if (updateError) {
    console.error("Error updating password:", updateError.message);
    process.exit(1);
  }

  console.log(`Password for ${email} updated successfully.`);
}

resetPassword();
