// Scripture lookup for the journal.
//
// The whole KJV ships with the app as one JSON file per book under
// /kjv/, so lookup works with no network and no third-party API. KJV is
// public domain, so there's nothing to license. Books are fetched the
// first time they're needed and then cached by the service worker.

export type ParsedReference = {
  slug: string;      // "1-corinthians"
  book: string;      // "1 Corinthians"
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
};

export type Passage = {
  reference: string;              // tidied display form
  verses: { n: number; text: string }[];
  truncated: boolean;             // hit the length cap
};

/** Longest passage we'll pull in automatically. */
export const MAX_VERSES = 50;

// Canonical names plus the abbreviations people actually type.
const BOOKS: { slug: string; name: string; aliases: string[] }[] = [
  ["Genesis", "gen", "ge", "gn"], ["Exodus", "exo", "ex", "exod"],
  ["Leviticus", "lev", "lv"], ["Numbers", "num", "nu", "nm"],
  ["Deuteronomy", "deut", "dt", "deu"], ["Joshua", "josh", "jos"],
  ["Judges", "judg", "jdg"], ["Ruth", "ru"],
  ["1 Samuel", "1sam", "1sa", "1 sm"], ["2 Samuel", "2sam", "2sa", "2 sm"],
  ["1 Kings", "1kgs", "1ki"], ["2 Kings", "2kgs", "2ki"],
  ["1 Chronicles", "1chr", "1ch"], ["2 Chronicles", "2chr", "2ch"],
  ["Ezra", "ezr"], ["Nehemiah", "neh", "ne"], ["Esther", "est", "es"],
  ["Job", "jb"], ["Psalms", "psalm", "ps", "psa", "pss"],
  ["Proverbs", "prov", "pr", "prv"], ["Ecclesiastes", "eccl", "ec", "ecc"],
  ["Song of Solomon", "song", "sos", "canticles"], ["Isaiah", "isa", "is"],
  ["Jeremiah", "jer", "je"], ["Lamentations", "lam", "la"],
  ["Ezekiel", "ezek", "eze", "ezk"], ["Daniel", "dan", "da", "dn"],
  ["Hosea", "hos", "ho"], ["Joel", "joe", "jl"], ["Amos", "am"],
  ["Obadiah", "obad", "ob"], ["Jonah", "jon"], ["Micah", "mic", "mi"],
  ["Nahum", "nah", "na"], ["Habakkuk", "hab"], ["Zephaniah", "zeph", "zep"],
  ["Haggai", "hag"], ["Zechariah", "zech", "zec"], ["Malachi", "mal"],
  ["Matthew", "matt", "mt", "mat"], ["Mark", "mk", "mr"],
  ["Luke", "lk", "lu"], ["John", "jn", "joh"], ["Acts", "ac"],
  ["Romans", "rom", "ro", "rm"],
  ["1 Corinthians", "1cor", "1co"], ["2 Corinthians", "2cor", "2co"],
  ["Galatians", "gal", "ga"], ["Ephesians", "eph", "ep"],
  ["Philippians", "phil", "php"], ["Colossians", "col"],
  ["1 Thessalonians", "1thess", "1th"], ["2 Thessalonians", "2thess", "2th"],
  ["1 Timothy", "1tim", "1ti"], ["2 Timothy", "2tim", "2ti"],
  ["Titus", "tit"], ["Philemon", "phlm", "phm"], ["Hebrews", "heb"],
  ["James", "jas", "jm"], ["1 Peter", "1pet", "1pe"], ["2 Peter", "2pet", "2pe"],
  ["1 John", "1jn", "1jo"], ["2 John", "2jn", "2jo"], ["3 John", "3jn", "3jo"],
  ["Jude", "jud"], ["Revelation", "rev", "re", "apocalypse"],
].map(([name, ...aliases]) => ({
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  aliases,
}));

/** Normalizes "1st Corinthians", "I Cor", "1cor" → "1 corinthians". */
function normalizeBook(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/^i{1,3}\s+/, (m) => `${m.trim().length} `)   // "II Kings" → "2 kings"
    .replace(/(\d)(st|nd|rd|th)\s/, "$1 ")                  // "1st John" → "1 john"
    .replace(/\s+/g, " ")
    .trim();
}

function findBook(raw: string) {
  const n = normalizeBook(raw);
  const compact = n.replace(/\s/g, "");
  return (
    BOOKS.find((b) => b.name.toLowerCase() === n) ??
    BOOKS.find((b) => b.name.toLowerCase().replace(/\s/g, "") === compact) ??
    BOOKS.find((b) => b.aliases.some((a) => a.replace(/\s/g, "") === compact)) ??
    // Last resort: unambiguous prefix ("philipp" → Philippians)
    (() => {
      const hits = BOOKS.filter((b) => b.name.toLowerCase().replace(/\s/g, "").startsWith(compact));
      return compact.length >= 3 && hits.length === 1 ? hits[0] : undefined;
    })()
  );
}

/**
 * Parses what someone typed. Returns null when it can't be understood —
 * the caller then just keeps the text as a plain label, which is why an
 * unrecognized reference never blocks writing an entry.
 */
export function parseReference(input: string): ParsedReference | null {
  const text = input.trim().replace(/[–—]/g, "-");
  if (!text) return null;

  const m = text.match(/^(.+?)\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?\s*$/);
  if (!m) {
    // A whole book with no numbers ("Jude", "Philemon") is still valid.
    const whole = findBook(text);
    return whole ? { slug: whole.slug, book: whole.name, chapter: 1 } : null;
  }

  const book = findBook(m[1]);
  if (!book) return null;

  return {
    slug: book.slug,
    book: book.name,
    chapter: Number(m[2]),
    verseStart: m[3] ? Number(m[3]) : undefined,
    verseEnd: m[4] ? Number(m[4]) : undefined,
  };
}

const cache = new Map<string, { b: string; c: string[][] }>();

async function loadBook(slug: string) {
  const hit = cache.get(slug);
  if (hit) return hit;
  const res = await fetch(`/kjv/${slug}.json`);
  if (!res.ok) throw new Error(`Couldn't load ${slug}`);
  const data = (await res.json()) as { b: string; c: string[][] };
  cache.set(slug, data);
  return data;
}

/** Pulls the actual text for a parsed reference. */
export async function fetchPassage(ref: ParsedReference): Promise<Passage | null> {
  const data = await loadBook(ref.slug).catch(() => null);
  if (!data) return null;

  const chapter = data.c[ref.chapter - 1];
  if (!chapter) return null;

  const start = ref.verseStart ?? 1;
  const requestedEnd = ref.verseEnd ?? (ref.verseStart ? ref.verseStart : chapter.length);
  const end = Math.min(requestedEnd, chapter.length);
  if (start > chapter.length) return null;

  const capped = Math.min(end, start + MAX_VERSES - 1);
  const verses = [];
  for (let n = start; n <= capped; n++) {
    verses.push({ n, text: chapter[n - 1] });
  }

  const range =
    ref.verseStart === undefined
      ? `${ref.chapter}`
      : capped > start
        ? `${ref.chapter}:${start}-${capped}`
        : `${ref.chapter}:${start}`;

  return { reference: `${ref.book} ${range}`, verses, truncated: capped < end };
}

/** Convenience: text in, passage out. */
export async function lookup(input: string): Promise<Passage | null> {
  const ref = parseReference(input);
  return ref ? fetchPassage(ref) : null;
}

export const BOOK_NAMES = BOOKS.map((b) => b.name);
