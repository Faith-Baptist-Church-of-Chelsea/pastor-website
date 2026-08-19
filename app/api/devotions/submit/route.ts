// Receives one devotion a journaler chose to share.
//
// This is the ONLY path by which journal content reaches the server, and it
// only ever runs because someone tapped Share and confirmed a consent box.
import { NextResponse } from "next/server";
import { sql, dbConfigured } from "@/lib/db";
import { extractBooks } from "@/lib/bible";
import {
  MAX_REFLECTION,
  MIN_REFLECTION,
  fingerprint,
  hashIp,
  screenReflection,
} from "@/lib/devotion-screen";
import { requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_PER_HOUR = 3;
const MAX_PER_DAY = 10;
const MIN_FILL_SECONDS = 3; // a human cannot review and submit faster than this

export async function POST(request: Request) {
  if (!dbConfigured()) {
    return NextResponse.json(
      { error: "Sharing isn't available right now. Please try again later." },
      { status: 503 }
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // --- Silent bot traps: look like success, save nothing. ---
  if (typeof data.website === "string" && data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }
  const openedAt = Number(data.openedAt ?? 0);
  if (openedAt && (Date.now() - openedAt) / 1000 < MIN_FILL_SECONDS) {
    return NextResponse.json({ ok: true });
  }

  // --- Validation ---
  const reflection = String(data.reflection ?? "").trim();
  const passage = String(data.passage ?? "").trim().slice(0, 120);
  const entryDate = String(data.entryDate ?? "").slice(0, 10);
  const displayName = String(data.displayName ?? "Anonymous").trim().slice(0, 60) || "Anonymous";
  const contactEmail = String(data.contactEmail ?? "").trim().slice(0, 200);

  if (data.consent !== true) {
    return NextResponse.json(
      { error: "Please tick the box to confirm you'd like this reviewed for publication." },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return NextResponse.json({ error: "That date doesn't look right." }, { status: 400 });
  }
  if (reflection.length < MIN_REFLECTION) {
    return NextResponse.json(
      { error: `Please write at least ${MIN_REFLECTION} characters so readers get the whole thought.` },
      { status: 400 }
    );
  }
  if (reflection.length > MAX_REFLECTION) {
    return NextResponse.json(
      { error: `Please trim this to ${MAX_REFLECTION} characters or fewer.` },
      { status: 400 }
    );
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }

  const screened = screenReflection(reflection);
  if (screened.blocked) {
    return NextResponse.json({ error: screened.reason }, { status: 400 });
  }
  const flags = [...screened.flags];

  const ipHash = await hashIp(requestIp(request.headers));
  const fp = fingerprint(reflection);

  try {
    // --- Rate limiting, counted in the database so it survives cold starts ---
    const [recent] = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE submitted_at > now() - INTERVAL '1 hour')::int AS hour,
        COUNT(*) FILTER (WHERE submitted_at > now() - INTERVAL '1 day')::int  AS day
      FROM devotions WHERE ip_hash = ${ipHash}`) as { hour: number; day: number }[];
    if (recent.hour >= MAX_PER_HOUR || recent.day >= MAX_PER_DAY) {
      return NextResponse.json(
        { error: "That's a few in a row — please try again a bit later." },
        { status: 429 }
      );
    }

    // --- Near-duplicate detection (exact fingerprint or high similarity) ---
    const dupes = (await sql`
      SELECT 1 FROM devotions
      WHERE fingerprint = ${fp} OR similarity(fingerprint, ${fp}) > 0.8
      LIMIT 1`) as unknown[];
    if (dupes.length > 0) flags.push("possible-duplicate");

    const books = extractBooks(passage);

    const [row] = (await sql`
      INSERT INTO devotions
        (entry_date, passage, books, reflection, display_name, contact_email,
         flags, ip_hash, fingerprint)
      VALUES
        (${entryDate}, ${passage}, ${books}, ${reflection}, ${displayName},
         ${contactEmail || null}, ${flags}, ${ipHash}, ${fp})
      RETURNING id`) as { id: number }[];

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("devotion submit failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving that. Please try again." },
      { status: 500 }
    );
  }
}
