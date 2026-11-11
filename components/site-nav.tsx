"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions";

export type HeaderUser = { fullName: string; role: string } | null;

const consultClass =
  "inline-flex items-center justify-center rounded-lg bg-gold-bright px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-deep";

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ links, user }: { links: [string, string][]; user: HeaderUser }) {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center gap-5 text-sm font-medium text-ink/75 xl:flex" aria-label="Primary">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={
              isCurrent(pathname, href)
                ? "border-b-2 border-gold-bright pb-0.5 font-semibold text-navy"
                : "transition hover:text-navy"
            }
            aria-current={isCurrent(pathname, href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
        <AccountLinks user={user} />
        <Link href="/contact" className={consultClass}>
          Get Free Consultation
        </Link>
      </nav>
      <details className="relative xl:hidden">
        <summary className="cursor-pointer list-none rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy">Menu</summary>
        <nav className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-card p-3 text-ink shadow-xl" aria-label="Mobile">
          <ul className="space-y-1 text-sm">
            {links.map(([label, href]) => (
              <li key={href}>
                <Link
                  className={
                    isCurrent(pathname, href)
                      ? "block rounded-lg bg-gold-soft px-3 py-2 font-semibold text-navy"
                      : "block rounded-lg px-3 py-2 hover:bg-paper"
                  }
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li>
                  <Link className="block rounded-lg px-3 py-2 hover:bg-paper" href="/account">
                    {user.fullName}
                  </Link>
                </li>
                {user.role !== "student" ? (
                  <li>
                    <Link className="block rounded-lg px-3 py-2 hover:bg-paper" href="/admin">
                      Admin
                    </Link>
                  </li>
                ) : null}
                <li>
                  <form action={signOut}>
                    <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-paper" type="submit">
                      Sign out
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <li>
                <Link className="block rounded-lg px-3 py-2 hover:bg-paper" href="/login">
                  Log in
                </Link>
              </li>
            )}
            <li className="pt-1">
              <Link href="/contact" className={`${consultClass} w-full`}>
                Get Free Consultation
              </Link>
            </li>
          </ul>
        </nav>
      </details>
    </>
  );
}

function AccountLinks({ user }: { user: HeaderUser }) {
  if (!user) {
    return (
      <Link href="/login" className="transition hover:text-navy">
        Log in
      </Link>
    );
  }
  return (
    <>
      <Link href="/account" className="max-w-32 truncate text-navy hover:text-gold">
        {user.fullName}
      </Link>
      {user.role !== "student" ? (
        <Link href="/admin" className="transition hover:text-navy">
          Admin
        </Link>
      ) : null}
      <form action={signOut}>
        <button className="text-sm font-medium text-ink/75 transition hover:text-navy" type="submit">
          Sign out
        </button>
      </form>
    </>
  );
}
