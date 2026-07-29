import Image from "next/image";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { getMusic, getPhotos } from "@/lib/content";

export const metadata: Metadata = {
  title: "Summers' Family Music",
  description:
    "Special music from Pastor Adam Summers and his family — recordings and videos.",
};

export default async function MusicPage() {
  const [music, photos] = await Promise.all([getMusic(), getPhotos()]);
  return (
    <main className="flex-1">
      <PageHero
        title="Summers' Family Music"
        subtitle="Singing psalms and hymns and spiritual songs, making melody in your heart to the Lord."
      />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-10 overflow-hidden rounded-xl">
          <Image
            src={photos.musicHeader}
            alt="The Summers family singing"
            width={1600}
            height={744}
            className="w-full object-cover"
            priority
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {music.map((m) => (
            <article
              key={m.slug}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl">{m.title}</h2>
              {m.singers && (
                <p className="mt-1 text-sm text-slate-500">{m.singers}</p>
              )}
              {m.audio && (
                <audio
                  controls
                  preload="none"
                  src={m.audio}
                  className="mt-4 w-full"
                >
                  Your browser doesn&rsquo;t support audio playback.{" "}
                  <a href={m.audio}>Download the recording instead.</a>
                </audio>
              )}
              {m.youtube && (
                <div className="mt-4">
                  <YouTubeEmbed id={m.youtube} title={m.title} />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
