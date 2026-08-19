import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { canonical } from "@/lib/seo";
import DevotionCard from "@/components/DevotionCard";
import {
  countPublishedDevotions,
  dbConfigured,
  getPublishedBooks,
  getPublishedDevotions,
} from "@/lib/db";

const PER_PAGE = 20;

const BLURB =
  "Devotional reflections from the people of Faith Baptist Church — what God is teaching them in their own daily reading, shared in their own words.";

// Paginated and filtered views each canonicalise to themselves, so page 2
// and a book filter are indexed as their own thing rather than competing
// with page 1 as near-duplicates.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; book?: string }>;
}): Promise<Metadata> {
  const { page, book } = await searchParams;
  const query = new URLSearchParams();
  if (book) query.set("book", book);
  if (page && page !== "1") query.set("page", page);
  const suffix = query.toString() ? `?${query}` : "";

  const name = book ? `Devotions from ${book}` : "Devotions";
  const title = page && page !== "1" ? `${name} — page ${page}` : name;
  const description = book
    ? `Devotional reflections from ${book}, shared by the people of Faith Baptist Church in their own words.`
    : BLURB;

  return {
    title,
    description,
    ...canonical(`/devotions${suffix}`),
    openGraph: { title: `${title} | Pastor Adam Summers`, description },
  };
}

// Revalidate rather than rebuild: publishing from the admin queue shows up
// within a minute without a deploy.
export const revalidate = 60;

export default async function DevotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; book?: string }>;
}) {
  const { page: pageParam, book } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);

  if (!dbConfigured()) {
    return (
      <main className="flex-1">
        <PageHero title="Devotions" subtitle="Coming soon." />
      </main>
    );
  }

  const [devotions, total, totalAll, books] = await Promise.all([
    getPublishedDevotions({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE, book }),
    countPublishedDevotions(book),
    countPublishedDevotions(),
    getPublishedBooks(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-700"
    }`;

  return (
    <main className="flex-1">
      <PageHero
        title="Devotions"
        subtitle="What God is teaching our people in their own daily reading — shared in their own words."
      />

      <section className="mx-auto max-w-3xl px-4 py-14">
        {/* Invitation */}
        <div className="rounded-xl bg-paper p-6 sm:p-8">
          <h2 className="text-2xl">Read your Bible every day — and keep what you find</h2>
          <p className="mt-3 text-slate-700">
            Nothing shapes a life like time in God&rsquo;s Word. The journal is a
            private place to write down what you read and what the Lord shows you.
            It stays on your own phone — no one else can see it, not even me. If
            something the Lord gives you might encourage someone else, you can
            choose to share that one entry, and I&rsquo;ll read it before anything
            appears here.
          </p>
          <p className="mt-3 text-sm font-semibold text-brand-700">— Pastor Summers</p>
          <Link
            href="/journal"
            className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Start your own journal
          </Link>
        </div>

        {/* Book filter */}
        {books.length > 0 && (
          <nav aria-label="Filter devotions by Bible book" className="mt-10 flex flex-wrap gap-2">
            <Link href="/devotions" className={chip(!book)}>
              All ({totalAll})
            </Link>
            {books.map((b) => (
              <Link
                key={b.book}
                href={`/devotions?book=${encodeURIComponent(b.book)}`}
                className={chip(book === b.book)}
              >
                {b.book} ({b.n})
              </Link>
            ))}
          </nav>
        )}

        {/* Entries */}
        <div className="mt-8 space-y-6">
          {devotions.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
              No devotions have been shared yet.{" "}
              <Link href="/journal" className="font-semibold text-brand-700 hover:underline">
                Yours could be the first.
              </Link>
            </p>
          ) : (
            devotions.map((d) => <DevotionCard key={d.id} devotion={d} />)
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
            {page > 1 ? (
              <Link
                href={`/devotions?${new URLSearchParams({ ...(book ? { book } : {}), page: String(page - 1) })}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
              >
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-slate-500">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link
                href={`/devotions?${new URLSearchParams({ ...(book ? { book } : {}), page: String(page + 1) })}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
              >
                Older →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
