import Link from "next/link";
import Image from "next/image";
import SubscribeForm from "@/components/SubscribeForm";
import { getPhotos, getPosts, getSermons, getSite } from "@/lib/content";

export default async function HomePage() {
  const [site, sermons, posts, photos] = await Promise.all([
    getSite(),
    getSermons(),
    getPosts(),
    getPhotos(),
  ]);
  const latestSermon = sermons[0];
  const latestPosts = posts.slice(0, 3);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1fr_360px]">
          <div>
            {/* The church line was plain text, which is the first place a
                visitor looks for it — so it's the link. */}
            <p className="animate-rise animate-rise-1 text-sm font-semibold uppercase tracking-widest text-brand-400">
              <a
                href={site.church.url ?? "#"}
                className="underline decoration-brand-400/40 underline-offset-4 transition-colors hover:text-brand-500 hover:decoration-brand-500"
              >
                {site.church.name} · {site.church.city}
              </a>
            </p>
            <h1 className="animate-rise animate-rise-2 mt-4 text-5xl sm:text-6xl">
              Pastor Adam Summers
            </h1>
            <p
              className="animate-rise animate-rise-3 mt-6 max-w-xl text-xl italic text-slate-300"
              style={{ fontFamily: "var(--font-display)" }}
            >
              “{site.verse.text}”
            </p>
            <p className="animate-rise animate-rise-3 mt-2 text-sm text-brand-400">
              {site.verse.reference}
            </p>
            <div className="animate-rise animate-rise-4 mt-8 flex flex-wrap gap-3">
              <Link
                href="/sermons"
                className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-500"
              >
                Listen to Sermons
              </Link>
              <Link
                href="/pastors-desk"
                className="rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
              >
                Read the Blog
              </Link>
            </div>
          </div>
          <div className="animate-rise animate-rise-3 mx-auto w-64 sm:w-80 lg:w-full">
            <Image
              src={photos.hero}
              alt="Pastor Adam Summers"
              width={720}
              height={900}
              priority
              className="rounded-xl object-cover shadow-2xl shadow-black/40"
            />
          </div>
        </div>
      </section>

      {/* Latest sermon */}
      {latestSermon && (
        <section className="reveal-pending bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
              Latest Sermon
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl sm:text-3xl">{latestSermon.title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {formatDate(latestSermon.date)}
                {latestSermon.passage && <> · {latestSermon.passage}</>}
                {latestSermon.duration && <> · {latestSermon.duration}</>}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/sermons/${latestSermon.slug}`}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Listen Now
                </Link>
                <Link
                  href="/sermons"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
                >
                  All Sermons
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pastor's Desk */}
      <section className="reveal-pending">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
            From the Pastor&rsquo;s Desk
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {latestPosts.map((p, i) => (
              <Link
                key={p.slug}
                href={`/pastors-desk/${p.slug}`}
                className="stagger-child stagger-in hover-lift rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <p className="text-xs text-slate-500">{formatDate(p.date)}</p>
                <h2 className="mt-2 text-xl">{p.title}</h2>
                <p className="mt-3 text-sm font-semibold text-brand-700">
                  Read the post →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Family music */}
      <section className="reveal-pending bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <Image
            src={photos.music}
            alt="Pastor Adam and Melody Summers singing"
            width={900}
            height={600}
            className="rounded-xl object-cover"
          />
          <div>
            <h2 className="text-3xl sm:text-4xl">Summers&rsquo; Family Music</h2>
            <p
              className="mt-4 max-w-md text-lg italic text-slate-300"
              style={{ fontFamily: "var(--font-display)" }}
            >
              “{site.secondaryVerse.text}”
            </p>
            <p className="mt-2 text-sm text-brand-400">
              {site.secondaryVerse.reference}
            </p>
            <Link
              href="/music"
              className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-500"
            >
              Listen to the Music
            </Link>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="reveal-pending">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl">Never Miss an Update</h2>
          <p className="mb-6 mt-4 text-slate-600">{site.subscribeBlurb}</p>
          <SubscribeForm fallbackEmail={site.email} />
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
