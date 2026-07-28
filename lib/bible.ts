// Bible reference helpers: detecting book names, extracting them from
// passage strings, and turning references into BibleGateway (KJV) links.

// The 66 books, with common abbreviations people actually write.
const BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Psalm","Proverbs","Ecclesiastes",
  "Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea",
  "Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai",
  "Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans",
  "1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude",
  "Revelation",
];

// Longest names first so "1 John" wins over "John", "Song of Solomon" over "Song".
const BOOK_ALTERNATION = [...BOOKS]
  .sort((a, b) => b.length - a.length)
  .map((b) => b.replace(/ /g, "\\s+"))
  .join("|");

// "Ephesians 5:19", "Jeremiah 18:5-16", "Revelation 13", "1 Timothy 1:12"
const REF_RE = new RegExp(
  `(?<![[\\w])(${BOOK_ALTERNATION})\\s+(\\d{1,3})(?::(\\d{1,3})(?:[-–]\\d{1,3})?)?\\b`,
  "g"
);

/** Canonical book name ("Psalm" folds into "Psalms"). */
function canonical(book: string): string {
  const clean = book.replace(/\s+/g, " ").trim();
  return clean === "Psalm" ? "Psalms" : clean;
}

/** BibleGateway link for a reference string like "Ephesians 5:19". */
export function bibleGatewayUrl(ref: string): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`;
}

/** Distinct Bible books mentioned in a string, in order of appearance. */
export function extractBooks(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(REF_RE)) {
    const book = canonical(m[1]);
    if (!found.includes(book)) found.push(book);
  }
  return found;
}

/**
 * Rewrites bare scripture references in markdown into KJV BibleGateway
 * links. References already inside a markdown link are left alone (the
 * lookbehind refuses to match right after "[").
 */
export function linkScripture(markdown: string): string {
  return markdown.replace(REF_RE, (full) => `[${full}](${bibleGatewayUrl(full)})`);
}
