import Link from "next/link";
import { runDeadlineCheck } from "@/lib/actions";
import { getRepository } from "@/lib/data/local-store";
import { currentProfile } from "@/lib/auth/current";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const user = await currentProfile();
  if (!user) redirect("/login?next=/admin");
  const stats = await getRepository().dashboard(user.id);
  const cards = [
    ["Drafts", stats.drafts, "/admin/scholarships?status=draft"],
    ["Published", stats.published, "/admin/scholarships?status=published"],
    ["Closing in 14 days", stats.closing, "/admin/scholarships?closing=1"],
    ["Needs re-check", stats.reviewDue, "/admin/scholarships?review=due"],
    ["Closed this month", stats.closedThisMonth, "/admin/scholarships?closed=month"],
    ["New inquiries", stats.newInquiries, "/admin/inquiries"],
  ];
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Staff</p>
      <h1 className="mt-2 text-4xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={String(href)} className="rounded-3xl border border-line bg-card p-5 shadow-[0_16px_40px_-34px_rgb(20_34_31)] transition hover:-translate-y-0.5 hover:border-teal">
            <span className="text-sm text-muted">{label}</span>
            <span className="mt-2 block font-display text-4xl">{value}</span>
          </Link>
        ))}
      </div>
      <form action={runDeadlineCheck} className="mt-8 rounded-3xl border border-line bg-card p-5">
        <button className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-teal" type="submit">
          Run deadline check
        </button>
        <p className="mt-3 text-sm text-muted">Closes published listings whose deadline has passed. The same job is available to the daily cron route.</p>
      </form>
    </div>
  );
}
