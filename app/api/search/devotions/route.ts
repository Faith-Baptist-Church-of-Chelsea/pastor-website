// Server-side search over published devotions.
//
// Sermons, posts and music are few enough to search in the browser, but
// devotions grow without limit — so they're queried here instead of being
// shipped to every visitor.
import { NextResponse } from "next/server";
import { dbConfigured, searchPublishedDevotions } from "@/lib/db";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!dbConfigured() || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const rows = await searchPublishedDevotions(q.slice(0, 80));
    return NextResponse.json({
      results: rows.map((r) => ({
        type: "Devotion",
        title: `${r.passage || "Devotion"} — ${r.display_name}`,
        text: r.reflection,
        url: `/devotions/${r.slug}`,
        meta: String(r.entry_date).slice(0, 10),
      })),
    });
  } catch (err) {
    console.error("devotion search failed:", err);
    return NextResponse.json({ results: [] });
  }
}
