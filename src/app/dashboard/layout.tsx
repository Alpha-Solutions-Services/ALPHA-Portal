import { redirect } from "next/navigation";
import { ResponsiveDashboardShell } from "@/components/layout/ResponsiveDashboardShell";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { isAdminUser } from "@/lib/admin-auth";
import { getPortalUser, portalDisplayName } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/login");
  if (isAdminUser(user)) redirect("/admin");

  return (
    <ResponsiveDashboardShell
      mobileTitle="Client portal"
      sidebar={
        <PortalSidebar
          displayName={portalDisplayName(user)}
          email={user.email}
        />
      }
    >
      {children}
    </ResponsiveDashboardShell>
  );
}
