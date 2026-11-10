import Link from "next/link";
import { signOut } from "@/lib/actions";

export type HeaderUser = { fullName: string; role: string } | null;

const links = [
  ["Scholarships", "/scholarships"],
  ["About", "/about"],
  ["How it works", "/how-it-works"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
];

function Mark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-soft text-pine" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 18V6.5L12 4l7 2.5V18" strokeLinejoin="round" />
        <path d="M9 18v-5h6v5" />
        <path d="M12 4v5" />
      </svg>
    </span>
  );
}

export function SiteHeader({ user, localMode }: { user: HeaderUser; localMode: boolean }) {
  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/10 bg-pine text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <span>
              <span className="block font-display text-lg leading-none tracking-tight">Visaed</span>
              <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold-soft">Scholarships</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex" aria-label="Primary">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-white">
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/account" className="rounded-full border border-white/15 px-3 py-1 text-white hover:border-white/40">
                  {user.fullName}
                </Link>
                {user.role !== "student" ? (
                  <Link href="/admin" className="hover:text-white">
                    Admin
                  </Link>
                ) : null}
                <form action={signOut}>
                  <button className="text-sm font-medium text-white/80 hover:text-white" type="submit">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded-full bg-gold-soft px-4 py-1.5 font-semibold text-pine hover:bg-white">
                Log in
              </Link>
            )}
          </nav>
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-full border border-white/20 px-3 py-1.5 text-sm font-medium">Menu</summary>
            <nav className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-line bg-card p-3 text-ink shadow-xl" aria-label="Mobile">
              <ul className="space-y-1 text-sm">
                {links.map(([label, href]) => (
                  <li key={href}>
                    <Link className="block rounded-xl px-3 py-2 hover:bg-paper" href={href}>
                      {label}
                    </Link>
                  </li>
                ))}
                {user ? (
                  <>
                    <li>
                      <Link className="block rounded-xl px-3 py-2 hover:bg-paper" href="/account">
                        Account
                      </Link>
                    </li>
                    {user.role !== "student" ? (
                      <li>
                        <Link className="block rounded-xl px-3 py-2 hover:bg-paper" href="/admin">
                          Admin
                        </Link>
                      </li>
                    ) : null}
                  </>
                ) : (
                  <li>
                    <Link className="block rounded-xl px-3 py-2 font-semibold text-teal hover:bg-paper" href="/login">
                      Log in
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </details>
        </div>
      </div>
      {localMode ? (
        <p className="bg-gold-soft px-4 py-2 text-center text-xs font-medium tracking-wide text-gold">
          Local preview. Sample listings are fictional and are not open for application. Database and hosting are not connected yet.
        </p>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-pine text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Mark />
            <p className="font-display text-2xl">Visaed Scholarships</p>
          </div>
          <p className="mt-4 max-w-sm leading-relaxed text-white/70">
            A staff-checked catalog of scholarship programs. A listing is information, not an award.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-white/80">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">Explore</p>
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Legal" className="flex flex-col gap-2 text-white/80">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">Legal</p>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/cookies" className="hover:text-white">
            Cookies
          </Link>
          <Link href="/accessibility" className="hover:text-white">
            Accessibility
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
        </nav>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Visaed Scholarships. Legal name to be confirmed before launch.
      </p>
    </footer>
  );
}

export function DraftBanner() {
  return (
    <p className="rounded-2xl border border-gold/30 bg-gold-soft px-4 py-3 text-sm leading-relaxed text-gold">
      Draft for review. This page is not a final privacy notice or contract. Counsel needs to approve it before production, including the legal name, address, and governing law.
    </p>
  );
}
