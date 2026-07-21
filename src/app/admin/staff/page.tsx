import { redirect } from "next/navigation";
import { isOwnerUser, isPortalStaff } from "@/lib/admin-auth";
import { getPortalUser } from "@/lib/portal/auth";
import { AdminStaffPageClient } from "@/components/admin/AdminStaffPageClient";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const user = await getPortalUser();
  if (!user) redirect("/login?role=admin");
  if (!(await isPortalStaff(user))) redirect("/");
  if (!isOwnerUser(user)) redirect("/admin?tab=staff");

  return (
    <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:p-8">
      <AdminStaffPageClient />
    </div>
  );
}
