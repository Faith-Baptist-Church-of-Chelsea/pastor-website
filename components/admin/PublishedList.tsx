"use client";

import { useState } from "react";
import type { Devotion } from "@/lib/db";

export default function PublishedList({ initial }: { initial: Devotion[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function takeDown(id: number) {
    setBusy(true);
    const res = await fetch("/api/admin/devotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", ids: [id] }),
    });
    setBusy(false);
    if (res.ok) setItems((prev) => prev.filter((d) => d.id !== id));
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
        Nothing published yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((d) => (
        <li
          key={d.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">{d.display_name}</span>
              {d.passage && <span className="text-sm text-brand-700">{d.passage}</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{d.reflection}</p>
          </div>
          <a
            href={`/devotions/${d.slug}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-500"
          >
            View
          </a>
          <button
            onClick={() => takeDown(d.id)}
            disabled={busy}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:border-red-500 disabled:opacity-60"
          >
            Take down
          </button>
        </li>
      ))}
    </ul>
  );
}
