// One email a day telling the pastor what's waiting — never one per
// submission. Nothing is sent on days with an empty queue.
import "server-only";
import { getPendingDevotions } from "@/lib/db";
import { renderEmail } from "@/lib/email-template";
import { sendEmail } from "@/lib/resend";

export async function sendDevotionDigest(): Promise<
  { sent: false; reason: string } | { sent: true; count: number }
> {
  const to = process.env.DEVOTION_NOTIFY_EMAIL;
  if (!to) return { sent: false, reason: "DEVOTION_NOTIFY_EMAIL not set" };
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: "Resend not configured" };

  const pending = await getPendingDevotions();
  if (pending.length === 0) return { sent: false, reason: "queue empty" };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";
  const flagged = pending.filter((d) => d.flags.length > 0).length;

  await sendEmail({
    to,
    subject: `${pending.length} new devotion${pending.length === 1 ? "" : "s"} awaiting review`,
    html: renderEmail({
      preheader: `${pending.length} waiting${flagged ? `, ${flagged} flagged for a closer look` : ""}.`,
      heading: `${pending.length} waiting for you`,
      intro: `People have shared devotions from their own reading${
        flagged
          ? `. ${flagged} ${flagged === 1 ? "is" : "are"} flagged for a closer look and ${flagged === 1 ? "sits" : "sit"} at the top of the queue`
          : ""
      }. Here's the start of each one:`,
      items: pending.slice(0, 25).map((d) => ({
        kind: `${d.display_name}${d.passage ? ` · ${d.passage}` : ""}${
          d.flags.length ? ` · ⚑ ${d.flags.join(", ")}` : ""
        }`,
        title: firstLines(d.reflection),
        url: `${base}/admin`,
      })),
      cta: { label: "Open the review queue", url: `${base}/admin` },
      footerNote:
        pending.length > 25
          ? `Showing the first 25 of ${pending.length}. Sent once a day, only when something is waiting.`
          : "Sent once a day, only when something is waiting.",
    }),
  });

  return { sent: true, count: pending.length };
}

/** Enough of the reflection to triage without opening anything. */
function firstLines(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? `${clean.slice(0, 160).trimEnd()}…` : clean;
}
