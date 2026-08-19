// Structured data and canonical URLs.
//
// Search engines can read the pages fine; what they can't do is work out
// that "M. Adam Summers" is a person, that a sermon is a recording with a
// length, or which passage a post is about. That's what the JSON-LD here
// is for — and every claim in it has to match what's actually on the page,
// or it's worse than nothing.
import site from "@/content/site.json";
import photos from "@/content/photos.json";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";

/** Absolute URL for a site-relative path. */
export function abs(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** `alternates.canonical` for a page — spread into its metadata. */
export function canonical(path: string) {
  return { alternates: { canonical: abs(path) } };
}

const PERSON_ID = `${SITE_URL}/#person`;
const CHURCH_ID = `${SITE_URL}/#church`;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "M. Adam Summers",
    alternateName: "Pastor Adam Summers",
    jobTitle: "Pastor",
    url: SITE_URL,
    image: abs(photos.hero),
    description:
      "Pastor of Faith Baptist Church in Chelsea, Michigan since 2008, preaching expository sermons from the King James Bible.",
    worksFor: { "@id": CHURCH_ID },
    ...(site.facebook ? { sameAs: [site.facebook] } : {}),
  };
}

export function churchSchema() {
  return {
    "@type": "Church",
    "@id": CHURCH_ID,
    name: site.church.name,
    url: site.church.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Chelsea",
      addressRegion: "MI",
      addressCountry: "US",
    },
    employee: { "@id": PERSON_ID },
  };
}

/**
 * Site-wide graph, rendered once in the root layout. The SearchAction is
 * only honest because /search really does accept ?q= — don't declare it
 * if that ever stops being true.
 */
export function siteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personSchema(),
      churchSchema(),
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Pastor Adam Summers",
        publisher: { "@id": PERSON_ID },
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: abs(step.path),
    })),
  };
}

export function sermonSchema(sermon: {
  slug: string;
  title: string;
  date: string;
  passage: string;
  duration: string;
  description: string;
  audioFile: string | null;
}) {
  const audio = sermon.audioFile
    ? {
        associatedMedia: {
          "@type": "AudioObject",
          contentUrl: abs(sermon.audioFile),
          encodingFormat: "audio/mpeg",
          ...(isoDuration(sermon.duration) ? { duration: isoDuration(sermon.duration) } : {}),
        },
      }
    : {};

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: sermon.title,
    ...(sermon.description ? { description: sermon.description } : {}),
    datePublished: sermon.date,
    image: abs("/opengraph-image"),
    author: personSchema(),
    publisher: { "@id": PERSON_ID },
    mainEntityOfPage: abs(`/sermons/${sermon.slug}`),
    ...(sermon.passage ? { about: sermon.passage } : {}),
    isAccessibleForFree: true,
    ...audio,
  };
}

export function postSchema(post: {
  slug: string;
  title: string;
  date: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.description ? { description: post.description } : {}),
    datePublished: post.date,
    dateModified: post.date,
    image: abs("/opengraph-image"),
    author: personSchema(),
    publisher: { "@id": PERSON_ID },
    mainEntityOfPage: abs(`/pastors-desk/${post.slug}`),
    isAccessibleForFree: true,
  };
}

export function devotionSchema(devotion: {
  slug: string | null;
  display_name: string;
  entry_date: string;
  passage: string;
  reflection: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${devotion.passage || "A devotion"} — shared by ${devotion.display_name}`,
    description: devotion.reflection.slice(0, 200),
    datePublished: devotion.entry_date,
    image: abs("/opengraph-image"),
    // Contributors choose how they're named, including "Anonymous", so the
    // author is exactly the label shown on the page and nothing more.
    author: { "@type": "Person", name: devotion.display_name },
    publisher: { "@id": PERSON_ID },
    ...(devotion.slug ? { mainEntityOfPage: abs(`/devotions/${devotion.slug}`) } : {}),
    ...(devotion.passage ? { about: devotion.passage } : {}),
    isAccessibleForFree: true,
  };
}

/**
 * "53 minutes" or "00:39:28" → ISO 8601. Returns null when it can't tell,
 * because a wrong duration in structured data is worse than none.
 */
export function isoDuration(text: string): string | null {
  if (!text) return null;
  const clock = text.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (clock) {
    const [, h, m, s] = clock;
    return `PT${Number(h)}H${Number(m)}M${Number(s)}S`;
  }
  const mins = text.match(/^(\d{1,3})\s*min/i);
  if (mins) return `PT${Number(mins[1])}M`;
  return null;
}

/** Renders a JSON-LD block. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Content is built from our own data, and the serializer escapes it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
