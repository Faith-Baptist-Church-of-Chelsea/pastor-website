import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SearchBox, { type SearchEntry } from "@/components/SearchBox";
import { getMusic, getPostsFull, getSermonsFull, reader } from "@/lib/content";

export const metadata: Metadata = {
  title: "Search",
  description: "Search sermons, blog posts, devotions, and music.",
};

export default async function SearchPage() {
  const [sermons, posts, music] = await Promise.all([
    getSermonsFull(),
    getPostsFull(),
    getMusic(),
  ]);

  const entries: SearchEntry[] = [
    ...sermons.map((s) => ({
      type: "Sermon",
      title: s.title,
      text: [s.passage, s.description].join(" "),
      url: `/sermons/${s.slug}`,
      meta: [s.date, s.passage].filter(Boolean).join(" · "),
    })),
    ...(await Promise.all(
      posts.map(async (p) => {
        const entry = await reader.collections.posts.read(p.slug);
        return {
          type: "Blog post",
          title: p.title,
          text: entry ? await entry.body() : "",
          url: `/pastors-desk/${p.slug}`,
          meta: p.date,
        };
      })
    )),
    ...music.map((m) => ({
      type: "Music",
      title: m.title,
      text: m.singers,
      url: "/music",
      meta: m.singers,
    })),
  ];

  return (
    <main className="flex-1">
      <PageHero
        title="Search"
        subtitle="Every sermon, blog post, devotion, and song — one box."
      />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <SearchBox entries={entries} />
      </section>
    </main>
  );
}
