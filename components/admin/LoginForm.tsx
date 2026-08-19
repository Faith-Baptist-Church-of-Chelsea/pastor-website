"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const password = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(body.error ?? "That didn't work.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <label htmlFor="password" className="block text-sm font-medium text-slate-700">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoFocus
        required
        autoComplete="current-password"
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
      />
      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
