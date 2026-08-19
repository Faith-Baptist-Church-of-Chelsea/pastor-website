"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lookup, type Passage } from "@/lib/journal/kjv";
import {
  emptyEntry,
  getEntry,
  isBlank,
  saveEntry,
  showsAsShared,
  type Entry,
  type Settings,
} from "@/lib/journal/store";

// One day's entry. Saves itself as you type — there is no Save button to
// forget, which matters for something people do half-awake at 6am.
export default function Editor({
  date,
  entry,
  settings,
  suggestion,
  onChange,
  onShare,
}: {
  date: string;
  entry: Entry | undefined;
  settings: Settings;
  suggestion: string[];
  onChange: (entry: Entry) => void;
  onShare: (entry: Entry) => void;
}) {
  const [draft, setDraft] = useState<Entry>(entry ?? emptyEntry(date, settings.mode));
  const [passage, setPassage] = useState<Passage | null>(null);
  const [lookupState, setLookupState] = useState<"idle" | "looking" | "missed">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the stored entry when the DAY changes — deliberately not when the
  // entry object changes, because autosave hands back a new object on every
  // keystroke and resetting on that would wipe the passage as you type.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getEntry(date);
      if (cancelled) return;
      setDraft(stored ?? emptyEntry(date, settings.mode));
      setPassage(null);
      setLookupState("idle");
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, settings.mode]);

  // Debounced autosave. Blank entries are never written, so opening a day
  // and closing it doesn't litter the journal with empties.
  const scheduleSave = useCallback(
    (next: Entry) => {
      setDraft(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        if (isBlank(next) && !next.passage.trim()) return;
        await saveEntry(next);
        setSavedAt(new Date().toISOString());
        onChange(next);
      }, 600);
    },
    [onChange]
  );

  // Pull the scripture text once a reference looks complete.
  useEffect(() => {
    const ref = draft.passage.trim();
    if (!ref) {
      setPassage(null);
      setLookupState("idle");
      return;
    }
    let cancelled = false;
    setLookupState("looking");
    const timer = setTimeout(async () => {
      const found = await lookup(ref).catch(() => null);
      if (cancelled) return;
      setPassage(found);
      setLookupState(found ? "idle" : "missed");
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.passage]);

  const set = (patch: Partial<Entry>) => scheduleSave({ ...draft, ...patch });

  const field =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400";

  return (
    <div>
      {/* Passage */}
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Where you read today</span>
        <input
          value={draft.passage}
          onChange={(e) => set({ passage: e.target.value })}
          placeholder="John 15:1-8"
          inputMode="text"
          autoCapitalize="words"
          className={field}
        />
      </label>

      {suggestion.length > 0 && !draft.passage && (
        <p className="mt-2 text-sm text-slate-600">
          Today&rsquo;s reading:{" "}
          {suggestion.map((s, i) => (
            <span key={s}>
              {i > 0 && " · "}
              <button
                type="button"
                onClick={() => set({ passage: s })}
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                {s}
              </button>
            </span>
          ))}
        </p>
      )}

      {lookupState === "missed" && draft.passage.trim().length > 2 && (
        <p className="mt-2 text-sm text-slate-500">
          Couldn&rsquo;t find that one — no matter, the words above are kept exactly as
          you typed them.
        </p>
      )}

      {passage && (
        <blockquote className="mt-4 max-h-72 overflow-y-auto rounded-xl bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            {passage.reference} (KJV)
          </p>
          <div className="mt-2 space-y-1 text-slate-800">
            {passage.verses.map((v) => (
              <p key={v.n}>
                <span className="mr-1 align-super text-[10px] font-bold text-brand-700">
                  {v.n}
                </span>
                {v.text}
              </p>
            ))}
          </div>
          {passage.truncated && (
            <p className="mt-2 text-xs text-slate-500">
              Showing the first 50 verses — open your Bible for the rest.
            </p>
          )}
        </blockquote>
      )}

      {/* Writing */}
      {draft.mode === "freeform" ? (
        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">What the Lord showed you</span>
          <textarea
            value={draft.freeform}
            onChange={(e) => set({ freeform: e.target.value })}
            rows={12}
            placeholder="Write as much or as little as you like…"
            className={field}
          />
        </label>
      ) : (
        <>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-700">What it says</span>
            <span className="block text-xs text-slate-500">
              What&rsquo;s actually happening in the passage — optional
            </span>
            <textarea
              value={draft.observation}
              onChange={(e) => set({ observation: e.target.value })}
              rows={4}
              className={field}
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-700">
              What I&rsquo;m taking away
            </span>
            <span className="block text-xs text-slate-500">
              The one thing to carry into today
            </span>
            <textarea
              value={draft.application}
              onChange={(e) => set({ application: e.target.value })}
              rows={6}
              className={field}
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-700">Prayer</span>
            <span className="block text-xs text-slate-500">Optional</span>
            <textarea
              value={draft.prayer}
              onChange={(e) => set({ prayer: e.target.value })}
              rows={4}
              className={field}
            />
          </label>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => set({ mode: draft.mode === "soap" ? "freeform" : "soap" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
        >
          {draft.mode === "soap" ? "Switch to one open box" : "Switch to guided prompts"}
        </button>

        <button
          type="button"
          onClick={() => onShare(draft)}
          disabled={isBlank(draft) || showsAsShared(draft)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-40"
        >
          Share this with Pastor Summers
        </button>

        <span className="ml-auto text-xs text-slate-500" aria-live="polite">
          {showsAsShared(draft)
            ? "Sent to Pastor Summers"
            : savedAt
              ? "Saved on this device"
              : ""}
        </span>
      </div>
    </div>
  );
}
