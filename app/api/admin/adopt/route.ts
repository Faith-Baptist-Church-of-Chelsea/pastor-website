// Turns an existing Keystatic GitHub sign-in into an admin session.
//
// This is what makes it one login instead of two: sign in once at
// /keystatic to edit the site, and the devotion queue recognises you
// without asking for anything else. Verified against GitHub each time a
// session is minted, so removing someone's repo access removes their
// access here too.
import { NextResponse } from "next/server";
import {
  KEYSTATIC_COOKIE,
  createSessionToken,
  githubUserCanWrite,
  sessionCookie,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/admin";
  // Only ever bounce back to our own admin area.
  const target = next.startsWith("/admin") ? next : "/admin";

  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${KEYSTATIC_COOKIE}=`))
    ?.slice(KEYSTATIC_COOKIE.length + 1);

  if (!token || !(await githubUserCanWrite(decodeURIComponent(token)))) {
    return NextResponse.redirect(new URL("/admin/login?from=github", request.url));
  }

  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(sessionCookie.name, await createSessionToken(), sessionCookie.options);
  return response;
}
