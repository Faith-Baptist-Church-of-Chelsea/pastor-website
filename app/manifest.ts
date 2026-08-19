import type { MetadataRoute } from "next";

// Installed-app identity for the journal. Scoped to /journal so installing
// gives someone the journal as an app, while the rest of the site keeps
// behaving like an ordinary website in their browser.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Devotion Journal",
    short_name: "Devotions",
    description:
      "A private place to write down what you read in God's Word each day. Your entries stay on your own device.",
    id: "/journal",
    start_url: "/journal",
    scope: "/journal",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020617",
    theme_color: "#020617",
    categories: ["lifestyle", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
