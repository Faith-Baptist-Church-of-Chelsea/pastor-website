import type { MetadataRoute } from "next";
import { getPosts, getSermons } from "@/lib/content";
import { dbConfigured, getPublishedDevotions } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";
  const [posts, sermons, devotions] = await Promise.all([
    getPosts(),
    getSermons(),
    dbConfigured() ? getPublishedDevotions({ limit: 5000 }) : Promise.resolve([]),
  ]);
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/about` },
    { url: `${base}/pastors-desk` },
    { url: `${base}/sermons` },
    { url: `${base}/music` },
    { url: `${base}/contact` },
    { url: `${base}/devotions` },
    { url: `${base}/journal` },
    ...sermons.map((s) => ({ url: `${base}/sermons/${s.slug}` })),
    ...posts.map((p) => ({ url: `${base}/pastors-desk/${p.slug}` })),
    ...devotions
      .filter((d) => d.slug)
      .map((d) => ({ url: `${base}/devotions/${d.slug}` })),
  ];
}
