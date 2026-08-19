import Link from "next/link";
import ScriptureRef from "@/components/ScriptureRef";
import type { Devotion } from "@/lib/db";

export function formatEntryDate(value: string) {
  const iso = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// One shared devotion. Used on the index (linked, trimmed) and on its own
// page (full, unlinked heading).
export default function DevotionCard({
  devotion: d,
  full = false,
}: {
  devotion: Devotion;
  full?: boolean;
}) {
  const trimmed =
    !full && d.reflection.length > 420 ? `${d.reflection.slice(0, 420).trimEnd()}…` : d.reflection;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-semibold text-slate-900">{d.display_name}</span>
        <span className="text-sm text-slate-500">{formatEntryDate(d.entry_date)}</span>
      </div>
      {d.passage && (
        <p className="mt-1 text-sm">
          <ScriptureRef refText={d.passage} />
        </p>
      )}

      <p className="mt-4 whitespace-pre-wrap text-slate-800">{trimmed}</p>

      {!full && d.reflection.length > 420 && d.slug && (
        <Link
          href={`/devotions/${d.slug}`}
          className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
        >
          Read the whole thing →
        </Link>
      )}

      {d.pastor_note && (
        <aside className="mt-5 rounded-lg border-l-4 border-brand-500 bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            A note from Pastor Summers
          </p>
          <p
            className="mt-2 whitespace-pre-wrap italic text-slate-700"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {d.pastor_note}
          </p>
        </aside>
      )}
    </article>
  );
}
