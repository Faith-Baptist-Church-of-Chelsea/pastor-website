// Server-side helpers for reading content/ files.
// Uses Keystatic's Reader API so pages get the same validation the
// admin panel enforces. Only import this from server components.
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";
import { extractBooks } from "@/lib/bible";

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

export type SermonFull = Awaited<ReturnType<typeof getSermonsFull>>[number];

/**
 * All sermons with descriptions resolved and Bible books extracted from
 * the passage — powers the sermons index (filters) and related-content.
 */
export async function getSermonsFull() {
  const sermons = await getSermons();
  return Promise.all(
    sermons.map(async (s) => {
      const entry = await reader.collections.sermons.read(s.slug);
      const description = entry
        ? (await entry.description()).replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim()
        : "";
      return { ...s, description, books: extractBooks(s.passage) };
    })
  );
}

/** All posts with bodies resolved and Bible books extracted from the text. */
export async function getPostsFull() {
  const posts = await getPosts();
  return Promise.all(
    posts.map(async (p) => {
      const entry = await reader.collections.posts.read(p.slug);
      const body = entry ? await entry.body() : "";
      return { ...p, books: extractBooks(`${p.title}\n${body}`) };
    })
  );
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

/** Site photos, with fallbacks to the originally-migrated images. */
export async function getPhotos() {
  const p = await reader.singletons.photos.read();
  return {
    hero: p?.hero ?? "/images/hero.jpeg",
    music: p?.music ?? "/images/music.jpg",
    family: p?.family ?? "/images/family.jpg",
    musicHeader: p?.musicHeader ?? "/images/musicHeader.jpg",
    signature: p?.signature ?? "/images/signature.png",
  };
}

/** Strip MDX comments and split into clean paragraphs. */
function mdxToParagraphs(text: string): string[] {
  return text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

