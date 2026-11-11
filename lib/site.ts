export function dataProvider(): "local" | "supabase" {
  const configured = process.env.DATA_PROVIDER ?? "local";
  if (configured === "supabase") return "supabase";
  if (configured !== "local") throw new Error("DATA_PROVIDER must be local or supabase.");
  if (process.env.VERCEL === "1") {
    throw new Error("Vercel requires DATA_PROVIDER=supabase. The local file database cannot run on Vercel.");
  }
  return "local";
}

export function isLocalMode(): boolean {
  return dataProvider() === "local";
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
