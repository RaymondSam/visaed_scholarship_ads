export function isLocalMode(): boolean {
  return (process.env.DATA_PROVIDER ?? "local") !== "supabase";
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
