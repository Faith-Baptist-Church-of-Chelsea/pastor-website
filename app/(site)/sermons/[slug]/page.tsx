import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SermonCard, { formatDate } from "@/components/SermonCard";
import { getPostsFull, getSermonsFull } from "@/lib/content";
import { JsonLd, breadcrumbSchema, canonical, sermonSchema } from "@/lib/seo";

export async function generateStaticParams() {
  const sermons = await getSermonsFull();
  return sermons.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sermon = (await getSermonsFull()).find((s) => s.slug === slug);
  if (!sermon) return { title: "Sermon" };
  const description =
    sermon.description ||
    `A sermon by Pastor M. Adam Summers${sermon.passage ? ` from ${sermon.passage}` : ""}.`;
  return {
    title: sermon.title,
    description,
    ...canonical(`/sermons/${slug}`),
    openGraph: { title: sermon.title, description, type: "article" },
  };
}

export default async function SermonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [sermons, posts] = await Promise.all([getSermonsFull(), getPostsFull()]);
  const sermon = sermons.find((s) => s.slug === slug);
  if (!sermon) notFound();

  const related = sermons
    .filter((s) => s.slug !== slug && s.books.some((b) => sermon.books.includes(b)))
    .slice(0, 3);
  const relatedPosts = posts
    .filter((p) => p.books.some((b) => sermon.books.includes(b)))
    .slice(0, 3);

  return (
    <main className="flex-1">
      <JsonLd data={sermonSchema(sermon)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Sermons", path: "/sermons" },
          { name: sermon.title, path: `/sermons/${slug}` },
        ])}
      />
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <Link href="/sermons" className="text-sm text-brand-400 hover:text-brand-500">
            ← All Sermons
          </Link>
          <h1 className="animate-rise animate-rise-1 mt-4 text-3xl sm:text-4xl">
            {sermon.title}
          </h1>
          <p className="animate-rise animate-rise-2 mt-3 text-sm text-slate-400">
            {formatDate(sermon.date)}
            {sermon.passage && <> · <span className="text-brand-400">{sermon.passage}</span></>}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <SermonCard sermon={sermon} showHeader={false} />

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl">
              More preaching in {sermon.books.join(" & ") || "the Word"}
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/sermons/${s.slug}`}
                    className="hover-lift block rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <span className="font-semibold text-slate-900">{s.title}</span>
                    <span className="ml-2 text-sm text-slate-500">
                      {s.passage || formatDate(s.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl">From the Pastor&rsquo;s Desk on this book</h2>
            <ul className="mt-4 space-y-3">
              {relatedPosts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/pastors-desk/${p.slug}`}
                    className="hover-lift block rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <span className="font-semibold text-slate-900">{p.title}</span>
                    <span className="ml-2 text-sm text-slate-500">{formatDate(p.date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
