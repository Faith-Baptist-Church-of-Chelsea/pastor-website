import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import MarkdownBody from "@/components/MarkdownBody";
import { getDevotions, reader } from "@/lib/content";
import { formatDate } from "@/components/SermonCard";

export const metadata: Metadata = {
  title: "Devotions",
  description: "Short devotional thoughts from Pastor M. Adam Summers.",
};

export default async function DevotionsPage() {
  const devotions = await Promise.all(
    (await getDevotions()).map(async (d) => {
      const entry = await reader.collections.devotions.read(d.slug);
      return { ...d, note: entry ? await entry.note() : "" };
    })
  );

  return (
    <main className="flex-1">
      <PageHero
        title="Devotions"
        subtitle="Short devotional thoughts from the Word of God."
      />
      <section className="mx-auto max-w-3xl px-4 py-14">
        {devotions.length === 0 ? (
          <p className="text-slate-600">
            New devotions are coming — check back soon.
          </p>
        ) : (
          <div className="space-y-10">
            {devotions.map((d) => (
              <article
                key={d.slug}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <h2 className="text-2xl">{d.title}</h2>
                {d.date && (
                  <p className="mt-1 text-sm text-slate-500">{formatDate(d.date)}</p>
                )}
                {d.youtube && (
                  <div className="mt-4">
                    <YouTubeEmbed id={d.youtube} title={d.title} />
                  </div>
                )}
                {d.note.trim() && (
                  <div className="mt-4">
                    <MarkdownBody>{d.note}</MarkdownBody>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
