// URL helpers safe to import from client components (no fs/server deps).

/** YouTube video ID from a full YouTube URL (or an ID passed straight through). */
export function youtubeId(url: string | null): string | null {
  if (!url) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
