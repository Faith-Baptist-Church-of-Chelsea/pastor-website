// Adds a visitor to the email list (Resend Audience).
// Spam protection: hidden honeypot field + per-IP rate limit — same
// approach as the church site's contact form, no CAPTCHA on purpose.
import { NextResponse } from "next/server";
import { addContact, resendConfigured } from "@/lib/resend";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";

const limited = makeRateLimiter(5, 60 * 60 * 1000); // 5/hour/IP

export async function POST(request: Request) {
  if (!resendConfigured()) {
    return NextResponse.json(
      { error: "The email list isn't set up yet — please email the pastor directly." },
      { status: 503 }
    );
  }
  if (limited(requestIp(request.headers))) {
    return NextResponse.json(
      { error: "Too many attempts — please try again later." },
      { status: 429 }
    );
  }

  let data: { email?: string; name?: string; website?: string };
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // Honeypot: real people never fill the invisible "website" field.
  if (data.website) return NextResponse.json({ ok: true });

  const email = (data.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 }
    );
  }

  try {
    await addContact(email, (data.name ?? "").trim().slice(0, 80));
  } catch (err) {
    console.error("subscribe failed:", err);
    return NextResponse.json(
      { error: "Something went wrong — please try again or email the pastor directly." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
