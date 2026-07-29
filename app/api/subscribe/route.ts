// Adds a visitor to the email list (Resend Audience).
// Spam protection: hidden honeypot field + per-IP rate limit — same
// approach as the church site's contact form, no CAPTCHA on purpose.
import { NextResponse } from "next/server";
import { addContact, resendConfigured, sendEmail } from "@/lib/resend";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";
import { getSermons, getSite } from "@/lib/content";
import { renderEmail } from "@/lib/email-template";

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
    html: renderEmail({
      preheader: "New sermons, blog posts, and music — straight to your inbox.",
      heading: "Welcome — you're on the list!",
      intro: `You'll now get an email whenever Pastor Summers shares a new
        sermon, blog post, or devotion — usually the morning after it's
        posted. Prefer podcasts? <a href="${base}/podcast.xml"
        style="color:#a16207;">Add the sermon feed</a> to any podcast app
        and new preaching arrives automatically.`,
      items: latest
        ? [
            {
              kind: "In the meantime — the latest sermon",
              title: latest.title,
              url: `${base}/sermons/${latest.slug}`,
              detail: latest.passage || undefined,
            },
          ]
        : [],
      cta: latest
        ? { label: "Listen to the Sermon", url: `${base}/sermons/${latest.slug}` }
        : { label: "Visit the Website", url: base },
      footerNote: `You're receiving this because you subscribed at
        ${base.replace("https://", "")}.<br/>Reply to this email to reach
        Pastor Summers directly.`,
    }),
  });
}
