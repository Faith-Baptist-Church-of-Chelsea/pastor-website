import Link from "next/link";
import PublishedList from "@/components/admin/PublishedList";
import { getPublishedDevotions } from "@/lib/db";

export const dynamic = "force-dynamic";

// Where the pastor takes something down. One click, effective immediately.
export default async function PublishedPage() {
  const published = await getPublishedDevotions({ limit: 200 });
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="text-sm text-brand-700 hover:underline">
        ← Back to the queue
      </Link>
      <h1 className="mt-3 text-3xl">Published devotions</h1>
      <p className="mt-2 text-sm text-slate-600">
        Taking one down removes it from the website immediately. You can put it back
        in the review queue afterwards if you change your mind.
      </p>
      <div className="mt-6">
        <PublishedList initial={published} />
      </div>
    </div>
  );
}
