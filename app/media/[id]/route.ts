import { getRepository } from "@/lib/data/local-store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  for (const ext of ["webp", "png", "jpg", "jpeg"]) {
    const file = getRepository().readCover(id, ext);
    if (!file) continue;
    return new Response(new Uint8Array(file.bytes), {
      headers: { "content-type": file.contentType, "cache-control": "public, max-age=3600" },
    });
  }
  return new Response("Not found", { status: 404 });
}
