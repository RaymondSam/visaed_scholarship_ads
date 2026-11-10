"use client";

import { useEffect, useState } from "react";
import { formatInZone } from "@/lib/domain/time";

export function DeadlineFacts({ iso, timeZone }: { iso: string; timeZone: string }) {
  const [local, setLocal] = useState<string | null>(null);
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setLocal(formatInZone(iso, zone));
  }, [iso]);
  const tile = "rounded-2xl bg-paper px-3 py-2";
  const label = "text-xs font-semibold uppercase tracking-[0.14em] text-muted";
  return (
    <>
      <div className={tile}>
        <dt className={label}>Deadline</dt>
        <dd className="mt-1 leading-snug">{formatInZone(iso, timeZone)}</dd>
      </div>
      {local ? (
        <div className={tile}>
          <dt className={label}>In your timezone</dt>
          <dd className="mt-1 leading-snug">{local}</dd>
        </div>
      ) : null}
    </>
  );
}

export function ShareBar({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // The person dismissed the sheet. Copy remains available.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }
  return (
    <button type="button" onClick={share} className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-teal transition hover:border-teal hover:bg-paper">
      {copied ? "Link copied" : "Share this listing"}
    </button>
  );
}
