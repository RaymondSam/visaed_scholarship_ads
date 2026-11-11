export const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-normal text-ink shadow-sm outline-none transition placeholder:text-muted/70 focus:border-navy focus:ring-4 focus:ring-navy/10";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-gold-bright px-5 py-2.5 text-sm font-semibold text-navy shadow-[0_10px_24px_-16px_rgb(12_30_70)] transition hover:bg-gold-deep disabled:opacity-60";

export const lightButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-soft";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-line bg-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-navy hover:text-navy";

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p> : null}
      <h1 className="mt-3 text-4xl leading-[1.05] text-ink md:text-5xl">{title}</h1>
      {lede ? <p className="mt-4 text-lg leading-relaxed text-muted">{lede}</p> : null}
    </header>
  );
}
