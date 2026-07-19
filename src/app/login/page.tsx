import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { isAdminUser } from "@/lib/admin-auth";
import { getPortalUser } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { role?: string; error?: string };
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
        <p className="fixed bottom-6 text-sm text-red-400">
          Authentication failed. Please try again.
        </p>
      ) : null}
    </main>
  );
}
