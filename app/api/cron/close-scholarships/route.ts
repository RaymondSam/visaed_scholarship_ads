import { timingSafeEqual } from "node:crypto";
import { getRepository } from "@/lib/data/local-store";

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET || (process.env.NODE_ENV === "production" ? "" : "local-dev-cron-secret");
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const closed = await getRepository().closeExpired();
  return Response.json({ closed });
}
