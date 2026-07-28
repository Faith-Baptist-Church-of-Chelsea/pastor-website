import type { MetadataRoute } from "next";
import { getDevotions, getPosts, getSermons } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";
  const [posts, sermons, devotions] = await Promise.all([
    getPosts(),
    getSermons(),
    getDevotions(),
  ]);
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/about` },
    { url: `${base}/pastors-desk` },
    { url: `${base}/sermons` },
    { url: `${base}/music` },
    { url: `${base}/contact` },
    ...(devotions.length > 0 ? [{ url: `${base}/devotions` }] : []),
    ...sermons.map((s) => ({ url: `${base}/sermons/${s.slug}` })),
    ...posts.map((p) => ({ url: `${base}/pastors-desk/${p.slug}` })),
  ];
}
