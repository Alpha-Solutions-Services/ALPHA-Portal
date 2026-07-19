import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

/**
 * Completes Google (and other) OAuth. Cookies must be written onto the
 * redirect Response or the session is lost and users bounce back to /login.
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDesc = searchParams.get("error_description");
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";
  const nextWantsAdmin = next === "/admin" || next.startsWith("/admin/");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin =
    process.env.NODE_ENV === "development"
      ? new URL(request.url).origin
      : forwardedHost
        ? `${proto}://${forwardedHost}`
        : new URL(request.url).origin;

  const loginFail = (reason?: string) => {
    const q = new URLSearchParams();
    q.set("error", "auth");
    if (nextWantsAdmin) q.set("role", "admin");
    if (reason) q.set("reason", reason.slice(0, 180));
    return NextResponse.redirect(`${origin}/login?${q.toString()}`);
  };

  if (oauthError) {
    return loginFail(oauthDesc || oauthError);
  }

  if (!url || !anon || !code) {
    return loginFail(!code ? "missing_code" : "missing_supabase_env");
  }

  let destination = next;
  let response = NextResponse.redirect(`${origin}${destination}`);

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.redirect(`${origin}${destination}`);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession", error.message);
    return loginFail(error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = isAllowedAdminEmail(user?.email);

  if (nextWantsAdmin && !isAdmin) {
    await supabase.auth.signOut();
    return loginFail("not_admin");
  }

  if (isAdmin && (nextWantsAdmin || next === "/dashboard")) {
    destination = "/admin";
  } else {
    destination = next;
  }

  // Rebuild redirect to final destination, keep session cookies (incl. options)
  const sessionCookies = response.cookies.getAll();
  response = NextResponse.redirect(`${origin}${destination}`);
  sessionCookies.forEach((c) => {
    response.cookies.set(c);
  });

  return response;
}
