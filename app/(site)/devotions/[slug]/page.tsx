import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DevotionCard, { formatEntryDate } from "@/components/DevotionCard";
import { getDevotionBySlug, getPublishedDevotions, dbConfigured } from "@/lib/db";
import site from "@/content/site.json";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!dbConfigured()) return { title: "Devotion" };
  const d = await getDevotionBySlug((await params).slug);
  if (!d) return { title: "Devotion" };
  const summary = d.reflection.slice(0, 155).trimEnd();
  return {
    title: `${d.passage || "Devotion"} — ${d.display_name}`,
    description: summary,
    openGraph: {
      title: `${d.passage || "A devotion"} — shared by ${d.display_name}`,
      description: summary,
      type: "article",
    },
  };
}

export default async function DevotionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!dbConfigured()) notFound();
  const { slug } = await params;
  const devotion = await getDevotionBySlug(slug);
  if (!devotion) notFound();

  // "More from this book" — the same trail pattern the sermon pages use.
  const related = devotion.books.length
    ? (await getPublishedDevotions({ limit: 4, book: devotion.books[0] })).filter(
        (d) => d.slug !== slug
      ).slice(0, 3)
    : [];

  const removalSubject = encodeURIComponent(`Please remove my devotion (${slug})`);
  const removalBody = encodeURIComponent(
    `Hello Pastor Summers,\n\nPlease remove the devotion published at /devotions/${slug}.\n\nThank you.`
  );

  return (
    <main className="flex-1">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <Link href="/devotions" className="text-sm text-brand-400 hover:text-brand-500">
            ← All Devotions
          </Link>
          <h1 className="animate-rise animate-rise-1 mt-4 text-3xl sm:text-4xl">
            {devotion.passage || "A devotion"}
          </h1>
          <p className="animate-rise animate-rise-2 mt-3 text-sm text-slate-400">
            Shared by {devotion.display_name} · {formatEntryDate(devotion.entry_date)}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <DevotionCard devotion={devotion} full />

        <div className="mt-8 rounded-xl bg-paper p-6 text-center">
          <p className="text-slate-700">
            Reading the Bible every day changes things. Keep your own private journal
            — it stays on your phone, and no one else can read it.
          </p>
          <Link
            href="/journal"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-500"
          >
            Start your own journal
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl">More from {devotion.books[0]}</h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/devotions/${r.slug}`}
                    className="hover-lift block rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <span className="font-semibold text-slate-900">{r.display_name}</span>
                    {r.passage && (
                      <span className="ml-2 text-sm text-slate-500">{r.passage}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-500">
          Is this yours, and you&rsquo;d like it taken down?{" "}
          <a
            href={`mailto:${site.email}?subject=${removalSubject}&body=${removalBody}`}
            className="underline hover:text-brand-700"
          >
            Request removal
          </a>{" "}
          — it comes down right away, no questions asked.
        </p>
      </section>
    </main>
  );
}
