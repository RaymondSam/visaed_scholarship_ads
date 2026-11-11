import Link from "next/link";
import { SiteNav, type HeaderUser } from "@/components/site-nav";

export type { HeaderUser };

const links: [string, string][] = [
  ["Home", "/"],
  ["Scholarships", "/scholarships"],
  ["About", "/about"],
  ["How it works", "/how-it-works"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
];

const phones = [
  { label: "USA", href: "tel:+16055927573", text: "+1 605-592-7573" },
  { label: "Kenya", href: "tel:+254119111444", text: "+254 119 111 444" },
];

const address = "Juja City Mall, Second Floor, Suite 738";

function CapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 3 1.5 8 12 13l8.2-3.7V14h2V8L12 3z" />
      <path d="M6.2 11.4v3.7c0 1.3 2.5 3.4 5.8 3.4s5.8-2.1 5.8-3.4v-3.7L12 14.2l-5.8-2.8z" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`flex items-center gap-2 ${light ? "text-white" : "text-navy"}`}>
      <CapIcon className="h-8 w-8 shrink-0 text-gold-bright" />
      <span className="leading-none">
        <span className="block text-[1.45rem] font-bold tracking-tight">
          Visa<span className="text-gold-bright">Ed</span>
        </span>
        <span className={`mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.28em] ${light ? "text-white/70" : "text-navy/65"}`}>
          International
        </span>
      </span>
    </span>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 3.5h3.2l1.2 3.2-1.8 1.1a12.5 12.5 0 0 0 5.6 5.6l1.1-1.8 3.2 1.2V16a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5 6.7 2 2 0 0 1 7 3.5z" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function SiteHeader({ user, localMode }: { user: HeaderUser; localMode: boolean }) {
  return (
    <>
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-[0.75rem]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {phones.map((phone) => (
              <a key={phone.href} href={phone.href} className="inline-flex items-center gap-1.5 text-white/90 hover:text-gold-bright">
                <PhoneIcon />
                <span>
                  {phone.label}: {phone.text}
                </span>
              </a>
            ))}
          </div>
          <p className="hidden items-center gap-1.5 text-white/90 sm:inline-flex">
            <PinIcon />
            <span>{address}</span>
          </p>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <SiteNav links={links} user={user} />
        </div>
      </header>
      <div className="bg-gold-bright text-navy">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-2.5 sm:flex-row sm:items-center">
          <p className="text-sm font-medium">
            <span aria-hidden="true">🔥 </span>
            Thinking about funding? Browse checked listings and see the deadline, the award, and when we last verified the facts.
          </p>
          <Link href="/scholarships" className="inline-flex shrink-0 items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep">
            Browse scholarships →
          </Link>
        </div>
      </div>
      {localMode ? (
        <p className="bg-gold-soft px-4 py-2 text-center text-xs font-medium tracking-wide text-gold">
          Local preview. Sample listings are fictional and are not open for application. Database and hosting are not connected yet.
        </p>
      ) : null}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm leading-relaxed text-white/70">
            A staff-checked catalog of scholarship programs. A listing is information, not an award.
          </p>
          <ul className="mt-4 space-y-1.5 text-white/80">
            {phones.map((phone) => (
              <li key={phone.href}>
                <a href={phone.href} className="hover:text-gold-bright">
                  {phone.label}: {phone.text}
                </a>
              </li>
            ))}
            <li>{address}</li>
          </ul>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-white/80">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-bright">Explore</p>
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Legal" className="flex flex-col gap-2 text-white/80">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-bright">Legal</p>
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
        © {new Date().getFullYear()} VisaEd International. Legal name to be confirmed before launch.
      </p>
    </footer>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/254119111444"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with VisaEd on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-12px_rgb(0_0_0_/_0.6)] transition hover:bg-[#1ebe5d]"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.4a10 10 0 0 0 4.65 1.14h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.95c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.15-1.53-1.15-2.92s.73-2.07 1-2.35c.24-.28.64-.41 1.02-.41h.37c.12 0 .28-.04.44.34.16.4.56 1.37.61 1.47.05.1.08.22.02.35-.06.14-.1.22-.19.34-.1.12-.2.26-.29.35-.1.1-.2.2-.08.39.11.19.5.82 1.07 1.33.74.66 1.36.86 1.55.96.19.1.3.08.41-.05.11-.14.48-.56.6-.75.13-.19.25-.16.42-.1.17.06 1.08.51 1.27.6.19.1.31.14.36.22.05.08.05.72-.19 1.4z" />
      </svg>
    </a>
  );
}

export function DraftBanner() {
  return (
    <p className="rounded-2xl border border-gold/30 bg-gold-soft px-4 py-3 text-sm leading-relaxed text-gold">
      Draft for review. This page is not a final privacy notice or contract. Counsel needs to approve it before production, including the legal name, address, and governing law.
    </p>
  );
}
