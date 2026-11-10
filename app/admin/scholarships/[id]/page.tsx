import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScholarshipEditor } from "@/components/scholarship-editor";
import { takeNotice, transitionScholarship, uploadCover } from "@/lib/actions";
import { currentProfile } from "@/lib/auth/current";
import { publishBlockers } from "@/lib/domain/rules";
import { getRepository } from "@/lib/data/local-store";

export const metadata = { title: "Edit listing" };

export default async function EditScholarshipPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentProfile();
  if (!user) redirect("/login");
  const { id } = await params;
  const query = await searchParams;
  const record = await getRepository().getManaged(user.id, id);
  if (!record) notFound();
  const notices = await takeNotice();
  const blockers = publishBlockers(record.scholarship, record.internal);
  const saved = typeof query.saved === "string" ? query.saved : "";
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Edit listing</h1>
        <Link className="text-sm font-semibold text-teal underline" href={`/admin/scholarships/${id}/preview`}>
          Preview
        </Link>
      </div>
      {saved ? <p className="mt-4 text-sm">Saved{saved === "published" ? " and published" : ""}.</p> : null}
      {notices.length ? (
        <ul role="alert" className="mt-4 list-disc rounded-md border border-danger/30 bg-danger/5 px-8 py-3 text-sm text-danger">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}
      {record.scholarship.status !== "archived" && blockers.length ? (
        <div className="mt-4 rounded-md border border-line bg-card px-4 py-3 text-sm">
          <p className="font-semibold">Still needed before a clean publish</p>
          <ul className="mt-2 list-disc pl-5">
            {blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-6">
        <ScholarshipEditor scholarship={record.scholarship} internal={record.internal} />
      </div>
      <form action={uploadCover} className="mt-8 flex flex-wrap items-end gap-3 border-t border-line pt-6">
        <input type="hidden" name="id" value={id} />
        <label className="text-sm font-semibold">
          Cover image
          <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block font-normal" />
        </label>
        <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold" type="submit">
          Upload cover
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-3">
        {(["unpublish", "close", "archive", "feature", "unfeature"] as const).map((action) => (
          <form key={action} action={transitionScholarship}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="action" value={action} />
            <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold" type="submit">
              {action}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
