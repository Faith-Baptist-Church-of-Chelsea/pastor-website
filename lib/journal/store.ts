// The journal's storage: IndexedDB, on the reader's own device.
//
// Nothing in this file talks to a server. Entries are keyed by calendar
// date, so there is exactly one per day by construction — opening today
// when today already exists edits it rather than starting a second one.

export type Entry = {
  date: string;             // "YYYY-MM-DD" — the primary key
  passage: string;          // what they typed, e.g. "John 15:1-8"
  scripture?: string;       // the KJV text pulled in at write time
  observation: string;      // "What it says"
  application: string;      // "What I'm taking away" — the main field
  prayer: string;
  freeform: string;         // used instead of the three fields above when in freeform mode
  mode: "soap" | "freeform";
  sharedAt?: string;        // ISO timestamp, set when shared for publication
  updatedAt: string;
};

export type Settings = {
  mode: "soap" | "freeform";
  plan: string;             // reading plan id, or "none"
  planStart?: string;       // date they started the plan
  installId: string;        // random, anonymous, used only for aggregate counts
  statsOptOut: boolean;
  reminderTime?: string;    // "06:30" local, when push reminders are on
  lastExportPrompt?: string;
  installPromptCount: number;
  installDismissed: boolean;
};

const DB_NAME = "pastor-journal";
const DB_VERSION = 1;
const ENTRIES = "entries";
const META = "meta";

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ENTRIES)) {
        db.createObjectStore(ENTRIES, { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      })
  );
}

export const todayISO = (): string => {
  // Local date, not UTC — "today" must mean the writer's today.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export async function getEntry(date: string): Promise<Entry | undefined> {
  return tx<Entry | undefined>(ENTRIES, "readonly", (s) => s.get(date));
}

export async function allEntries(): Promise<Entry[]> {
  const rows = await tx<Entry[]>(ENTRIES, "readonly", (s) => s.getAll());
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveEntry(entry: Entry): Promise<void> {
  await tx(ENTRIES, "readwrite", (s) =>
    s.put({ ...entry, updatedAt: new Date().toISOString() })
  );
}

export async function deleteEntry(date: string): Promise<void> {
  await tx(ENTRIES, "readwrite", (s) => s.delete(date));
}

export function emptyEntry(date: string, mode: Settings["mode"]): Entry {
  return {
    date,
    passage: "",
    observation: "",
    application: "",
    prayer: "",
    freeform: "",
    mode,
    updatedAt: new Date().toISOString(),
  };
}

export function isBlank(e: Entry): boolean {
  return !(
    e.observation.trim() ||
    e.application.trim() ||
    e.prayer.trim() ||
    e.freeform.trim()
  );
}

/** The text a shared devotion is built from, whichever mode they wrote in. */
export function shareableText(e: Entry): string {
  if (e.mode === "freeform") return e.freeform.trim();
  return [e.observation.trim(), e.application.trim()].filter(Boolean).join("\n\n");
}

// --- Settings -------------------------------------------------------------

const DEFAULTS: Settings = {
  mode: "soap",
  plan: "none",
  installId: "",
  statsOptOut: false,
  installPromptCount: 0,
  installDismissed: false,
};

export async function getSettings(): Promise<Settings> {
  const stored = await tx<Partial<Settings> | undefined>(META, "readonly", (s) => s.get("settings"));
  const settings = { ...DEFAULTS, ...stored };
  if (!settings.installId) {
    settings.installId = crypto.randomUUID();
    await saveSettings(settings);
  }
  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await tx(META, "readwrite", (s) => s.put(settings, "settings"));
}

// --- Backup ---------------------------------------------------------------

export type Backup = {
  format: "pastor-journal";
  version: 1;
  exportedAt: string;
  entries: Entry[];
};

export async function exportBackup(): Promise<Backup> {
  return {
    format: "pastor-journal",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: await allEntries(),
  };
}

/**
 * Merges a backup in without clobbering: when both sides have the same
 * date, the one edited most recently wins.
 */
export async function importBackup(backup: Backup): Promise<{ added: number; updated: number; skipped: number }> {
  if (backup?.format !== "pastor-journal" || !Array.isArray(backup.entries)) {
    throw new Error("That doesn't look like a journal backup file.");
  }
  let added = 0, updated = 0, skipped = 0;
  for (const incoming of backup.entries) {
    if (!incoming?.date) continue;
    const existing = await getEntry(incoming.date);
    if (!existing) {
      await saveEntry(incoming);
      added++;
    } else if ((incoming.updatedAt ?? "") > (existing.updatedAt ?? "")) {
      await saveEntry(incoming);
      updated++;
    } else {
      skipped++;
    }
  }
  return { added, updated, skipped };
}
