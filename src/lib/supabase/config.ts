export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!(
    url &&
    url.startsWith("http") &&
    url !== "your-supabase-project-url" &&
    anonKey &&
    anonKey !== "your-supabase-anon-key"
  );
}

export function getSupabaseCredentials() {
  const isConfigured = isSupabaseConfigured();
  
  const url = isConfigured
    ? process.env.NEXT_PUBLIC_SUPABASE_URL!
    : "https://placeholder-please-configure-env.supabase.co";

  const anonKey = isConfigured
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4ODMwMDAsImV4cCI6MTkwNDQ0NzAwMH0.placeholder-signature";

  const serviceRoleKey = (isConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-supabase-service-role-key")
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-service-role-key";

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured,
  };
}
