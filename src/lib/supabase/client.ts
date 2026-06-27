import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCredentials } from "./config";

export function createClient() {
  const { url, anonKey } = getSupabaseCredentials();
  return createBrowserClient(url, anonKey);
}

