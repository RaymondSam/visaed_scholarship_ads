"use client";

import { useEffect, useState } from "react";
import { PasswordTokenForm } from "@/components/account-forms";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function SupabasePasswordGate({ mode }: { mode: "invite" | "reset" }) {
  const [state, setState] = useState<"checking" | "ready" | "missing">("checking");

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    async function establish() {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        setState(error ? "missing" : "ready");
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setState(data.session ? "ready" : "missing");
    }
    void establish();
  }, []);

  if (state === "checking") return <p className="mt-4 text-muted">Checking the link…</p>;
  if (state === "missing") {
    return <p className="mt-4">This link is not valid. Ask for a new one if it has expired.</p>;
  }
  return <PasswordTokenForm token="session" mode={mode} />;
}
