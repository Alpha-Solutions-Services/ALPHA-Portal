import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";
import { getPortalUser } from "@/lib/portal/auth";

export default async function HomePage() {
  const user = await getPortalUser();
  if (!user) redirect("/login");
  if (isAdminUser(user)) redirect("/admin");
  redirect("/dashboard");
}
