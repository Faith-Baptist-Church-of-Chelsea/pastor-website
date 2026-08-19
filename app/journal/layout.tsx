import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Daily Devotion Journal",
  description:
    "A private place to write down what you read in God's Word each day. Your entries stay on your own device — nobody else can read them.",
  appleWebApp: {
    capable: true,
    title: "Devotions",
    statusBarStyle: "black-translucent",
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
