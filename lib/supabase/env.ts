export function supabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const env = supabasePublicEnv();
  if (!env) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return env;
}

export function requireSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.");
  }
  return key;
}

export function coverPublicUrl(objectPath: string): string {
  const { url } = requireSupabasePublicEnv();
  const encoded = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/scholarship-media/${encoded}`;
}
