import { NextResponse, type NextRequest } from "next/server";
import { KEYSTATIC_COOKIE, sessionCookie, verifySessionToken } from "@/lib/admin-auth";

// Gate everything under /admin except the sign-in page itself.
//
// Someone already signed in to the site editor with GitHub is sent through
// /api/admin/adopt, which checks their repo access and mints an admin
// session — so editing the site and reviewing devotions are one login.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (await verifySessionToken(request.cookies.get(sessionCookie.name)?.value)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (request.cookies.get(KEYSTATIC_COOKIE)?.value) {
    url.pathname = "/api/admin/adopt";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  url.pathname = "/admin/login";
  url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
