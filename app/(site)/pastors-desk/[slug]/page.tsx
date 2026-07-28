import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownBody from "@/components/MarkdownBody";
import { getPost, getPosts } from "@/lib/content";

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
      </article>
    </main>
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
