"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveEntry, shareableText, type Entry } from "@/lib/journal/store";

const MIN = 150;
const MAX = 1500;

// Sharing is deliberately a separate, explicit step: this screen shows
// exactly what would leave the device, lets every word of it be changed
// first, and sends only this one entry. Nothing else in the journal is
// ever transmitted.
export default function ShareDialog({
  entry,
  onClose,
  onShared,
}: {
  entry: Entry;
  onClose: () => void;
  onShared: (entry: Entry) => void;
}) {
  const [reflection, setReflection] = useState(shareableText(entry));
  const [nameMode, setNameMode] = useState<"first" | "initials" | "anon">("first");
  const [nameValue, setNameValue] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const openedAt = useRef(Date.now());
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const displayName = useMemo(() => {
    const clean = nameValue.trim();
    if (nameMode === "anon" || !clean) return "Anonymous";
    if (nameMode === "initials") {
      return (
        clean
          .split(/\s+/)
          .map((p) => p[0]?.toUpperCase())
          .filter(Boolean)
          .join(".") + "."
      );
    }
    return clean.split(/\s+/)[0];
  }, [nameMode, nameValue]);

  const count = reflection.trim().length;
  const tooShort = count < MIN;
  const tooLong = count > MAX;

  async function submit() {
    if (!consent) return setError("Please tick the box below so I know you'd like this considered.");
    if (tooShort) return setError(`Please write at least ${MIN} characters — that's about a paragraph.`);
    if (tooLong) return setError(`Please trim this to ${MAX} characters or fewer.`);

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/devotions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate: entry.date,
          passage: entry.passage,
          reflection: reflection.trim(),
          displayName,
          contactEmail: email.trim(),
          consent: true,
          openedAt: openedAt.current,
          website: "", // honeypot, always empty for real people
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "That didn't go through. Please try again.");
        setBusy(false);
        return;
      }
      const updated = { ...entry, sharedAt: new Date().toISOString() };
      await saveEntry(updated);
      onShared(updated);
    } catch {
      setError("No connection right now — try again once you're back online.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        tabIndex={-1}
        className="mx-auto my-8 max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="share-title" className="text-2xl">
          Share this one entry
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Only what you see here is sent — this single entry, nothing else from
          your journal. Pastor Summers reads it before anything is published.
        </p>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-700">Passage</span>
          <input
            value={entry.passage}
            readOnly
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">
            What you&rsquo;d like to share
          </span>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={10}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
          />
        </label>
        <p
          className={`mt-1 text-right text-xs ${
            tooLong || (tooShort && count > 0) ? "text-red-700" : "text-slate-500"
          }`}
          aria-live="polite"
        >
          {count} / {MAX}
          {tooShort && count > 0 && ` — ${MIN - count} more to go`}
        </p>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-slate-700">Shown as</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ["first", "First name"],
              ["initials", "Initials"],
              ["anon", "Anonymous"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setNameMode(value)}
                aria-pressed={nameMode === value}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  nameMode === value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 text-slate-700 hover:border-brand-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {nameMode !== "anon" && (
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Your name"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
            />
          )}
          <p className="mt-2 text-xs text-slate-500">
            Will appear as <strong>{displayName}</strong>
          </p>
        </fieldset>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">
            Your email <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <span className="block text-xs text-slate-500">
            Kept only so you can ask for this to be taken down later. Never shown
            publicly, and you won&rsquo;t be emailed either way.
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
          />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-lg bg-paper p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span className="text-sm text-slate-700">
            I understand this will be reviewed by Pastor Summers, and if he
            publishes it, it will appear publicly on this website where anyone —
            including search engines — can read it.
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={submit}
            disabled={busy || !consent}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send for review"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:border-slate-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
