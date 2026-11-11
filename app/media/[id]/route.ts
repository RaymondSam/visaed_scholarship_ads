import { getRepository } from "@/lib/data/local-store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const located = await getRepository().resolveCover(id);
  if (!located) return new Response("Not found", { status: 404 });
  if (located.kind === "redirect") return Response.redirect(located.url, 302);
  return new Response(new Uint8Array(located.bytes), {
    headers: { "content-type": located.contentType, "cache-control": "public, max-age=3600" },
  });
}
