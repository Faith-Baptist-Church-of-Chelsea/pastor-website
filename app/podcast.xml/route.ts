// Sermon podcast RSS feed, generated at build time from the sermons that
// have an uploaded recording. Submit this URL once to Apple Podcasts and
// Spotify; after that, new sermons appear in people's podcast apps
// automatically on every deploy.
import { statSync } from "node:fs";
import path from "node:path";
import { getSermons, reader } from "@/lib/content";
import site from "@/content/site.json";

export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pastoradamsummers.com";

export async function GET() {
  const sermons = (await getSermons()).filter((s) => s.audioFile);

  const items = await Promise.all(
    sermons.map(async (s) => {
      const entry = await reader.collections.sermons.read(s.slug);
      const description = entry
        ? (await entry.description()).replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim()
        : "";
      const file = path.join(process.cwd(), "public", s.audioFile!);
      let size = 0;
      try {
        size = statSync(file).size;
      } catch {
        // File missing at build time — publish the item anyway; the URL
        // will still work if the file arrives later.
      }
      const summary = description || `${s.title}${s.passage ? ` — ${s.passage}` : ""}`;
      return `
    <item>
      <title>${cdata(s.title)}</title>
      <description>${cdata(summary)}</description>
      <link>${BASE}/sermons/${s.slug}</link>
      <guid isPermaLink="false">${s.slug}</guid>
      <pubDate>${new Date(`${s.date}T12:00:00Z`).toUTCString()}</pubDate>
      <enclosure url="${BASE}${encodeURI(s.audioFile!)}" length="${size}" type="audio/mpeg" />
      ${s.duration ? `<itunes:duration>${escapeXml(s.duration)}</itunes:duration>` : ""}
      ${s.passage ? `<itunes:subtitle>${escapeXml(s.passage)}</itunes:subtitle>` : ""}
    </item>`;
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pastor Adam Summers — Preaching</title>
    <description>Expository preaching from Pastor M. Adam Summers of Faith Baptist Church, Chelsea, Michigan. "For to me to live is Christ, and to die is gain." — Philippians 1:21</description>
    <link>${BASE}/sermons</link>
    <language>en-us</language>
    <atom:link href="${BASE}/podcast.xml" rel="self" type="application/rss+xml" />
    <itunes:author>Pastor M. Adam Summers</itunes:author>
    <copyright>© ${new Date().getFullYear()} Pastor M. Adam Summers</copyright>
    <itunes:type>episodic</itunes:type>
    <!-- Apple requires an owner email and mails a verification code to it
         when the feed is submitted. It is public in every podcast feed;
         this is the same address already published on the contact page. -->
    <itunes:owner>
      <itunes:name>Pastor M. Adam Summers</itunes:name>
      <itunes:email>${site.email}</itunes:email>
    </itunes:owner>
    <itunes:image href="${BASE}/images/podcast-cover.jpg" />
    <itunes:category text="Religion &amp; Spirituality"><itunes:category text="Christianity" /></itunes:category>
    <itunes:explicit>false</itunes:explicit>
    ${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function cdata(s: string) {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}
function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
