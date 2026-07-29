import Header, { type NavLink } from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { getDevotions, getSite } from "@/lib/content";

// Layout for every public-facing page: header + page + footer.
// The /keystatic admin route sits outside this group so the CMS gets
// the full screen. Nav is built here (a server component) so pages
// with no content yet — Devotions — stay hidden until they're needed.
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [site, devotions] = await Promise.all([getSite(), getDevotions()]);

  const links: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pastor's Desk", href: "/pastors-desk" },
    { label: "Sermons", href: "/sermons" },
    { label: "Family Music", href: "/music" },
    ...(devotions.length > 0
      ? [{ label: "Devotions", href: "/devotions" }]
      : []),
    { label: "Contact", href: "/contact" },
    { label: "Search", href: "/search" },
  ];

  const subscribeHref = `mailto:${site.email}?subject=${encodeURIComponent(
    "Subscribe me to weekly updates"
  )}&body=${encodeURIComponent(
    "Hello Pastor Summers,\n\nPlease add me to the weekly update list for sermons and special music.\n\n"
  )}`;

  return (
    <>
      <Header links={links} subscribeHref={subscribeHref} />
      {children}
      <Footer />
      <ScrollReveal />
    </>
  );
}
