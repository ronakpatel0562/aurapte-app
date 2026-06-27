const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load variables from .env.local
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

async function createTestUser() {
  const email = "test@aurapte.com";
  const password = "Password123!";
  const fullName = "AuraPTE Test User";

  console.log(`Checking if user ${email} already exists...`);
  
  // Try to delete existing user if they exist to start fresh
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    console.log(`User ${email} already exists. Deleting user to recreate...`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error("Error deleting existing user:", deleteError.message);
    } else {
      console.log("Successfully deleted existing user.");
    }
  }

  console.log(`Creating test user: ${email}...`);
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone: "+1234567890"
    }
  });

  if (createError) {
    console.error("Error creating test user:", createError.message);
    process.exit(1);
  }

  console.log(`User created successfully! ID: ${user.id}`);
  
  // Make sure profiles record exists. (The trigger in supabase/schema.sql should handle this,
  // but let's check or insert to be double safe).
  console.log("Checking profiles table...");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.log("Profile not created by trigger, inserting profile manually...");
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: fullName,
        phone: "+1234567890",
        plan: "premium" // give test user premium plan
      });

    if (insertError) {
      console.error("Error inserting profile:", insertError.message);
    } else {
      console.log("Successfully inserted profile manually.");
    }
  } else {
    console.log("Profile already exists:", profile);
    // Let's upgrade them to premium if they are free to let them test everything
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan: "premium" })
      .eq("id", user.id);
    if (updateError) {
      console.error("Error updating profile to premium:", updateError.message);
    } else {
      console.log("Updated profile to premium.");
    }
  }

  console.log("\n==================================================");
  console.log("TEST USER CREATED SUCCESSFULLY");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("==================================================");
}

createTestUser();
