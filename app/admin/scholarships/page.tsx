import Link from "next/link";
import { primaryButtonClass } from "@/components/ui";
import { currentProfile } from "@/lib/auth/current";
import { getRepository } from "@/lib/data/local-store";
import { redirect } from "next/navigation";

export const metadata = { title: "Listings" };

function one(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentProfile();
  if (!user) redirect("/login");
  const params = await searchParams;
  const items = await getRepository().listManaged(user.id, {
    status: one(params, "status"),
    closing: one(params, "closing") === "1",
    reviewDue: one(params, "review") === "due",
    closedThisMonth: one(params, "closed") === "month",
  });
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-4xl">Scholarships</h1>
        <Link href="/admin/scholarships/new" className={primaryButtonClass}>
          New listing
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href={`/admin/scholarships/${item.id}`}>
                    {item.title || "Untitled draft"}
                  </Link>
                </td>
                <td className="px-5 py-3 capitalize">{item.status}</td>
                <td className="px-5 py-3 text-muted">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.updatedAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p className="px-5 py-6 text-muted">No listings in this view.</p> : null}
      </div>
    </div>
  );
}
