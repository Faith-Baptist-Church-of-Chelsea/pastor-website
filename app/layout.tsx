import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import site from "@/content/site.json";
import { JsonLd, siteSchema } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Serif display face for headings — warm and bookish.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// The site's public URL, used for absolute links in social previews.
// NEXT_PUBLIC_SITE_URL (set in Vercel) overrides the default — when
// pastoradamsummers.com cuts over, set it there or update the fallback.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: `${site.verse.text} — ${site.verse.reference}. Sermons, blog posts, and family music from Pastor M. Adam Summers of ${site.church.name}, ${site.church.city}.`,
  applicationName: site.name,
  authors: [{ name: "M. Adam Summers", url: siteUrl }],
  creator: "M. Adam Summers",
  alternates: {
    canonical: "/",
    types: {
      // Lets browsers and readers discover both feeds from any page.
      "application/rss+xml": [
        { url: "/podcast.xml", title: "Sermons — Pastor Adam Summers" },
        { url: "/feed.xml", title: "Pastor's Desk — Pastor Adam Summers" },
      ],
    },
  },
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_US",
    url: siteUrl,
    // Images come from app/opengraph-image.tsx — a 1200×630 card, rather
    // than the tall portrait that social platforms crop badly.
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: `Sermons, writing, and family music from Pastor M. Adam Summers of ${site.church.name}.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Tells search engines who "Pastor Adam Summers" actually is, and
            which church he belongs to — the pages alone can't say that. */}
        <JsonLd data={siteSchema()} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
