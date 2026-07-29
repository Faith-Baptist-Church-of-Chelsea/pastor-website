// Adds a visitor to the email list (Resend Audience).
// Spam protection: hidden honeypot field + per-IP rate limit — same
// approach as the church site's contact form, no CAPTCHA on purpose.
import { NextResponse } from "next/server";
import { addContact, resendConfigured, sendEmail } from "@/lib/resend";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";
import { getSermons, getSite } from "@/lib/content";

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

  // Welcome email with the latest sermon — best-effort: a failure here
  // must never make the signup look failed.
  try {
    await sendWelcome(email);
  } catch (err) {
    console.error("welcome email failed:", err);
  }
  return NextResponse.json({ ok: true });
}

async function sendWelcome(to: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastor-website-nine.vercel.app";
  const [site, sermons] = await Promise.all([getSite(), getSermons()]);
  const latest = sermons[0];
  await sendEmail({
    to,
    replyTo: site.email,
    subject: "You're on the list — updates from Pastor Adam Summers",
    html: `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
      <h1 style="font-size:22px;">Welcome!</h1>
      <p>You'll now get an email whenever Pastor Summers shares a new sermon,
      blog post, or devotion — usually the morning after it's posted.</p>
      <p style="font-style:italic;color:#475569;">“For to me to live is Christ, and to die is gain.” — Philippians 1:21</p>
      ${
        latest
          ? `<p style="margin-top:20px;"><strong>In the meantime, the latest sermon:</strong><br/>
             <a href="${base}/sermons/${latest.slug}" style="color:#854d0e;font-size:18px;">${latest.title}</a>
             ${latest.passage ? `<br/><span style="color:#64748b;">${latest.passage}</span>` : ""}</p>`
          : ""
      }
      <p style="margin-top:20px;">Prefer podcasts? Add
      <a href="${base}/podcast.xml" style="color:#854d0e;">the sermon feed</a>
      to any podcast app and new preaching arrives automatically.</p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        You're receiving this because you subscribed at ${base.replace("https://", "")}.
        Reply to this email to reach Pastor Summers directly.
      </p>
    </div>`,
  });
}
