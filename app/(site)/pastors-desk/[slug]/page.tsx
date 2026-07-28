import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownBody from "@/components/MarkdownBody";
import { getPost, getPosts, getSermonsFull } from "@/lib/content";
import { extractBooks } from "@/lib/bible";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return { title: post?.title ?? "Pastor's Desk" };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  return (
    <main className="flex-1">
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
            {formatDate(post.date)} · M. Adam Summers
          </p>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <MarkdownBody>{post.body}</MarkdownBody>
        <Image
          src="/images/signature.png"
          alt="Pastor Summers' signature"
          width={300}
          height={150}
          className="mt-10 h-auto w-40"
        />
        <RelatedSermons bodyText={`${post.title}\n${post.body}`} />
      </article>
    </main>
  );
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
