import Header, { type NavLink } from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { getSite } from "@/lib/content";

// Layout for every public-facing page: header + page + footer.
// The /keystatic and /admin routes sit outside this group so the CMS and
// the moderation queue get the full screen.
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSite();

  const links: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pastor's Desk", href: "/pastors-desk" },
    { label: "Sermons", href: "/sermons" },
    { label: "Devotions", href: "/devotions" },
    { label: "Family Music", href: "/music" },
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
