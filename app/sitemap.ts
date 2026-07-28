import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";
  const posts = await getPosts();
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/about` },
    { url: `${base}/pastors-desk` },
    { url: `${base}/sermons` },
    { url: `${base}/music` },
    { url: `${base}/contact` },
    ...posts.map((p) => ({ url: `${base}/pastors-desk/${p.slug}` })),
  ];
}
