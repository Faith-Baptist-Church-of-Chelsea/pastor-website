import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { getDevotions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Devotion Videos",
  description: "Short devotional videos from Pastor M. Adam Summers.",
};

export default async function DevotionsPage() {
  const devotions = await getDevotions();
  return (
    <main className="flex-1">
      <PageHero
        title="Devotion Videos"
        subtitle="Short devotional thoughts from the Word of God."
      />
      <section className="mx-auto max-w-6xl px-4 py-14">
        {devotions.length === 0 ? (
          <p className="text-slate-600">
            New devotion videos are coming — check back soon.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {devotions.map((d) => (
              <article key={d.slug}>
                <YouTubeEmbed id={d.youtube} title={d.title} />
                <h2 className="mt-3 text-lg">{d.title}</h2>
                {d.date && (
                  <p className="text-sm text-slate-500">{d.date}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
