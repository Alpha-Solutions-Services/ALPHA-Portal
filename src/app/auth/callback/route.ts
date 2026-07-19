import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";
  const nextWantsAdmin = next === "/admin" || next.startsWith("/admin/");

  if (!url || !anon || !code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth${nextWantsAdmin ? "&role=admin" : ""}`
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=auth${nextWantsAdmin ? "&role=admin" : ""}`
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;
  const isAdmin = isAllowedAdminEmail(user?.email);

  if (nextWantsAdmin && !isAdmin) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?role=admin&error=auth`);
  }

  if (isAdmin && (nextWantsAdmin || next === "/dashboard")) {
    return NextResponse.redirect(`${origin}/admin`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
