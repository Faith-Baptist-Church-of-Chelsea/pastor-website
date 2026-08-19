"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Editor from "./Editor";
import EntryList from "./EntryList";
import InstallScreen from "./InstallScreen";
import ProgressPanel from "./ProgressPanel";
import SettingsPanel from "./SettingsPanel";
import ShareDialog from "./ShareDialog";
import { planDay, readingFor, PLANS } from "@/lib/journal/plans";
import { isStandalone } from "@/lib/journal/install";
import {
  allEntries,
  getSettings,
  saveSettings,
  todayISO,
  type Entry,
  type Settings,
} from "@/lib/journal/store";

type Tab = "today" | "entries" | "progress" | "settings";

export default function JournalApp() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState<Tab>("today");
  const [sharing, setSharing] = useState<Entry | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [suggestion, setSuggestion] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setEntries(await allEntries());
  }, []);

  // First load: settings, entries, service worker, and the install decision.
  useEffect(() => {
    (async () => {
      const s = await getSettings();
      const rows = await allEntries();
      setSettings(s);
      setEntries(rows);

      // Ask about installing on the 1st, 2nd and 3rd visit, then never again.
      const installed = isStandalone();
      if (!installed && !s.installDismissed && s.installPromptCount < 3) {
        setShowInstall(true);
        await saveSettings({ ...s, installPromptCount: s.installPromptCount + 1 });
      }
      setReady(true);

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/journal" })
          .catch(() => {/* offline support is a bonus, never a blocker */});
      }
    })();
  }, []);

  // Today's suggested reading, when a plan is on.
  useEffect(() => {
    if (!settings || settings.plan === "none") {
      setSuggestion([]);
      return;
    }
    const plan = PLANS.find((p) => p.id === settings.plan);
    if (!plan) return;
    const day = planDay(settings.planStart ?? todayISO(), date, plan.days);
    readingFor(settings.plan as never, day).then(setSuggestion).catch(() => setSuggestion([]));
  }, [settings, date]);

  // Anonymous "someone journaled today" ping — fires once, only when an
  // entry actually exists for today, and only if they haven't opted out.
  useEffect(() => {
    if (!settings || settings.statsOptOut) return;
    const today = todayISO();
    if (!entries.some((e) => e.date === today)) return;
    const key = `journal-ping:${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    fetch("/api/journal/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installId: settings.installId, date: today }),
    }).catch(() => {/* counting is never worth an error in someone's face */});
  }, [entries, settings]);

  if (!ready || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        <span className="sr-only">Loading your journal…</span>
      </div>
    );
  }

  if (showInstall) {
    return (
      <div className="bg-slate-950">
        <InstallScreen
          onSkip={async () => {
            setShowInstall(false);
            if (settings.installPromptCount >= 3) {
              const next = { ...settings, installDismissed: true };
              await saveSettings(next);
              setSettings(next);
            }
          }}
        />
      </div>
    );
  }

  const entry = entries.find((e) => e.date === date);
  const isToday = date === todayISO();

  // Nudge toward a backup once there's something worth losing, and then
  // only every 30 days. Clearing browser data really does erase everything.
  const daysSincePrompt = settings.lastExportPrompt
    ? (Date.now() - new Date(`${settings.lastExportPrompt}T12:00:00`).getTime()) / 86_400_000
    : Infinity;
  const nudgeExport = entries.length >= 5 && daysSincePrompt > 30;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
      {/* Day navigation */}
      {tab === "today" && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            aria-label="Previous day"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 hover:border-slate-500"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-2xl">
              {isToday
                ? "Today"
                : new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
            </h1>
            {isToday && (
              <p className="text-sm text-slate-500">
                {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            aria-label="Next day"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 hover:border-slate-500 disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}

      {nudgeExport && tab !== "settings" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-paper p-4">
          <p className="flex-1 text-sm text-slate-700">
            You&rsquo;ve written {entries.length} entries. Worth saving a copy —
            clearing your browser data would erase them.
          </p>
          <button
            onClick={() => setTab("settings")}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Save a copy
          </button>
          <button
            onClick={async () => {
              const next = { ...settings, lastExportPrompt: todayISO() };
              await saveSettings(next);
              setSettings(next);
            }}
            aria-label="Dismiss backup reminder"
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Later
          </button>
        </div>
      )}

      <div className="mt-6">
        {tab === "today" && (
          <Editor
            date={date}
            entry={entry}
            settings={settings}
            suggestion={suggestion}
            onChange={reload}
            onShare={setSharing}
          />
        )}
        {tab === "entries" && (
          <EntryList
            entries={entries}
            onOpen={(d) => {
              setDate(d);
              setTab("today");
            }}
          />
        )}
        {tab === "progress" && <ProgressPanel entries={entries} today={todayISO()} />}
        {tab === "settings" && (
          <SettingsPanel
            settings={settings}
            onSettings={setSettings}
            onReload={reload}
            onShowInstall={() => setShowInstall(true)}
          />
        )}
      </div>

      {sharing && (
        <ShareDialog
          entry={sharing}
          onClose={() => setSharing(null)}
          onShared={() => {
            setSharing(null);
            reload();
          }}
        />
      )}

      {/* Bottom bar — thumb-reachable, which is where this app is used. */}
      <nav
        aria-label="Journal sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl">
          {(
            [
              ["today", "Today"],
              ["entries", "Entries"],
              ["progress", "Progress"],
              ["settings", "Settings"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                if (id === "today") setDate(todayISO());
              }}
              aria-current={tab === id ? "page" : undefined}
              className={`flex-1 px-2 py-3 text-sm font-medium transition-colors ${
                tab === id ? "text-brand-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="pb-2 text-center text-[11px] text-slate-400">
          <Link href="/devotions" className="hover:text-brand-700">
            Read what others have shared
          </Link>
        </p>
      </nav>
    </div>
  );
}

function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
