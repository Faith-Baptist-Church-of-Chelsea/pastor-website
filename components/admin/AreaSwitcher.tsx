"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The one control that ties the two admin areas together. It looks and
// sits the same on both, so moving between them is one tap in a place
// that never changes: in the review page's header, and floating in the
// corner of the site editor (Keystatic pins itself to the whole window,
// so a bar above it would just be covered).
export default function AreaSwitcher({ floating = false }: { floating?: boolean }) {
  const pathname = usePathname();
  const inEditor = pathname.startsWith("/keystatic");

  const seg = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
      active ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white"
    }`;

  return (
    <nav
      aria-label="Switch admin area"
      className={
        floating
          ? "fixed right-4 z-[9999] shadow-xl shadow-black/40 print:hidden"
          : ""
      }
      style={floating ? { bottom: "max(1rem, env(safe-area-inset-bottom))" } : undefined}
    >
      <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="" width={28} height={28} className="ml-1 h-7 w-7" />
        <Link
          href="/admin"
          aria-current={!inEditor ? "page" : undefined}
          className={seg(!inEditor)}
        >
          Devotions
        </Link>
        {/* A full navigation, not a client-side one: the editor is its own
            app and is happiest starting fresh. */}
        <a
          href="/keystatic"
          aria-current={inEditor ? "page" : undefined}
          className={seg(inEditor)}
        >
          Site editor
        </a>
      </div>
    </nav>
  );
}
