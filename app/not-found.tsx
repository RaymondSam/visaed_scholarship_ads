import Link from "next/link";
import { fieldClass, primaryButtonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-[1.75rem] border border-line bg-card p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">404</p>
      <h1 className="mt-3 text-4xl">Page not found</h1>
      <p className="mt-3 text-muted">That address is not a public page. Draft listings stay hidden until they are published.</p>
      <form action="/scholarships" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="missing-q">
          Search scholarships
        </label>
        <input id="missing-q" name="q" placeholder="Search the catalog" className={fieldClass} />
        <button className={primaryButtonClass} type="submit">
          Search
        </button>
      </form>
      <p className="mt-5">
        <Link className="font-semibold text-teal underline decoration-teal/30 underline-offset-4" href="/">
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
