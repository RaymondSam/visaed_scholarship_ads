import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv, requireSupabaseServiceKey } from "@/lib/supabase/env";

export function createServiceClient() {
  const { url } = requireSupabasePublicEnv();
  return createClient(url, requireSupabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
