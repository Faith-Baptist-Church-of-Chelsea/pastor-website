"use client";

import { useMemo, useState } from "react";
import SermonCard, { type SermonCardData } from "@/components/SermonCard";

// Sermons index with Bible-book filter chips. Client component so the
// filter is instant; the sermon data arrives fully rendered from the server.
export default function SermonList({ sermons }: { sermons: SermonCardData[] }) {
  const [book, setBook] = useState<string | null>(null);

  const books = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sermons) for (const b of s.books) counts.set(b, (counts.get(b) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sermons]);

  const shown = book ? sermons.filter((s) => s.books.includes(book)) : sermons;

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-700"
    }`;

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter sermons by Bible book">
        <button type="button" onClick={() => setBook(null)} className={chip(book === null)}>
          All ({sermons.length})
        </button>
        {books.map(([b, count]) => (
          <button key={b} type="button" onClick={() => setBook(book === b ? null : b)} className={chip(book === b)}>
            {b} ({count})
          </button>
        ))}
      </div>
      <div className="space-y-8">
        {shown.map((s) => (
          <SermonCard key={s.slug} sermon={s} />
        ))}
      </div>
    </div>
  );
}
