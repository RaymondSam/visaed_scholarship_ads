import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentProfile } from "@/lib/auth/current";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentProfile();
  if (!user) redirect("/login?next=/admin");
  if (user.role === "student") notFound();
  const links = [
    ["/admin", "Dashboard"],
    ["/admin/scholarships", "Scholarships"],
    ["/admin/inquiries", "Inquiries"],
  ];
  if (user.role === "super_admin") {
    links.push(["/admin/users", "Users"], ["/admin/audit", "Audit"]);
  }
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-card px-3 py-2">
        <nav aria-label="Admin" className="flex flex-wrap gap-1 text-sm font-semibold">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-1.5 hover:bg-paper hover:text-teal">
              {label}
            </Link>
          ))}
        </nav>
        {user.role === "super_admin" && user.aal !== "aal2" ? (
          <Link href="/account/security" className="px-3 text-sm font-semibold text-gold underline decoration-gold/30 underline-offset-4">
            Verify with an authenticator to manage users
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}
