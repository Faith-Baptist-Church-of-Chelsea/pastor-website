import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devotions Admin",
  robots: { index: false, follow: false },
};

// The admin area sits outside the (site) group on purpose: no public
// header, no footer, no scroll animations — just the work.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="flex flex-col leading-tight">
            <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Devotions Admin
            </span>
            <span className="text-[11px] tracking-wide text-brand-400">
              Pastor Adam Summers
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/devotions" className="text-slate-300 hover:text-white">
              View public page
            </Link>
            <form action="/admin/logout" method="post">
              <button type="submit" className="text-slate-400 hover:text-white">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
