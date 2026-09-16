import Link from "next/link";
import AreaSwitcher from "./AreaSwitcher";

// The one header both admin areas share, so they read as two rooms of the
// same house: same colours, same seal, same switch in the same spot.
export default function AdminHeader({
  title,
  homeHref,
  viewHref,
  viewLabel,
  fullWidth = false,
}: {
  title: string;
  homeHref: string;
  viewHref: string;
  viewLabel: string;
  /** The site editor fills the window, so its header should too. */
  fullWidth?: boolean;
}) {
  return (
    <header className="bg-slate-950 text-white">
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 ${
          fullWidth ? "" : "mx-auto max-w-5xl"
        }`}
      >
        <Link href={homeHref} className="flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          {/* On a phone the seal and the switch carry the header; the words come back at sm. */}
          <span className="hidden flex-col leading-tight whitespace-nowrap sm:flex">
            <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </span>
            <span className="text-[11px] tracking-wide text-brand-400">Pastor Adam Summers</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <AreaSwitcher />
          <Link href={viewHref} className="hidden text-slate-300 hover:text-white sm:inline">
            {viewLabel}
          </Link>
          {/* One sign-out for both areas: it clears the editor's GitHub
              session as well as the review page's cookie. */}
          <form action="/admin/logout" method="post">
            <button type="submit" className="whitespace-nowrap text-slate-400 hover:text-white">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
