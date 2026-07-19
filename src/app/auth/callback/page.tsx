"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const supabase = createClient();
      if (!supabase) {
        window.location.replace(
          "/login?error=auth&reason=missing_supabase_env"
        );
        return;
      }

      const code = searchParams.get("code");
      const oauthError = searchParams.get("error");
      const oauthDesc = searchParams.get("error_description");
      let next = "/dashboard";
      try {
        const stored = sessionStorage.getItem("portal_oauth_next");
        if (stored && stored.startsWith("/") && !stored.startsWith("//")) {
          next = stored;
        }
        sessionStorage.removeItem("portal_oauth_next");
      } catch {
        /* ignore */
      }
      const fromQuery = searchParams.get("next");
      if (fromQuery && fromQuery.startsWith("/") && !fromQuery.startsWith("//")) {
        next = fromQuery;
      }
      const nextWantsAdmin = next === "/admin" || next.startsWith("/admin/");

      if (oauthError) {
        window.location.replace(
          `/login?error=auth&reason=${encodeURIComponent(oauthDesc || oauthError)}`
        );
        return;
      }

      // Browser holds the PKCE verifier — exchange must run client-side.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback]", error.message);
          window.location.replace(
            `/login?error=auth&reason=${encodeURIComponent(error.message)}`
          );
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          window.location.replace("/login?error=auth&reason=missing_code");
          return;
        }
      }

      if (cancelled) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/login?error=auth&reason=no_user");
        return;
      }

      const isAdmin = isAllowedAdminEmail(user.email);
      if (nextWantsAdmin && !isAdmin) {
        await supabase.auth.signOut();
        window.location.replace(
          "/login?role=admin&error=auth&reason=not_admin"
        );
        return;
      }

      const dest =
        isAdmin && (nextWantsAdmin || next === "/dashboard")
          ? "/admin"
          : next;

      setMessage("Success — redirecting…");
      window.location.replace(dest);
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg)] px-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
          <p className="text-sm text-[var(--color-muted)]">Signing you in…</p>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
