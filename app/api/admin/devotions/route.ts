// Moderation actions. Every route here is behind the admin cookie
// (enforced in middleware.ts and re-checked here, so a missing matcher
// can never silently expose it).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { sessionCookie, verifySessionToken } from "@/lib/admin-auth";
import { devotionSlug } from "@/lib/devotion-screen";
import { extractBooks } from "@/lib/bible";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(sessionCookie.name)?.value);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    ids?: number[];
    id?: number;
    reflection?: string;
    passage?: string;
    displayName?: string;
    pastorNote?: string;
  };

  const ids = (body.ids ?? (body.id ? [body.id] : []))
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Nothing selected." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "approve": {
        // Single approvals may carry the pastor's edits; bulk approvals don't.
        if (ids.length === 1 && body.reflection !== undefined) {
          const passage = String(body.passage ?? "").slice(0, 120);
          await sql`
            UPDATE devotions SET
              reflection   = ${String(body.reflection).slice(0, 4000)},
              passage      = ${passage},
              books        = ${extractBooks(passage)},
              display_name = ${String(body.displayName ?? "Anonymous").slice(0, 60)},
              pastor_note  = ${body.pastorNote ? String(body.pastorNote).slice(0, 1000) : null}
            WHERE id = ${ids[0]}`;
        }
        const rows = (await sql`
          UPDATE devotions
          SET status = 'approved', decided_at = now()
          WHERE id = ANY(${ids}) AND status <> 'approved'
          RETURNING id, display_name, entry_date::text AS entry_date`) as {
          id: number;
          display_name: string;
          entry_date: string;
        }[];
        // Slugs are assigned at approval time, from the final display name.
        for (const r of rows) {
          const slug = devotionSlug(r.display_name, r.entry_date.slice(0, 10), r.id);
          await sql`UPDATE devotions SET slug = ${slug} WHERE id = ${r.id}`;
        }
        return NextResponse.json({ ok: true, count: rows.length });
      }

      case "reject": {
        // Silent by design: nothing is sent to the contributor, ever.
        await sql`UPDATE devotions SET status = 'rejected', decided_at = now() WHERE id = ANY(${ids})`;
        return NextResponse.json({ ok: true, count: ids.length });
      }

      case "remove": {
        // Un-publishes something already public — the one-click takedown.
        await sql`UPDATE devotions SET status = 'removed', decided_at = now() WHERE id = ANY(${ids})`;
        return NextResponse.json({ ok: true, count: ids.length });
      }

      case "restore": {
        await sql`UPDATE devotions SET status = 'pending', decided_at = NULL WHERE id = ANY(${ids})`;
        return NextResponse.json({ ok: true, count: ids.length });
      }

      case "save": {
        const passage = String(body.passage ?? "").slice(0, 120);
        await sql`
          UPDATE devotions SET
            reflection   = ${String(body.reflection ?? "").slice(0, 4000)},
            passage      = ${passage},
            books        = ${extractBooks(passage)},
            display_name = ${String(body.displayName ?? "Anonymous").slice(0, 60)},
            pastor_note  = ${body.pastorNote ? String(body.pastorNote).slice(0, 1000) : null}
          WHERE id = ${ids[0]}`;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("moderation action failed:", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}
