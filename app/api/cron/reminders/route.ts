// Sends the daily reminder to anyone whose chosen time has just come round.
//
// Called hourly (see .github/workflows/reminders.yml). Vercel's Hobby plan
// only allows daily crons, so the hourly tick comes from GitHub Actions
// instead — the endpoint is protected by CRON_SECRET either way and is
// safe to call more often than needed: last_sent_on keeps it to one
// notification per install per day.
import { NextResponse } from "next/server";
import webpush from "web-push";
import { sql, dbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!dbConfigured() || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ skipped: "push not configured" });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:pastorsummers@icloud.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const now = new Date();
  const hour = now.getUTCHours();
  const today = now.toISOString().slice(0, 10);

  // Anyone whose reminder hour is this hour and who hasn't been nudged today.
  const subs = (await sql`
    SELECT install_id, endpoint, p256dh, auth
    FROM push_subs
    WHERE reminder_utc = ${hour}
      AND (last_sent_on IS NULL OR last_sent_on < ${today}::date)`) as {
    install_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }[];

  const payload = JSON.stringify({
    title: "Time in the Word",
    body: "Today's page is waiting whenever you are.",
  });

  let sent = 0;
  let dropped = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      await sql`UPDATE push_subs SET last_sent_on = ${today}::date WHERE install_id = ${s.install_id}`;
      sent++;
    } catch (err) {
      // 404/410 means the browser threw the subscription away — stop trying.
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await sql`DELETE FROM push_subs WHERE install_id = ${s.install_id}`;
        dropped++;
      } else {
        console.error("push send failed:", status ?? err);
      }
    }
  }

  return NextResponse.json({ hour, considered: subs.length, sent, dropped });
}
