import { NextResponse } from "next/server";
import { KEYSTATIC_COOKIE, sessionCookie } from "@/lib/admin-auth";

// Posted from the sign-out button in the admin header. Since signing in to
// the site editor is what grants access here, signing out has to clear that
// too — otherwise "sign out" would leave the door open.
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  for (const name of [KEYSTATIC_COOKIE, "keystatic-gh-refresh-token"]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}
