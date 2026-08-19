// Web Push subscriptions for the optional daily reminder.
//
// Pseudonymous by design: a subscription is tied to the journal's random
// install id, never to a name, an email, or a sync account. The reminder
// itself carries no content — it says "time in the Word", nothing about
// what anyone wrote.
import { NextResponse } from "next/server";
import { sql, dbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Reminders aren't available." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    installId?: string;
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    localTime?: string;      // "06:30" as chosen on the device
    tzOffsetMinutes?: number; // Date.getTimezoneOffset() from the device
  };

  const installId = String(body.installId ?? "");
  if (!UUID_RE.test(installId)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint ?? "";
  const p256dh = sub?.keys?.p256dh ?? "";
  const auth = sub?.keys?.auth ?? "";
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Bad subscription." }, { status: 400 });
  }

  const [h, m] = String(body.localTime ?? "06:30").split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) {
    return NextResponse.json({ error: "Bad time." }, { status: 400 });
  }
  // getTimezoneOffset() is minutes BEHIND UTC, so adding it converts local → UTC.
  const offset = Number(body.tzOffsetMinutes ?? 0);
  const totalUtc = (((h * 60 + m + offset) % 1440) + 1440) % 1440;

  try {
    await sql`
      INSERT INTO push_subs (install_id, endpoint, p256dh, auth, reminder_utc, minute_utc)
      VALUES (${installId}, ${endpoint}, ${p256dh}, ${auth}, ${Math.floor(totalUtc / 60)}, ${totalUtc % 60})
      ON CONFLICT (install_id) DO UPDATE SET
        endpoint = EXCLUDED.endpoint,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        reminder_utc = EXCLUDED.reminder_utc,
        minute_utc = EXCLUDED.minute_utc`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push subscribe failed:", err);
    return NextResponse.json({ error: "Couldn't turn reminders on." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!dbConfigured()) return NextResponse.json({ ok: true });
  const { installId } = (await request.json().catch(() => ({}))) as { installId?: string };
  if (UUID_RE.test(String(installId))) {
    await sql`DELETE FROM push_subs WHERE install_id = ${installId}`;
  }
  return NextResponse.json({ ok: true });
}
