import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { getSermons, getSite, reader, youtubeId } from "@/lib/content";
import YouTubeEmbed from "@/components/YouTubeEmbed";

export const metadata: Metadata = {
  title: "Sermons",
  description:
    "Preaching and sermon notes from Pastor M. Adam Summers — expository preaching from the Word of God.",
};

export default async function SermonsPage() {
  const [sermons, site] = await Promise.all([getSermons(), getSite()]);

  // Resolve every description up front (they're short).
  const withDescriptions = await Promise.all(
    sermons.map(async (s) => {
      const entry = await reader.collections.sermons.read(s.slug);
      const description = entry
        ? (await entry.description())
            .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
            .trim()
        : "";
      return { ...s, description };
    })
  );

  return (
    <main className="flex-1">
      <PageHero
        title="Preaching & Sermon Notes"
        subtitle="If these messages are a blessing to you, Pastor Summers would love to hear from you."
      />
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="space-y-8">
          {withDescriptions.map((s) => {
            const video = youtubeId(s.videoUrl);
            return (
              <article
                key={s.slug}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <h2 className="text-2xl">{s.title}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {formatDate(s.date)}
                  {s.passage && (
                    <>
                      {" "}
                      · <span className="font-medium text-brand-700">{s.passage}</span>
                    </>
                  )}
                  {s.duration && <> · {s.duration}</>}
                </p>
                {s.description && (
                  <p className="mt-4 text-slate-700">{s.description}</p>
                )}
                {video && (
                  <div className="mt-5">
                    <YouTubeEmbed id={video} title={s.title} />
                  </div>
                )}
                {s.audioFile && (
                  <audio
                    controls
                    preload="none"
                    src={s.audioFile}
                    className="mt-5 w-full"
                  >
                    Your browser doesn&rsquo;t support audio playback.{" "}
                    <a href={s.audioFile}>Download the recording instead.</a>
                  </audio>
                )}
                {!s.audioFile && s.audioUrl && (
                  <a
                    href={s.audioUrl}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 3.5v9l8-4.5-8-4.5z" />
                    </svg>
                    Listen on SermonAudio
                  </a>
                )}
              </article>
            );
          })}
        </div>

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

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
