"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { label: string; href: string };

// Site-wide header. Client component only because the mobile menu needs
// open/closed state — everything else is static. The link list comes in
// as a prop so the server layout can hide pages with no content yet
// (e.g. Devotions before any videos are added).
export default function Header({
  links,
  subscribeHref,
}: {
  links: NavLink[];
  subscribeHref: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setMobileOpen(false);

  const linkClass = (href: string) =>
    `rounded px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href ? "text-white" : "text-slate-300 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/85">
      <nav
        aria-label="Main"
        className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-2 px-4"
      >
        <Link
          href="/"
          onClick={close}
          aria-label="Pastor Adam Summers — home"
          className="flex shrink-0 flex-col leading-tight"
        >
          <span
            className="text-xl font-bold text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Pastor Adam Summers
          </span>
          <span className="hidden text-[11px] tracking-wide text-brand-400 sm:block">
            “For to me to live is Christ, and to die is gain.”
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
          <a
            href={subscribeHref}
            className="ml-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Subscribe
          </a>
        </div>

        {/* Mobile: subscribe button + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={subscribeHref}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Subscribe
          </a>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded p-2 text-slate-200"
          >
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-slate-800 bg-slate-950 px-4 pb-6 pt-2 lg:hidden">
          <div className="mt-2 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="block rounded px-2 py-2 text-base text-slate-200 hover:bg-slate-900"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
