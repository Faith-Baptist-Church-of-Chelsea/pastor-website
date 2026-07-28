import Link from "next/link";
import site from "@/content/site.json";

// Site-wide footer: the verse, the links people actually look for, and
// how to reach Pastor Summers. Deliberately light.
const quickLinks = [
  { label: "About", href: "/about" },
  { label: "Pastor's Desk", href: "/pastors-desk" },
  { label: "Sermons", href: "/sermons" },
  { label: "Family Music", href: "/music" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <p
            className="text-lg italic text-slate-200"
            style={{ fontFamily: "var(--font-display)" }}
          >
            “{site.verse.text}”
          </p>
          <p className="mt-2 text-sm text-brand-400">{site.verse.reference}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Get In Touch
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li>
              <a href={site.facebook ?? "#"} className="hover:text-white">
                Facebook
              </a>
            </li>
            <li>
              <a href={site.church.url ?? "#"} className="hover:text-white">
                {site.church.name} — {site.church.city}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Pastor M. Adam Summers
          </p>
          <p className="text-xs text-slate-500">
            Pastor of{" "}
            <a href={site.church.url ?? "#"} className="text-slate-400 hover:text-white">
              {site.church.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
