"use client";

import { useState } from "react";

// Email-list signup. Posts to /api/subscribe (Resend Audience). If the
// backend isn't configured or errors, it falls back to a mailto link so
// nobody is ever left without a way to subscribe.
export default function SubscribeForm({
  fallbackEmail,
  dark = false,
}: {
  fallbackEmail: string;
  dark?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          name: fd.get("name"),
          website: fd.get("website"),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("done");
      form.reset();
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className={`rounded-lg p-4 text-center font-medium ${dark ? "bg-slate-800 text-brand-400" : "bg-paper text-brand-700"}`}>
        You&rsquo;re on the list! New sermons and music will come straight to your inbox.
      </p>
    );
  }

  const inputClass = dark
    ? "w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500"
    : "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400";

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="subscribe-email">Email address</label>
        <input
          id="subscribe-email"
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
        >
          {status === "sending" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {/* Honeypot — invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="subscribe-website">Website</label>
        <input id="subscribe-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {status === "error" && (
        <p className={`mt-3 text-sm ${dark ? "text-red-400" : "text-red-700"}`}>
          {error}{" "}
          <a className="underline" href={`mailto:${fallbackEmail}?subject=Subscribe%20me%20to%20weekly%20updates`}>
            Email the pastor instead
          </a>
          .
        </p>
      )}
    </form>
  );
}
