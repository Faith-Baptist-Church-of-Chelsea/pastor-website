import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownBody from "@/components/MarkdownBody";
import { getPhotos, getPost, getPosts, getSermonsFull } from "@/lib/content";
import { extractBooks } from "@/lib/bible";
import { JsonLd, breadcrumbSchema, canonical, postSchema } from "@/lib/seo";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Pastor's Desk" };
  const description = firstSentences(post.body);
  return {
    title: post.title,
    description,
    ...canonical(`/pastors-desk/${slug}`),
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, photos] = await Promise.all([getPost(slug), getPhotos()]);
  if (!post) notFound();

  return (
    <main className="flex-1">
      <JsonLd
        data={postSchema({
          slug,
          title: post.title,
          date: post.date,
          description: firstSentences(post.body),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Pastor's Desk", path: "/pastors-desk" },
          { name: post.title, path: `/pastors-desk/${slug}` },
        ])}
      />
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <Link
            href="/pastors-desk"
            className="text-sm text-brand-400 hover:text-brand-500"
          >
            ← Pastor&rsquo;s Desk
          </Link>
          <h1 className="animate-rise animate-rise-1 mt-4 text-3xl sm:text-4xl">
            {post.title}
          </h1>
          <p className="animate-rise animate-rise-2 mt-3 text-sm text-slate-400">
            {formatDate(post.date)} · M. Adam Summers · {readingTime(post.body)} min read
          </p>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <MarkdownBody>{post.body}</MarkdownBody>
        <Image
          src={photos.signature}
          alt="Pastor Summers' signature"
          width={300}
          height={150}
          className="mt-10 h-auto w-40"
        />
        <RelatedSermons bodyText={`${post.title}\n${post.body}`} />
        <PostPager slug={slug} />
      </article>
    </main>
  );
}

// Older/newer links at the bottom of every post.
async function PostPager({ slug }: { slug: string }) {
  const posts = await getPosts(); // newest first
  const i = posts.findIndex((p) => p.slug === slug);
  const newer = i > 0 ? posts[i - 1] : null;
  const older = i >= 0 && i < posts.length - 1 ? posts[i + 1] : null;
  if (!newer && !older) return null;
  return (
    <nav aria-label="More posts" className="mt-12 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2">
      {older ? (
        <Link href={`/pastors-desk/${older.slug}`} className="hover-lift rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-slate-500">← Older</span>
          <span className="mt-1 block font-semibold text-slate-900">{older.title}</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {newer && (
        <Link href={`/pastors-desk/${newer.slug}`} className="hover-lift rounded-lg border border-slate-200 bg-white p-4 text-right shadow-sm">
          <span className="text-xs uppercase tracking-wider text-slate-500">Newer →</span>
          <span className="mt-1 block font-semibold text-slate-900">{newer.title}</span>
        </Link>
      )}
    </nav>
  );
}

/** A clean one-or-two-sentence summary for search results and previews. */
function firstSentences(markdown: string, limit = 165): string {
  const plain = markdown
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= limit) return plain;
  const cut = plain.slice(0, limit);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return lastStop > 60 ? cut.slice(0, lastStop + 1) : `${cut.trimEnd()}…`;
}

function readingTime(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

// Sermons preached from the books this post quotes.
async function RelatedSermons({ bodyText }: { bodyText: string }) {
  const books = extractBooks(bodyText);
  if (books.length === 0) return null;
  const sermons = (await getSermonsFull())
    .filter((s) => s.books.some((b) => books.includes(b)))
    .slice(0, 3);
  if (sermons.length === 0) return null;
  return (
    <div className="mt-12 border-t border-slate-200 pt-8">
      <h2 className="text-xl">Sermons on {books.slice(0, 3).join(", ")}</h2>
      <ul className="mt-4 space-y-3">
        {sermons.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/sermons/${s.slug}`}
              className="hover-lift block rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="font-semibold text-slate-900">{s.title}</span>
              {s.passage && (
                <span className="ml-2 text-sm text-slate-500">{s.passage}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
