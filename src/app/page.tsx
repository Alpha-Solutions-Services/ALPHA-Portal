import { redirect } from "next/navigation";
import { isPortalStaff } from "@/lib/admin-auth";
import { getPortalUser } from "@/lib/portal/auth";

export default async function HomePage() {
  const user = await getPortalUser();
  if (!user) redirect("/login");
  if (await isPortalStaff(user)) redirect("/admin");
  redirect("/dashboard");
}
