import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/admin-auth";

// Posted from the sign-out button in the admin header.
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  return response;
}
