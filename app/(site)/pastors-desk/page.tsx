import Link from "next/link";
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pastor's Desk",
  description: "Blog posts from Pastor M. Adam Summers.",
  ...canonical("/pastors-desk"),
};

export default async function PastorsDeskPage() {
  const posts = await getPosts();
  return (
    <main className="flex-1">
      <PageHero
        title="Pastor's Desk"
        subtitle="Thoughts, studies, and encouragement from Pastor Summers."
      />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="space-y-6">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/pastors-desk/${p.slug}`}
              className="hover-lift block rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs text-slate-500">{formatDate(p.date)}</p>
              <h2 className="mt-1 text-2xl">{p.title}</h2>
              <p className="mt-3 text-sm font-semibold text-brand-700">
                Read the post →
              </p>
            </Link>
          ))}
          {posts.length === 0 && (
            <p className="text-slate-600">No posts yet — check back soon.</p>
          )}
        </div>
      </section>
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
