import { redirect } from "next/navigation";
import { ResponsiveDashboardShell } from "@/components/layout/ResponsiveDashboardShell";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { isAdminUser } from "@/lib/admin-auth";
import { getPortalUser } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/login?role=admin");
  if (!isAdminUser(user)) redirect("/");

  return (
    <ResponsiveDashboardShell
      mobileTitle="Admin"
      sidebar={<AdminSidebar email={user.email} />}
    >
      {children}
    </ResponsiveDashboardShell>
  );
}
