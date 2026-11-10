"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-xl rounded-[1.75rem] border border-line bg-card p-8">
      <h1 className="text-4xl">Something went wrong</h1>
      <p className="mt-3 text-muted">The page could not be loaded. Try again, or come back to the catalog.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/scholarships" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
          Browse scholarships
        </Link>
      </div>
    </div>
  );
}
