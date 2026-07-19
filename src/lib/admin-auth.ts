import type { User } from "@supabase/supabase-js";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

export function isAdminUser(user: User | null): boolean {
  return isAllowedAdminEmail(user?.email);
}
