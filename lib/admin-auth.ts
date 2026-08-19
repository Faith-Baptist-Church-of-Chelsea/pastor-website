// Admin session for the moderation queue.
//
// There are two ways in, and they deliberately land in the same place:
//
//   1. Signing in to the site editor at /keystatic with GitHub. Anyone
//      with write access to the repo is already trusted to change the
//      whole website, so they're trusted to review devotions too. This
//      is the pastor's route — one sign-in covers both.
//   2. ADMIN_PASSWORD, kept as a way in when GitHub is unreachable.
//
// Either way the result is one signed, HttpOnly cookie whose HMAC covers
// an expiry, so it can't be forged or extended. Kept role-free but not
// role-hostile — a `role` claim can be added to the payload later.
import "server-only";

const COOKIE = "pw_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** The cookie Keystatic sets once someone signs in with GitHub. */
export const KEYSTATIC_COOKIE = "keystatic-gh-access-token";

/** Repo whose write access grants admin. Matches keystatic.config.ts. */
export const ADMIN_REPO = "stevenabi6912-prog/pastor-website";

function secret(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminConfigured(): boolean {
  return secret().length > 0;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Buffer.from(sig).toString("base64url");
}

/** Constant-time-ish comparison, to avoid leaking the password by timing. */
export function passwordMatches(attempt: string): boolean {
  const expected = secret();
  if (!expected || attempt.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= attempt.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000, v: 1 });
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${await hmac(body)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !adminConfigured()) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  if ((await hmac(body)) !== sig) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Confirms a GitHub token belongs to someone who can write to the repo.
 * Push access means they can already change every word on the site, so
 * gating the devotion queue any harder would be theatre.
 */
export async function githubUserCanWrite(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://api.github.com/repos/${ADMIN_REPO}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "pastoradamsummers.com",
      },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const repo = (await res.json()) as { permissions?: { push?: boolean } };
    return repo.permissions?.push === true;
  } catch {
    return false;
  }
}

export const sessionCookie = {
  name: COOKIE,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  },
};
