"use client";

import { useEffect, useState } from "react";
import { detectPlatform, type Platform } from "@/lib/journal/install";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// A real screen, not a dismissible strip along the bottom. Someone who
// stays in a browser tab never feels like they have a devotion app, so
// this is shown up front — but it can always be skipped, and nothing in
// the journal is gated behind installing.
export default function InstallScreen({
  onSkip,
  skipLabel = "Not now — use it here",
}: {
  onSkip: () => void;
  skipLabel?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform(false));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setPlatform(detectPlatform(true));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => onSkip();
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [onSkip]);

  async function install() {
    if (!deferred) return;
    setInstalling(true);
    await deferred.prompt();
    await deferred.userChoice;
    setInstalling(false);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={88}
          height={88}
          className="mx-auto rounded-2xl shadow-lg"
        />
        <h1 className="mt-6 text-3xl text-white">Keep it on your home screen</h1>
        <p className="mt-3 text-slate-300">
          Add the journal to your phone and it opens like any other app —
          full screen, no browser bars, and it works without a signal.
        </p>
      </div>

      <div className="mt-8 rounded-xl bg-slate-900 p-6 text-slate-200">
        <Steps platform={platform} onInstall={install} installing={installing} />
      </div>

      <button
        onClick={onSkip}
        className="mt-6 w-full rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
      >
        {skipLabel}
      </button>
      <p className="mt-4 text-center text-xs text-slate-500">
        Everything works either way. Installing just makes it feel like yours.
      </p>
    </div>
  );
}

function Steps({
  platform,
  onInstall,
  installing,
}: {
  platform: Platform;
  onInstall: () => void;
  installing: boolean;
}) {
  if (platform === "android-prompt") {
    return (
      <>
        <p className="text-sm text-slate-300">
          Your browser can install it directly — one tap.
        </p>
        <button
          onClick={onInstall}
          disabled={installing}
          className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
        >
          {installing ? "Installing…" : "Install the journal"}
        </button>
      </>
    );
  }

  if (platform === "ios-safari") {
    return (
      <ol className="space-y-4 text-sm">
        <Step n={1}>
          Tap the <ShareGlyph /> <strong>Share</strong> button at the bottom of Safari.
        </Step>
        <Step n={2}>
          Scroll down and tap <strong>Add to Home Screen</strong>.
        </Step>
        <Step n={3}>
          Tap <strong>Add</strong>. The journal will be on your home screen.
        </Step>
      </ol>
    );
  }

  if (platform === "ios-inapp") {
    return (
      <div className="text-sm">
        <p className="font-semibold text-brand-400">This browser can&rsquo;t install apps.</p>
        <p className="mt-2 text-slate-300">
          You&rsquo;re in an in-app browser. Tap the <strong>…</strong> menu and choose{" "}
          <strong>Open in Safari</strong>, then you&rsquo;ll be able to add it to your
          home screen.
        </p>
      </div>
    );
  }

  if (platform === "android-manual") {
    return (
      <ol className="space-y-4 text-sm">
        <Step n={1}>
          Tap the <strong>⋮</strong> menu in the top right of Chrome.
        </Step>
        <Step n={2}>
          Choose <strong>Add to Home screen</strong> (or <strong>Install app</strong>).
        </Step>
        <Step n={3}>Confirm, and it&rsquo;s on your home screen.</Step>
      </ol>
    );
  }

  return (
    <ol className="space-y-4 text-sm">
      <Step n={1}>
        Look for the <strong>install icon</strong> at the right-hand end of the address
        bar.
      </Step>
      <Step n={2}>
        Or open the browser menu and choose <strong>Install</strong> / <strong>Add to
        Home screen</strong>.
      </Step>
      <Step n={3}>
        On a phone, the journal is far nicer — try it there when you can.
      </Step>
    </ol>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
        {n}
      </span>
      <span className="text-slate-300">{children}</span>
    </li>
  );
}

function ShareGlyph() {
  return (
    <svg
      aria-label="Share"
      role="img"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="inline-block align-text-bottom text-brand-400"
    >
      <path d="M12 16V4M12 4L8 8M12 4l4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}
