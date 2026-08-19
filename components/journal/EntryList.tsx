"use client";

import { useMemo, useState } from "react";
import { extractBooks } from "@/lib/bible";
import { shareableText, type Entry } from "@/lib/journal/store";

// Everything written so far, newest first, searchable and filterable.
// All of it runs against the local copy — no request leaves the device.
export default function EntryList({
  entries,
  onOpen,
}: {
  entries: Entry[];
  onOpen: (date: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [book, setBook] = useState("");

  const months = useMemo(
    () => [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort().reverse(),
    [entries]
  );

  const books = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const b of extractBooks(e.passage)) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (month && !e.date.startsWith(month)) return false;
      if (book && !extractBooks(e.passage).includes(book)) return false;
      if (!q) return true;
      return (
        e.passage.toLowerCase().includes(q) ||
        shareableText(e).toLowerCase().includes(q) ||
        e.prayer.toLowerCase().includes(q)
      );
    });
  }, [entries, query, month, book]);

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Nothing written yet. Today is a good place to start.
      </p>
    );
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search everything you've written…"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Filter by month"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Any month</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {new Date(`${m}-01T12:00:00`).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </option>
          ))}
        </select>

        <select
          value={book}
          onChange={(e) => setBook(e.target.value)}
          aria-label="Filter by book of the Bible"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">Any book</option>
          {books.map(([b, n]) => (
            <option key={b} value={b}>
              {b} ({n})
            </option>
          ))}
        </select>

        {(query || month || book) && (
          <button
            onClick={() => {
              setQuery("");
              setMonth("");
              setBook("");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {shown.length} of {entries.length} entries
      </p>

      <ul className="mt-3 space-y-3">
        {shown.map((e) => (
          <li key={e.date}>
            <button
              onClick={() => onOpen(e.date)}
              className="hover-lift block w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold text-slate-900">
                  {new Date(`${e.date}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {e.passage && <span className="text-sm text-brand-700">{e.passage}</span>}
                {e.sharedAt && (
                  <span className="text-xs text-slate-400">shared</span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                {shareableText(e) || e.prayer}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
