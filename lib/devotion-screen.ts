// Automated pre-screening for shared devotions.
//
// Philosophy: FLAG, don't reject. Everything still reaches the pastor's
// queue — flags just sort it to the top and mark why. The single exception
// is links (URLs / email addresses), which are blocked outright: no
// legitimate devotion needs one, and it's the highest-signal spam tell.

export const MIN_REFLECTION = 150;
export const MAX_REFLECTION = 1500;

// Deliberately short and blunt. Add words here if something slips through.
const PROFANITY = [
  "fuck", "shit", "bitch", "bastard", "cunt", "dick", "pussy", "asshole",
  "whore", "slut", "nigger", "faggot", "retard", "goddamn",
];

/** Normalized text used for duplicate detection — case, spacing, punctuation removed. */
export function fingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

export type ScreenResult =
  | { blocked: true; reason: string }
  | { blocked: false; flags: string[] };

/**
 * Screens a reflection before it enters the queue.
 * `blocked` means "don't accept at all" and is only ever links.
 */
export function screenReflection(text: string): ScreenResult {
  const flags: string[] = [];

  // --- Hard block: links and email addresses ---
  const hasUrl =
    /\bhttps?:\/\/\S+/i.test(text) ||
    /\bwww\.\S+/i.test(text) ||
    /\b[a-z0-9-]+\.(com|net|org|io|co|ru|xyz|info|biz|shop|link)\b/i.test(text);
  const hasEmail = /\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/i.test(text);
  if (hasUrl || hasEmail) {
    return {
      blocked: true,
      reason:
        "Links and email addresses can't be included in a shared devotion. Please remove them and try again.",
    };
  }

  // --- Flags ---
  const lower = text.toLowerCase();
  if (PROFANITY.some((w) => new RegExp(`\\b${w}`, "i").test(lower))) {
    flags.push("profanity");
  }

  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 30) {
    const caps = text.replace(/[^A-Z]/g, "").length / letters.length;
    if (caps > 0.4) flags.push("shouting");
  }

  if (/(.)\1{6,}/.test(text)) flags.push("repeated-characters");

  // A wall of text with no sentence breaks is usually pasted spam.
  const words = text.trim().split(/\s+/).length;
  if (words > 80 && !/[.!?]/.test(text)) flags.push("no-punctuation");

  return { blocked: false, flags };
}

/** HMAC of the visitor's IP — lets us rate-limit without storing addresses. */
export async function hashIp(ip: string): Promise<string> {
  const secret = process.env.CRON_SECRET ?? "fallback-salt";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return Buffer.from(sig).toString("base64url").slice(0, 32);
}

/** URL-safe slug for an approved devotion. */
export function devotionSlug(displayName: string, entryDate: string, id: number): string {
  const name = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "devotion";
  return `${entryDate}-${name}-${id}`;
}
