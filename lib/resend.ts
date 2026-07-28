// Thin Resend API helpers (plain fetch — no SDK needed).
//
// The email list lives in a Resend Audience; announcement emails go out as
// Resend Broadcasts, which get automatic unsubscribe handling. Configured by
// three env vars (see README): RESEND_API_KEY (full-access), RESEND_AUDIENCE_ID,
// and optionally RESEND_FROM (defaults to Resend's shared test sender until
// pastoradamsummers.com is verified as a sending domain).
import "server-only";

const API = "https://api.resend.com";

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID);
}

export function fromAddress(): string {
  return process.env.RESEND_FROM ?? "Pastor Adam Summers <onboarding@resend.dev>";
}

async function resend(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${path} ${res.status}: ${body?.message ?? "error"}`);
  }
  return body;
}

/** Add (or re-add) a subscriber to the audience. Idempotent by email. */
export async function addContact(email: string, firstName?: string) {
  return resend(`/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
    method: "POST",
    body: JSON.stringify({
      email,
      first_name: firstName ?? "",
      unsubscribed: false,
    }),
  });
}

/**
 * Names of broadcasts already sent — used by the announce cron to remember
 * which sermons/posts have been emailed about (the broadcast name encodes
 * the item keys), so nothing gets announced twice without needing a database.
 */
export async function broadcastNames(): Promise<string[]> {
  const body = await resend("/broadcasts");
  const list = Array.isArray(body?.data) ? body.data : [];
  return list.map((b: { name?: string }) => b.name ?? "");
}

/** Create a broadcast to the audience and send it immediately. */
export async function sendBroadcast(opts: {
  name: string;
  subject: string;
  html: string;
}) {
  const created = await resend("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      audience_id: process.env.RESEND_AUDIENCE_ID,
      from: fromAddress(),
      subject: opts.subject,
      html: opts.html,
      name: opts.name,
    }),
  });
  await resend(`/broadcasts/${created.id}/send`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return created.id as string;
}
