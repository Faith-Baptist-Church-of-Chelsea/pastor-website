// Daily announcement email (Vercel Cron, see vercel.json).
//
// Finds sermons, blog posts, and devotions dated within the last 14 days
// that haven't been emailed about yet, and sends ONE digest broadcast to
// the Resend audience. "Already announced" is remembered in the names of
// past broadcasts (announced[key,key,...]), so no database is needed.
// Safe to re-run: every run re-reads that history first.
import { NextResponse } from "next/server";
import { getDevotions, getPosts, getSermons } from "@/lib/content";
import { broadcastNames, resendConfigured, sendBroadcast } from "@/lib/resend";
import { renderEmail } from "@/lib/email-template";

export const dynamic = "force-dynamic";

type Item = { key: string; kind: string; title: string; date: string; url: string };

export async function GET(request: Request) {
  // Vercel Cron authenticates with the CRON_SECRET env var.
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!resendConfigured()) {
    return NextResponse.json({ skipped: "Resend not configured" });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastor-website-nine.vercel.app";
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [sermons, posts, devotions] = await Promise.all([
    getSermons(),
    getPosts(),
    getDevotions(),
  ]);

  const recent: Item[] = [
    ...sermons.map((s) => ({
      key: `sermon:${s.slug}`, kind: "New sermon", title: s.title, date: s.date,
      url: `${base}/sermons/${s.slug}`,
    })),
    ...posts.map((p) => ({
      key: `post:${p.slug}`, kind: "From the Pastor's Desk", title: p.title, date: p.date,
      url: `${base}/pastors-desk/${p.slug}`,
    })),
    ...devotions.map((d) => ({
      key: `devotion:${d.slug}`, kind: "New devotion", title: d.title, date: d.date,
      url: `${base}/devotions`,
    })),
  ].filter((i) => i.date && i.date >= cutoff);

  if (recent.length === 0) return NextResponse.json({ sent: false, reason: "nothing recent" });

  const announced = (await broadcastNames())
    .filter((n) => n.startsWith("announced["))
    .flatMap((n) => n.slice("announced[".length, -1).split(","));
  const fresh = recent.filter((i) => !announced.includes(i.key));
  if (fresh.length === 0) return NextResponse.json({ sent: false, reason: "all announced" });

  const subject =
    fresh.length === 1
      ? `${fresh[0].kind}: ${fresh[0].title}`
      : `New from Pastor Summers — ${fresh.map((i) => i.title).join(", ").slice(0, 80)}…`;

  const html = renderEmail({
    preheader: fresh.map((i) => i.title).join(" · ").slice(0, 120),
    heading: fresh.length === 1 ? "Something new for you" : "New this week",
    intro: `Pastor Summers has shared ${
      fresh.length === 1 ? "something new" : "a few new things"
    } — here ${fresh.length === 1 ? "it is" : "they are"}:`,
    items: fresh.map((i) => ({
      kind: i.kind,
      title: i.title,
      url: i.url,
      detail: undefined,
    })),
    cta: { label: "Visit the Website", url: base },
    footerNote: `You're receiving this because you subscribed to updates
      from Pastor Adam Summers.
      <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#9ca3af;">Unsubscribe</a>`,
  });

  const name = `announced[${fresh.map((i) => i.key).join(",")}]`;
  const id = await sendBroadcast({ name, subject, html });
  return NextResponse.json({ sent: true, broadcast: id, items: fresh.map((i) => i.key) });
}
