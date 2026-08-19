// RSS feed for the Pastor's Desk blog, generated
// at build time. The sermon podcast has its own feed at /podcast.xml.
import { getPosts, reader } from "@/lib/content";

export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";

export async function GET() {
  const posts = await getPosts();

  const postItems = await Promise.all(
    posts.map(async (p) => {
      const entry = await reader.collections.posts.read(p.slug);
      const body = entry ? await entry.body() : "";
      return {
        title: p.title,
        url: `${BASE}/pastors-desk/${p.slug}`,
        date: p.date,
        summary: firstParagraph(body),
      };
    })
  );

  const items = [...postItems]
    .filter((i) => i.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (i) => `
    <item>
      <title><![CDATA[${i.title}]]></title>
      <link>${i.url}</link>
      <guid isPermaLink="true">${i.url}</guid>
      <pubDate>${new Date(`${i.date}T12:00:00Z`).toUTCString()}</pubDate>
      ${i.summary ? `<description><![CDATA[${i.summary}]]></description>` : ""}
    </item>`
    );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pastor Adam Summers — Pastor's Desk</title>
    <description>Thoughts, studies, and encouragement from Pastor M. Adam Summers of Faith Baptist Church, Chelsea, Michigan.</description>
    <link>${BASE}/pastors-desk</link>
    <language>en-us</language>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />
    ${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function firstParagraph(markdown: string) {
  const clean = markdown
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_]/g, "")
    .trim();
  const para = clean.split(/\n\s*\n/)[0] ?? "";
  return para.length > 300 ? `${para.slice(0, 297)}…` : para;
}
