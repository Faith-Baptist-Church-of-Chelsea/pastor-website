"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The one control that ties the two admin areas together. It sits in the
// same spot in the shared header on both, so moving between them is one
// tap in a place that never changes.
export default function AreaSwitcher() {
  const pathname = usePathname();
  const inEditor = pathname.startsWith("/keystatic");

  const seg = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${
      active ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white"
    }`;

  return (
    <nav aria-label="Switch admin area">
      <div className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 p-1">
        <Link
          href="/admin"
          aria-current={!inEditor ? "page" : undefined}
          className={seg(!inEditor)}
        >
          Devotions
        </Link>
        {/* A full navigation, not a client-side one: the editor is its own
            app and is happiest starting fresh. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
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
