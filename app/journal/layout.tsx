import type { Metadata, Viewport } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Daily Devotion Journal",
  description:
    "A private place to write down what you read in God's Word each day. Your entries stay on your own device — nobody else can read them.",
  ...canonical("/journal"),
  appleWebApp: {
    capable: true,
    title: "Devotions",
    statusBarStyle: "black-translucent",
    // iOS ignores the manifest for these, so they're declared here.
    startupImage: [{ url: "/icons/splash-1170x2532.png" }],
  },
  icons: {
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  // Installed apps should fill the screen, notch and all.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

// The journal sits outside the (site) group: no site header, no footer.
// Once installed it should feel like an app, not a page on a website.
export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
