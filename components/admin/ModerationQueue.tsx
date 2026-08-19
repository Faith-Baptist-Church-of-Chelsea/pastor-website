"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Devotion } from "@/lib/db";

// The queue is built around one number: ~75 submissions a week. Everything
// here exists to make a single item take one keystroke — full text visible
// without opening anything, approve/reject from the keyboard, bulk actions
// for the obvious cases, and flagged items sorted to the top.
export default function ModerationQueue({ initial }: { initial: Devotion[] }) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const rowRefs = useRef<Record<number, HTMLElement | null>>({});

  const current = items[cursor];

  const act = useCallback(
    async (action: string, ids: number[], extra: Record<string, unknown> = {}) => {
      if (ids.length === 0) return;
      setBusy(true);
      const res = await fetch("/api/admin/devotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids, ...extra }),
      });
      setBusy(false);
      if (!res.ok) {
        setNote("Something went wrong — nothing was changed.");
        return;
      }
      setItems((prev) => prev.filter((d) => !ids.includes(d.id)));
      setSelected(new Set());
      setEditing(null);
      setCursor((c) => Math.max(0, Math.min(c, items.length - ids.length - 1)));
      setNote(
        action === "approve"
          ? `Published ${ids.length}.`
          : action === "reject"
            ? `Removed ${ids.length} from the queue.`
            : "Done."
      );
    },
    [items.length]
  );

  // Keyboard shortcuts. Disabled while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      const typing =
        el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      if (typing || busy || e.metaKey || e.ctrlKey || e.altKey) return;
      const id = current?.id;
      switch (e.key.toLowerCase()) {
        case "j":
        case "arrowdown":
          e.preventDefault();
          setCursor((c) => Math.min(c + 1, items.length - 1));
          break;
        case "k":
        case "arrowup":
          e.preventDefault();
          setCursor((c) => Math.max(c - 1, 0));
          break;
        case "a":
          if (id) act("approve", [id]);
          break;
        case "r":
          if (id) act("reject", [id]);
          break;
        case "e":
          e.preventDefault();
          if (id) setEditing((cur) => (cur === id ? null : id));
          break;
        case "x":
          e.preventDefault();
          if (id)
            setSelected((prev) => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            });
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, busy, current, items.length]);

  // Keep the highlighted card in view as you move through with j/k.
  useEffect(() => {
    if (current) rowRefs.current[current.id]?.scrollIntoView({ block: "nearest" });
  }, [cursor, current]);

  const selectedIds = useMemo(() => [...selected], [selected]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl">The queue is empty</h2>
        <p className="mt-2 text-slate-600">
          Nothing is waiting for review. {note}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-paper/95 px-4 py-3 backdrop-blur">
        <span className="text-sm font-semibold text-slate-700">
          {items.length} waiting
        </span>
        {selectedIds.length > 0 && (
          <>
            <span className="text-sm text-slate-500">{selectedIds.length} selected</span>
            <button
              onClick={() => act("approve", selectedIds)}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
            >
              Publish selected
            </button>
            <button
              onClick={() => act("reject", selectedIds)}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-500 disabled:opacity-60"
            >
              Discard selected
            </button>
          </>
        )}
        <span className="ml-auto hidden text-xs text-slate-500 sm:block">
          <kbd className="rounded border border-slate-300 px-1">J</kbd>/
          <kbd className="rounded border border-slate-300 px-1">K</kbd> move ·{" "}
          <kbd className="rounded border border-slate-300 px-1">A</kbd> publish ·{" "}
          <kbd className="rounded border border-slate-300 px-1">R</kbd> discard ·{" "}
          <kbd className="rounded border border-slate-300 px-1">E</kbd> edit ·{" "}
          <kbd className="rounded border border-slate-300 px-1">X</kbd> select
        </span>
      </div>

      {note && (
        <p role="status" className="mb-4 text-sm text-brand-700">
          {note}
        </p>
      )}

      <ul className="space-y-4">
        {items.map((d, i) => (
          <li
            key={d.id}
            ref={(el) => {
              rowRefs.current[d.id] = el;
            }}
            onClick={() => setCursor(i)}
            className={`rounded-xl border bg-white p-5 shadow-sm transition-colors ${
              i === cursor ? "border-brand-500 ring-2 ring-brand-500/30" : "border-slate-200"
            }`}
          >
            <DevotionRow
              devotion={d}
              editing={editing === d.id}
              selected={selected.has(d.id)}
              busy={busy}
              onToggleSelect={() =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  next.has(d.id) ? next.delete(d.id) : next.add(d.id);
                  return next;
                })
              }
              onEdit={() => setEditing(editing === d.id ? null : d.id)}
              onApprove={(extra) => act("approve", [d.id], extra)}
              onReject={() => act("reject", [d.id])}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DevotionRow({
  devotion: d,
  editing,
  selected,
  busy,
  onToggleSelect,
  onEdit,
  onApprove,
  onReject,
}: {
  devotion: Devotion;
  editing: boolean;
  selected: boolean;
  busy: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onApprove: (extra?: Record<string, unknown>) => void;
  onReject: () => void;
}) {
  const [reflection, setReflection] = useState(d.reflection);
  const [passage, setPassage] = useState(d.passage);
  const [displayName, setDisplayName] = useState(d.display_name);
  const [pastorNote, setPastorNote] = useState(d.pastor_note ?? "");

  const edits = { reflection, passage, displayName, pastorNote: pastorNote || undefined };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select devotion from ${d.display_name}`}
          className="h-4 w-4"
        />
        <span className="font-semibold text-slate-900">{d.display_name}</span>
        {d.passage && <span className="text-sm text-brand-700">{d.passage}</span>}
        <span className="text-sm text-slate-500">
          {new Date(`${String(d.entry_date).slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {d.flags.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
            ⚑ {d.flags.join(", ")}
          </span>
        )}
        {d.contact_email && (
          <span className="text-xs text-slate-400" title="Given only so they can request removal">
            contact on file
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name shown
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Passage
            <input
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reflection
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={8}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your note (optional — shown set apart from their words)
            <textarea
              value={pastorNote}
              onChange={(e) => setPastorNote(e.target.value)}
              rows={3}
              placeholder="A short comment or a verse of your own…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
            />
          </label>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-slate-800">{d.reflection}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onApprove(editing ? edits : undefined)}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
        >
          Publish
        </button>
        <button
          onClick={onReject}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500 disabled:opacity-60"
        >
          Discard
        </button>
        <button
          onClick={onEdit}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500 disabled:opacity-60"
        >
          {editing ? "Done editing" : "Edit first"}
        </button>
      </div>
    </>
  );
}
