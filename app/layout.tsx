import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import site from "@/content/site.json";

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
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_US",
    images: ["/images/pastor-adam-summers.jpg"],
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
