import { revalidateTag } from "next/cache";

export function revalidateScholarships() {
  try {
    revalidateTag("scholarships", { expire: 0 });
  } catch {
    // Scripts and unit tests have no Next.js request cache.
  }
}
