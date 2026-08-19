// Password-based admin session for the moderation queue.
//
// One moderator (the pastor), so there is no user table: he types the
// password from ADMIN_PASSWORD and gets a signed, HttpOnly cookie. The
// signature is an HMAC over an expiry, so a cookie can't be forged or
// extended. Kept role-free but not role-hostile — a `role` claim can be
// added to the payload later without changing how any of this works.
import "server-only";

const COOKIE = "pw_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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
