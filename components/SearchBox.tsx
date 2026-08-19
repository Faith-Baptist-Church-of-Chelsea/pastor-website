"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type SearchEntry = {
  type: string; // "Sermon" | "Blog post" | "Devotion" | "Music"
  title: string;
  text: string; // searchable body text (not shown in full)
  url: string;
  meta: string; // date / passage line shown under the title
};

// Instant client-side search — the whole site's text arrives with the
// page (it's small), so results appear as you type with no server calls.
export default function SearchBox({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [devotions, setDevotions] = useState<SearchEntry[]>([]);

  // Devotions are searched on the server (there can be thousands of them),
  // debounced, and merged into the same result list.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setDevotions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/devotions?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const body = await res.json();
        setDevotions(body.results ?? []);
      } catch {
        // Aborted or offline — the local results still stand.
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const localResults = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    if (words.length === 0) return [];
    return entries
      .map((e) => {
        const title = e.title.toLowerCase();
        const text = e.text.toLowerCase();
        let score = 0;
        for (const w of words) {
          if (title.includes(w)) score += 10;
          else if (text.includes(w)) score += 1;
          else return null; // every word must match somewhere
        }
        return { e, score };
      })
      .filter((r): r is { e: SearchEntry; score: number } => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((r) => r.e);
  }, [query, entries]);

  // Site content first, then the community devotions.
  const results = useMemo(
    () => [...localResults, ...devotions],
    [localResults, devotions]
  );

  return (
    <div>
      <label htmlFor="site-search" className="sr-only">
        Search sermons, posts, devotions, and music
      </label>
      <input
        id="site-search"
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try “antichrist”, “music”, or “Philippians”…"
        className="w-full rounded-xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm placeholder:text-slate-400"
      />
      {query && (
        <p className="mt-4 text-sm text-slate-500" role="status">
          {results.length === 0
            ? "Nothing found — try a different word."
            : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={r.url + r.title}>
            <Link
              href={r.url}
              className="hover-lift block rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                {r.type}
              </span>
              <span className="mt-1 block text-lg font-semibold text-slate-900">
                {r.title}
              </span>
              {r.meta && <span className="mt-1 block text-sm text-slate-500">{r.meta}</span>}
              {snippet(r.text, query) && (
                <span className="mt-2 block text-sm text-slate-600">
                  …{snippet(r.text, query)}…
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A little context around the first matching word. */
function snippet(text: string, query: string): string {
  const word = query.toLowerCase().split(/\s+/).find((w) => w.length > 1);
  if (!word) return "";
  const i = text.toLowerCase().indexOf(word);
  if (i < 0) return "";
  return text.slice(Math.max(0, i - 60), i + 90).replace(/\s+/g, " ").trim();
}
