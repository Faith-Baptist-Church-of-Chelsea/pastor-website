import { NextResponse } from "next/server";
import {
  adminConfigured,
  createSessionToken,
  passwordMatches,
  sessionCookie,
} from "@/lib/admin-auth";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Slow down password guessing.
const limited = makeRateLimiter(10, 15 * 60 * 1000);

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD isn't set on the server yet." },
      { status: 503 }
    );
  }
  if (limited(requestIp(request.headers))) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!passwordMatches(String(password ?? ""))) {
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, await createSessionToken(), sessionCookie.options);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  return response;
}
