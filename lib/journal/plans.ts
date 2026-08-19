// Optional reading plans.
//
// Each plan is computed from the real chapter counts in the bundled KJV
// rather than a transcribed table, so a day's reading can't silently be
// wrong. Plans are opt-in, and switching or stopping never touches a
// single entry — the plan only ever pre-fills the passage box.

export type PlanId = "none" | "whole-bible" | "two-lists" | "gospels";

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  days: number;
};

export const PLANS: Plan[] = [
  { id: "none", name: "No plan", description: "Read wherever you like. The journal never nags.", days: 0 },
  {
    id: "whole-bible",
    name: "The whole Bible in a year",
    description: "Genesis to Revelation in order — about three or four chapters a day.",
    days: 365,
  },
  {
    id: "two-lists",
    name: "Old and New Testament together",
    description: "Two short readings a day, one from each Testament, in the M'Cheyne tradition.",
    days: 365,
  },
  {
    id: "gospels",
    name: "The Gospels in 90 days",
    description: "Matthew, Mark, Luke and John — roughly a chapter a day. A good first plan.",
    days: 90,
  },
];

type BookIndex = Record<string, { name: string; chapters: number }>;

let indexPromise: Promise<BookIndex> | null = null;

function loadIndex(): Promise<BookIndex> {
  indexPromise ??= fetch("/kjv/index.json").then((r) => r.json());
  return indexPromise;
}

// Canonical order matches the order the index was generated in.
const OT_END = 39; // Malachi is the 39th book

/** Flat list of "Book Chapter" strings for a slice of the canon. */
function chapterList(index: BookIndex, from: number, to: number): string[] {
  const books = Object.values(index).slice(from, to);
  const out: string[] = [];
  for (const b of books) {
    for (let c = 1; c <= b.chapters; c++) out.push(`${b.name} ${c}`);
  }
  return out;
}

/** Which day of the plan someone is on (1-based), given when they started. */
export function planDay(startDate: string, today: string, totalDays: number): number {
  const ms = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    return Date.UTC(y, m - 1, dd);
  };
  const elapsed = Math.floor((ms(today) - ms(startDate)) / 86_400_000);
  if (elapsed < 0) return 1;
  return (elapsed % totalDays) + 1; // wraps rather than ending — plans repeat
}

/** The reading for a given day, as one or two passage strings. */
export async function readingFor(plan: PlanId, day: number): Promise<string[]> {
  if (plan === "none") return [];
  const index = await loadIndex();
  const books = Object.values(index);

  if (plan === "gospels") {
    const start = books.findIndex((b) => b.name === "Matthew");
    const list = chapterList(index, start, start + 4);
    return spread(list, 90, day);
  }

  if (plan === "whole-bible") {
    return spread(chapterList(index, 0, books.length), 365, day);
  }

  // two-lists: one Old Testament reading and one New Testament reading.
  const ot = spread(chapterList(index, 0, OT_END), 365, day);
  const nt = spread(chapterList(index, OT_END, books.length), 365, day);
  return [...ot, ...nt];
}

/**
 * Splits a chapter list evenly across `days` and returns the chunk for
 * `day`, collapsed into ranges ("Genesis 1-3") where they're contiguous.
 */
function spread(list: string[], days: number, day: number): string[] {
  const perDay = list.length / days;
  const from = Math.floor((day - 1) * perDay);
  const to = Math.max(from + 1, Math.floor(day * perDay));
  return collapse(list.slice(from, to));
}

function collapse(chapters: string[]): string[] {
  if (chapters.length === 0) return [];
  const out: string[] = [];
  let bookName = "";
  let first = 0;
  let last = 0;

  const flush = () => {
    if (!bookName) return;
    out.push(first === last ? `${bookName} ${first}` : `${bookName} ${first}-${last}`);
  };

  for (const item of chapters) {
    const m = item.match(/^(.*)\s(\d+)$/);
    if (!m) continue;
    const [, name, num] = m;
    const n = Number(num);
    if (name === bookName && n === last + 1) {
      last = n;
    } else {
      flush();
      bookName = name;
      first = n;
      last = n;
    }
  }
  flush();
  return out;
}
