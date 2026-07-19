import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { isAdminUser } from "@/lib/admin-auth";
import { getPortalUser } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { role?: string; error?: string; reason?: string };
}) {
  const user = await getPortalUser();
  if (user) {
    redirect(isAdminUser(user) ? "/admin" : "/dashboard");
  }
  const isAdmin = searchParams.role === "admin";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(56,163,255,0.12),_transparent_55%)] px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm defaultAdmin={isAdmin} />
      </Suspense>
      {searchParams.error ? (
        <p className="fixed bottom-6 max-w-lg px-4 text-center text-sm text-red-400">
          Authentication failed
          {searchParams.reason ? `: ${searchParams.reason}` : ""}. Try again, or
          check Supabase Redirect URLs include this portal.
        </p>
      ) : null}
    </main>
  );
}
