"use client";

import { useRef, useState } from "react";
import { PLANS, type PlanId } from "@/lib/journal/plans";
import {
  exportBackup,
  importBackup,
  saveSettings,
  todayISO,
  type Settings,
} from "@/lib/journal/store";
import { login, register, syncNow } from "@/lib/journal/sync";

export default function SettingsPanel({
  settings,
  onSettings,
  onReload,
  onShowInstall,
}: {
  settings: Settings;
  onSettings: (s: Settings) => void;
  onReload: () => void;
  onShowInstall: () => void;
}) {
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const update = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    await saveSettings(next);
    onSettings(next);
  };

  async function download() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devotion-journal-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await update({ lastExportPrompt: todayISO() });
    setNote(`Saved ${backup.entries.length} entries to your downloads.`);
  }

  async function restore(file: File) {
    try {
      const result = await importBackup(JSON.parse(await file.text()));
      setNote(
        `Added ${result.added}, updated ${result.updated}, left ${result.skipped} alone. Nothing was overwritten with older text.`
      );
      onReload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "That file couldn't be read.");
    }
  }

  return (
    <div className="space-y-8">
      {note && (
        <p role="status" className="rounded-lg bg-paper p-3 text-sm text-brand-700">
          {note}
        </p>
      )}

      <Section title="How you write">
        <div className="flex flex-wrap gap-2">
          {(["soap", "freeform"] as const).map((m) => (
            <button
              key={m}
              onClick={() => update({ mode: m })}
              aria-pressed={settings.mode === m}
              className={chip(settings.mode === m)}
            >
              {m === "soap" ? "Guided prompts" : "One open box"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Guided gives you three short prompts. Open is a single blank space.
        </p>
      </Section>

      <Section title="Reading plan">
        <div className="space-y-2">
          {PLANS.map((p) => (
            <label
              key={p.id}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                settings.plan === p.id ? "border-brand-600 bg-paper" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="plan"
                checked={settings.plan === p.id}
                onChange={() =>
                  update({
                    plan: p.id as PlanId,
                    planStart: p.id === "none" ? undefined : settings.planStart ?? todayISO(),
                  })
                }
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-slate-900">{p.name}</span>
                <span className="block text-sm text-slate-600">{p.description}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          A plan only fills in the passage box for you. Switching or stopping never
          touches anything you&rsquo;ve written.
        </p>
      </Section>

      <ReminderSection settings={settings} onUpdate={update} setNote={setNote} />

      <Section title="Keeping a copy">
        <p className="text-sm text-slate-600">
          Your journal lives on this device. If you clear your browser data or lose
          the phone, it&rsquo;s gone — so save a copy now and then.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={download} className={primaryBtn}>
            Save all my entries to a file
          </button>
          <button onClick={() => fileRef.current?.click()} className={secondaryBtn}>
            Restore from a file
          </button>
          <a href="/journal/standalone" className={secondaryBtn} download>
            Download a standalone copy
          </a>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) restore(f);
            e.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-slate-500">
          The standalone copy is a single file you can keep on a computer and open
          with no internet at all. It reads and writes the same backup format.
        </p>
      </Section>

      <SyncSection setNote={setNote} onReload={onReload} />

      <Section title="Privacy">
        <p className="text-sm text-slate-700">
          Everything you write stays on this device. It is not sent anywhere, and
          neither the church nor Pastor Summers can read it. The only thing that
          ever leaves is an entry you deliberately choose to share, and only after
          you tick the box confirming it.
        </p>
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            checked={!settings.statsOptOut}
            onChange={(e) => update({ statsOptOut: !e.target.checked })}
            className="mt-1 h-4 w-4"
          />
          <span className="text-sm text-slate-700">
            Count me in the anonymous total of people journaling.
            <span className="block text-xs text-slate-500">
              Sends a random ID and today&rsquo;s date — never a word of what you
              wrote, never your name or email. It lets Pastor Summers see whether
              this is helping anyone.
            </span>
          </span>
        </label>
      </Section>

      <Section title="This app">
        <button onClick={onShowInstall} className={secondaryBtn}>
          Add to my home screen
        </button>
      </Section>
    </div>
  );
}

function ReminderSection({
  settings,
  onUpdate,
  setNote,
}: {
  settings: Settings;
  onUpdate: (p: Partial<Settings>) => Promise<void>;
  setNote: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [time, setTime] = useState(settings.reminderTime ?? "06:30");
  const supported =
    typeof window !== "undefined" && "Notification" in window && "PushManager" in window;

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNote("Notifications are switched off for this app in your device settings.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        }));
      const res = await fetch("/api/journal/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installId: settings.installId,
          subscription: sub.toJSON(),
          localTime: time,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        }),
      });
      if (!res.ok) throw new Error();
      await onUpdate({ reminderTime: time });
      setNote(`Reminder set for ${time} each day.`);
    } catch {
      setNote("Couldn't turn the reminder on. You can try again any time.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
    await fetch("/api/journal/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installId: settings.installId }),
    });
    await onUpdate({ reminderTime: undefined });
    setNote("Reminder switched off.");
    setBusy(false);
  }

  return (
    <Section title="Daily reminder">
      {!supported ? (
        <p className="text-sm text-slate-600">
          This browser can&rsquo;t send reminders. On an iPhone, add the journal to
          your home screen first — reminders work once it&rsquo;s installed.
        </p>
      ) : settings.reminderTime ? (
        <>
          <p className="text-sm text-slate-700">
            A nudge arrives at <strong>{settings.reminderTime}</strong> each day.
          </p>
          <button onClick={disable} disabled={busy} className={`${secondaryBtn} mt-3`}>
            Turn the reminder off
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Off unless you want it. One quiet nudge a day, with nothing about what
            you&rsquo;ve written in it.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Reminder time"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
            <button onClick={enable} disabled={busy} className={primaryBtn}>
              {busy ? "Setting…" : "Remind me daily"}
            </button>
          </div>
        </>
      )}
    </Section>
  );
}

function SyncSection({
  setNote,
  onReload,
}: {
  setNote: (s: string) => void;
  onReload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<CryptoKey | null>(null);

  async function connect() {
    if (mode === "new" && !confirmed) {
      setNote("Please confirm you understand the passphrase can't be recovered.");
      return;
    }
    if (pass.length < 10) {
      setNote("Please use a passphrase of at least 10 characters — a short sentence works well.");
      return;
    }
    setBusy(true);
    try {
      const result = mode === "new" ? await register(email, pass) : await login(email, pass);
      setKey(result.key);
      const counts = await syncNow(result.key);
      setNote(`Connected. Sent ${counts.pushed}, brought back ${counts.pulled}.`);
      setPass("");
      onReload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "That didn't work.");
    }
    setBusy(false);
  }

  return (
    <Section title="Sync to another device (optional)">
      {!open ? (
        <>
          <p className="text-sm text-slate-600">
            By default your journal lives only here. If you&rsquo;d like it on a second
            device, you can turn on encrypted sync.
          </p>
          <button onClick={() => setOpen(true)} className={`${secondaryBtn} mt-3`}>
            Set up sync
          </button>
        </>
      ) : (
        <>
          <div className="rounded-lg border-l-4 border-brand-500 bg-paper p-4">
            <p className="text-sm font-semibold text-slate-900">
              Read this part carefully.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Your entries are locked with your passphrase before they leave this
              device, so the server stores something nobody can read — not the
              church, not Pastor Summers, not whoever runs the website. That is the
              point of doing it this way.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              It also means <strong>there is no way to reset a forgotten
              passphrase.</strong> If you forget it, the synced copy is gone for
              good. Write it down somewhere safe, and save a copy of your entries
              to a file before you start.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            {(["new", "existing"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={chip(mode === m)}>
                {m === "new" ? "Start syncing" : "Sign in on this device"}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
            />
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Passphrase"
              autoComplete={mode === "new" ? "new-password" : "current-password"}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
            />
          </div>

          {mode === "new" && (
            <label className="mt-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-slate-700">
                I understand that if I forget this passphrase, my synced entries
                cannot be recovered by anyone.
              </span>
            </label>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={connect} disabled={busy} className={primaryBtn}>
              {busy ? "Working…" : mode === "new" ? "Turn on sync" : "Sign in and sync"}
            </button>
            {key && (
              <button
                onClick={async () => {
                  setBusy(true);
                  const c = await syncNow(key);
                  setNote(`Sent ${c.pushed}, brought back ${c.pulled}.`);
                  onReload();
                  setBusy(false);
                }}
                disabled={busy}
                className={secondaryBtn}
              >
                Sync now
              </button>
            )}
            <button onClick={() => setOpen(false)} className={secondaryBtn}>
              Close
            </button>
          </div>
        </>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const primaryBtn =
  "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60";
const secondaryBtn =
  "rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500 disabled:opacity-60";
const chip = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm font-medium ${
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-slate-300 text-slate-700 hover:border-brand-600"
  }`;
