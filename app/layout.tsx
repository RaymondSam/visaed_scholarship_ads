import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { SiteFooter, SiteHeader, WhatsAppButton } from "@/components/chrome";
import { currentProfile } from "@/lib/auth/current";
import { isLocalMode, siteUrl } from "@/lib/site";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const display = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-playfair", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Visaed Scholarships", template: "%s — Visaed Scholarships" },
  description: "A staff-checked catalog of scholarship programs, with deadlines, funding, and the date each listing was last verified.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentProfile();
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen antialiased">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader user={user ? { fullName: user.fullName, role: user.role } : null} localMode={isLocalMode()} />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-8 pt-8">
          {children}
        </main>
        <SiteFooter />
        <WhatsAppButton />
      </body>
    </html>
  );
}
