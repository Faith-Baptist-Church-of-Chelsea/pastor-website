// Anonymous "someone journaled today" counter.
//
// The ENTIRE payload is a random install id and a date. No entry text, no
// passage, no name, no email, no account. The install id is generated on
// the device, is not derived from anything, and is never joined to anything
// else. Journalers can switch this off in settings.
import { NextResponse } from "next/server";
import { sql, dbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!dbConfigured()) return NextResponse.json({ ok: true });

  let data: { installId?: string; date?: string };
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const installId = String(data.installId ?? "");
  const date = String(data.date ?? "").slice(0, 10);
  if (!UUID_RE.test(installId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sql`
      INSERT INTO journal_pings (install_id, ping_date)
      VALUES (${installId}, ${date})
      ON CONFLICT DO NOTHING`;
  } catch (err) {
    // Never let a stats failure surface to someone writing a devotion.
    console.error("ping failed:", err);
  }
  return NextResponse.json({ ok: true });
}
