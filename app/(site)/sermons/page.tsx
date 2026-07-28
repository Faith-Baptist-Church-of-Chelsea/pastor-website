import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SermonList from "@/components/SermonList";
import { getSermonsFull, getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sermons",
  description:
    "Preaching and sermon notes from Pastor M. Adam Summers — expository preaching from the Word of God.",
};

export default async function SermonsPage() {
  const [sermons, site] = await Promise.all([getSermonsFull(), getSite()]);

  return (
    <main className="flex-1">
      <PageHero
        title="Preaching & Sermon Notes"
        subtitle="If these messages are a blessing to you, Pastor Summers would love to hear from you."
      />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="mb-10 flex flex-wrap items-center gap-3 rounded-xl bg-paper p-4">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-brand-700">
            <path d="M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h2v-8H5v-1a7 7 0 0 1 14 0v1h-2v8h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z" />
          </svg>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Listen as a podcast:</span> add{" "}
            <a href="/podcast.xml" className="text-brand-700 underline">this feed</a>{" "}
            to any podcast app and new sermons arrive automatically.
          </p>
        </div>

        <SermonList sermons={sermons} />

        <div className="mt-14 rounded-xl bg-paper p-6 text-center">
          <h2 className="text-xl">Has this preaching been a blessing?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            We would love to know how the Lord has used this teaching and
            preaching in your life, home, or ministry.
          </p>
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent("The preaching has been a blessing")}`}
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Email Pastor Summers
          </a>
        </div>
      </section>
    </main>
  );
}
