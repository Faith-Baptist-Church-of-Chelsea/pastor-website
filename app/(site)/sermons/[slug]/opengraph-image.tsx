import { ImageResponse } from "next/og";
import { getSermonsFull } from "@/lib/content";

// Share-preview image for each sermon (Facebook/iMessage/etc.).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sermon by Pastor Adam Summers";

// Prerender at build time (the content files aren't bundled for
// on-demand rendering on Vercel).
export async function generateStaticParams() {
  return (await getSermonsFull()).map((s) => ({ slug: s.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sermon = (await getSermonsFull()).find((s) => s.slug === slug);
  const title = sermon?.title ?? "Sermon";
  const passage = sermon?.passage ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#020617",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 6, background: "#e5b45b" }} />
          <div style={{ fontSize: 28, letterSpacing: 4, color: "#e5b45b" }}>
            PASTOR ADAM SUMMERS · SERMON
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: title.length > 40 ? 64 : 76,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {passage && (
          <div style={{ marginTop: 28, fontSize: 36, color: "#cbd5e1" }}>
            {passage}
          </div>
        )}
        <div style={{ marginTop: 48, fontSize: 24, color: "#64748b" }}>
          “For to me to live is Christ, and to die is gain.” — Philippians 1:21
        </div>
      </div>
    ),
    size
  );
}
