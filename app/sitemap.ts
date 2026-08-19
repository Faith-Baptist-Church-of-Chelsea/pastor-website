import type { MetadataRoute } from "next";
import { getPosts, getSermons } from "@/lib/content";
import { dbConfigured, getPublishedDevotions } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

// Google ignores changefreq and largely ignores priority, but it does read
// lastmod — so every entry that can carry an honest date carries one, and
// pages with nothing meaningful to date simply don't claim a date.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, sermons, devotions] = await Promise.all([
    getPosts(),
    getSermons(),
    dbConfigured() ? getPublishedDevotions({ limit: 5000 }) : Promise.resolve([]),
  ]);

  const day = (value: string) => {
    const iso = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : undefined;
  };

  // An index page is only as fresh as the newest thing on it.
  const newest = (rows: { date?: string; entry_date?: string }[]) => {
    const dates = rows
      .map((r) => day(String(r.date ?? r.entry_date ?? "")))
      .filter((d): d is Date => Boolean(d));
    return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;
  };

  const sermonsUpdated = newest(sermons);
  const postsUpdated = newest(posts);
  const devotionsUpdated = newest(devotions);

  return [
    {
      url: `${SITE_URL}/`,
      priority: 1,
      changeFrequency: "weekly",
      lastModified: newest([...sermons, ...posts]),
    },
    { url: `${SITE_URL}/about`, priority: 0.8, changeFrequency: "yearly" },
    {
      url: `${SITE_URL}/sermons`,
      priority: 0.9,
      changeFrequency: "weekly",
      lastModified: sermonsUpdated,
    },
    {
      url: `${SITE_URL}/pastors-desk`,
      priority: 0.8,
      changeFrequency: "weekly",
      lastModified: postsUpdated,
    },
    {
      url: `${SITE_URL}/devotions`,
      priority: 0.8,
      changeFrequency: "daily",
      lastModified: devotionsUpdated,
    },
    { url: `${SITE_URL}/journal`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/music`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "yearly" },

    ...sermons.map((s) => ({
      url: `${SITE_URL}/sermons/${s.slug}`,
      priority: 0.7,
      changeFrequency: "yearly" as const,
      lastModified: day(s.date),
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/pastors-desk/${p.slug}`,
      priority: 0.7,
      changeFrequency: "yearly" as const,
      lastModified: day(p.date),
    })),
    ...devotions
      .filter((d) => d.slug)
      .map((d) => ({
        url: `${SITE_URL}/devotions/${d.slug}`,
        priority: 0.6,
        changeFrequency: "yearly" as const,
        lastModified: day(d.entry_date),
      })),
  ];
}
