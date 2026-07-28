// Server-side helpers for reading content/ files.
// Uses Keystatic's Reader API so pages get the same validation the
// admin panel enforces. Only import this from server components.
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";

export const reader = createReader(process.cwd(), keystaticConfig);

/** All sermons, newest first. */
export async function getSermons() {
  const all = await reader.collections.sermons.all();
  return all
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      date: entry.date ?? "",
      passage: entry.passage ?? "",
      duration: entry.duration ?? "",
      audioFile: entry.audioFile ?? null,
      audioUrl: entry.audioUrl ?? null,
      videoUrl: entry.videoUrl ?? null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** One sermon with its description resolved into paragraphs. */
export async function getSermon(slug: string) {
  const entry = await reader.collections.sermons.read(slug);
  if (!entry) return null;
  return {
    title: entry.title,
    date: entry.date ?? "",
    passage: entry.passage ?? "",
    duration: entry.duration ?? "",
    audioFile: entry.audioFile ?? null,
    audioUrl: entry.audioUrl ?? null,
    videoUrl: entry.videoUrl ?? null,
    description: mdxToParagraphs(await entry.description()),
  };
}

/** All blog posts, newest first (body not resolved — use getPost). */
export async function getPosts() {
  const all = await reader.collections.posts.all();
  return all
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      date: entry.date ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** One post with its raw markdown body. */
export async function getPost(slug: string) {
  const entry = await reader.collections.posts.read(slug);
  if (!entry) return null;
  return {
    title: entry.title,
    date: entry.date ?? "",
    body: await entry.body(),
  };
}

/** Music, in display order. */
export async function getMusic() {
  const all = await reader.collections.music.all();
  return all
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      singers: entry.singers ?? "",
      order: entry.order ?? 99,
      audio: entry.audio ?? null,
      youtube: entry.youtube ?? "",
    }))
    .sort((a, b) => a.order - b.order);
}

/** Devotion videos, newest first. */
export async function getDevotions() {
  const all = await reader.collections.devotions.all();
  return all
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      date: entry.date ?? "",
      youtube: entry.youtube ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Site facts (same data as importing content/site.json directly). */
export async function getSite() {
  const site = await reader.singletons.site.read();
  if (!site) throw new Error("content/site.json is missing");
  return site;
}

/** The About page body as raw markdown. */
export async function getAbout() {
  const about = await reader.singletons.about.read();
  if (!about) return "";
  return about.body();
}

/** Strip MDX comments and split into clean paragraphs. */
function mdxToParagraphs(text: string): string[] {
  return text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * SermonAudio sermon ID from a sermonaudio.com URL, for the embedded
 * player. e.g. "http://sermonaudio.com/sermon/825201629363286" → the ID.
 */
export function sermonAudioId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/sermonaudio\.com\/(?:sermon(?:info)?[/.=]|saplayer\/playpopup\.asp\?SID=)?(\d{8,})/i);
  return m ? m[1] : null;
}

/** YouTube video ID from a full YouTube URL (or an ID passed straight through). */
export function youtubeId(url: string | null): string | null {
  if (!url) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
