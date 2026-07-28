import Link from "next/link";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import ScriptureRef from "@/components/ScriptureRef";
import { youtubeId } from "@/lib/media";

export type SermonCardData = {
  slug: string;
  title: string;
  date: string;
  passage: string;
  duration: string;
  audioFile: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  description: string;
  books: string[];
};

// One sermon, as shown on the index and detail pages. The detail page
// hides the card's own header (its hero already shows title and date).
export default function SermonCard({
  sermon: s,
  showHeader = true,
}: {
  sermon: SermonCardData;
  showHeader?: boolean;
}) {
  const video = youtubeId(s.videoUrl);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {showHeader && (
        <>
          <h2 className="text-2xl">
            <Link href={`/sermons/${s.slug}`} className="hover:text-brand-700">
              {s.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {formatDate(s.date)}
            {s.passage && (
              <>
                {" "}· <ScriptureRef refText={s.passage} />
              </>
            )}
            {s.duration && <> · {s.duration}</>}
          </p>
        </>
      )}
      {s.description && <p className="mt-4 text-slate-700">{s.description}</p>}
      {video && (
        <div className="mt-5">
          <YouTubeEmbed id={video} title={s.title} />
        </div>
      )}
      {s.audioFile && (
        <audio controls preload="none" src={s.audioFile} className="mt-5 w-full">
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
}

export function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
