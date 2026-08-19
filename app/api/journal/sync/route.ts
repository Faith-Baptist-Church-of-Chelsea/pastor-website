// Server side of the opt-in encrypted sync.
//
// Everything this endpoint can see is: an email address, a public salt, a
// verifier derived from the passphrase, and opaque ciphertext with a date
// attached. It cannot decrypt anything, and there is deliberately no
// mechanism by which it could — no password reset, no recovery, no key
// escrow. That is the trade for the privacy promise on /journal.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, dbConfigured } from "@/lib/db";
import { makeRateLimiter, requestIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const COOKIE = "pw_sync";
const MAX_AGE = 60 * 60 * 24 * 90;
const limited = makeRateLimiter(30, 15 * 60 * 1000);

function secret() {
  return process.env.JOURNAL_SYNC_SECRET ?? process.env.CRON_SECRET ?? "";
}

async function hmac(data: string) {
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

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("base64");
}

async function issueSession(accountId: number) {
  const body = Buffer.from(JSON.stringify({ id: accountId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${body}.${await hmac(body)}`;
}

async function currentAccount(): Promise<number | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || (await hmac(body)) !== sig) return null;
  try {
    const { id, exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return exp > Date.now() ? Number(id) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!dbConfigured() || !secret()) {
    return NextResponse.json({ error: "Sync isn't set up on this server." }, { status: 503 });
  }
  if (limited(requestIp(request.headers))) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);

  try {
    switch (action) {
      case "salt": {
        // Returns a stable decoy salt for unknown addresses so this can't
        // be used to find out who has an account.
        const rows = (await sql`SELECT kdf_salt FROM sync_accounts WHERE email = ${email}`) as {
          kdf_salt: string;
        }[];
        if (rows.length > 0) return NextResponse.json({ kdfSalt: rows[0].kdf_salt });
        const decoy = (await sha256(`decoy:${email}:${secret()}`)).slice(0, 24);
        return NextResponse.json({ kdfSalt: decoy });
      }

      case "register": {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
        }
        const kdfSalt = String(body.kdfSalt ?? "").slice(0, 64);
        const verifier = String(body.verifier ?? "");
        if (!kdfSalt || !verifier) {
          return NextResponse.json({ error: "Missing details." }, { status: 400 });
        }
        const existing = (await sql`SELECT id FROM sync_accounts WHERE email = ${email}`) as unknown[];
        if (existing.length > 0) {
          return NextResponse.json(
            { error: "There's already an account with that email. Sign in instead." },
            { status: 409 }
          );
        }
        const [row] = (await sql`
          INSERT INTO sync_accounts (email, verifier_hash, kdf_salt)
          VALUES (${email}, ${await sha256(verifier)}, ${kdfSalt})
          RETURNING id`) as { id: number }[];
        const res = NextResponse.json({ ok: true });
        res.cookies.set(COOKIE, await issueSession(Number(row.id)), cookieOptions());
        return res;
      }

      case "login": {
        const verifier = String(body.verifier ?? "");
        const rows = (await sql`
          SELECT id, verifier_hash FROM sync_accounts WHERE email = ${email}`) as {
          id: number;
          verifier_hash: string;
        }[];
        if (rows.length === 0 || rows[0].verifier_hash !== (await sha256(verifier))) {
          return NextResponse.json({ error: "That email and passphrase don't match." }, { status: 401 });
        }
        await sql`UPDATE sync_accounts SET last_seen_at = now() WHERE id = ${rows[0].id}`;
        const res = NextResponse.json({ ok: true });
        res.cookies.set(COOKIE, await issueSession(Number(rows[0].id)), cookieOptions());
        return res;
      }

      case "logout": {
        const res = NextResponse.json({ ok: true });
        res.cookies.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
        return res;
      }

      case "push": {
        const accountId = await currentAccount();
        if (!accountId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
        const blobs = (Array.isArray(body.blobs) ? body.blobs : []) as {
          entryDate?: string;
          ciphertext?: string;
          iv?: string;
        }[];
        for (const b of blobs.slice(0, 1000)) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.entryDate)) || !b.ciphertext || !b.iv) continue;
          await sql`
            INSERT INTO sync_blobs (account_id, entry_date, ciphertext, iv, updated_at)
            VALUES (${accountId}, ${b.entryDate}, ${b.ciphertext}, ${b.iv}, now())
            ON CONFLICT (account_id, entry_date)
            DO UPDATE SET ciphertext = EXCLUDED.ciphertext, iv = EXCLUDED.iv, updated_at = now()`;
        }
        return NextResponse.json({ ok: true, stored: blobs.length });
      }

      case "pull": {
        const accountId = await currentAccount();
        if (!accountId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
        const rows = (await sql`
          SELECT entry_date::text AS entry_date, ciphertext, iv
          FROM sync_blobs
          WHERE account_id = ${accountId} AND deleted = false`) as {
          entry_date: string;
          ciphertext: string;
          iv: string;
        }[];
        return NextResponse.json({
          blobs: rows.map((r) => ({ entryDate: r.entry_date, ciphertext: r.ciphertext, iv: r.iv })),
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("sync failed:", err);
    return NextResponse.json({ error: "Sync failed. Please try again." }, { status: 500 });
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}
