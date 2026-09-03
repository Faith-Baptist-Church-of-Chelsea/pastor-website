import type { NextConfig } from "next";

/**
 * Redirects from the old WordPress site.
 *
 * pastoradamsummers.com ran on WordPress for years, so Google — and every
 * bulletin, email and Facebook post that ever linked to it — still points
 * at URLs that no longer exist. Without these, all of that lands on a 404
 * and the link equity is thrown away. Permanent (308) so search engines
 * transfer ranking to the new address rather than treating it as a
 * temporary detour.
 *
 * Old post URLs are listed one by one on purpose: a wildcard at the root
 * would swallow every future page on the site.
 */
const OLD_POSTS = [
  "throughly-and-thoroughly-in-the-bible",
  "so-much-to-do-and-so-little-time",
  "its-in-the-good-lords-hands",
  "i-can-do-all-things-through-christ",
];

/** Photos replaced when the pastor uploaded new ones through Keystatic. */
const REPLACED_IMAGES: Record<string, string> = {
  "pastor-adam-summers.jpg": "hero.jpeg",
  "summers-family.jpg": "family.jpg",
  "adam-and-melody.jpg": "music.jpg",
  "family-music.jpg": "musicHeader.jpg",
};

const nextConfig: NextConfig = {
  // Let the dev server be reached as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // These routes read content/ files from disk at request time. Vercel only
  // bundles files it can statically trace, so include the folder explicitly.
  outputFileTracingIncludes: {
    "/api/announce": ["./content/**/*"],
    "/api/subscribe": ["./content/**/*"],
  },

  async redirects() {
    return [
      // Blog posts sat at the root on WordPress.
      ...OLD_POSTS.map((slug) => ({
        source: `/${slug}`,
        destination: `/pastors-desk/${slug}`,
        permanent: true,
      })),

      // Pages that moved.
      { source: "/summers-family-music", destination: "/music", permanent: true },
      { source: "/musical_specials/:path*", destination: "/music", permanent: true },
      { source: "/sermon-archives", destination: "/sermons", permanent: true },
      { source: "/preaching", destination: "/sermons", permanent: true },
      // Old sermon slugs don't all match the new ones, so send them to the
      // index rather than risk landing someone on the wrong sermon.
      { source: "/wpfc_sermon/:path*", destination: "/sermons", permanent: true },
      { source: "/devotion-videos", destination: "/devotions", permanent: true },

      // These three were placeholders he never filled in. About is the
      // nearest honest answer to what someone clicking them wanted.
      { source: "/foundations", destination: "/about", permanent: true },
      { source: "/discover", destination: "/about", permanent: true },
      { source: "/doctrine", destination: "/about", permanent: true },

      // WordPress's feed address.
      { source: "/feed", destination: "/feed.xml", permanent: true },

      // The family music files kept their original filenames.
      {
        source: "/wp-content/uploads/:name(.*\\.m4a)",
        destination: "/audio/:name",
        permanent: true,
      },

      // Photos Google indexed before they were replaced.
      ...Object.entries(REPLACED_IMAGES).map(([from, to]) => ({
        source: `/images/${from}`,
        destination: `/images/${to}`,
        permanent: true,
      })),
      { source: "/icon.svg", destination: "/icon.png", permanent: true },
    ];
  },
};

export default nextConfig;
