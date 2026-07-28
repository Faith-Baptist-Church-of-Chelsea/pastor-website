import { ImageResponse } from "next/og";
import { getPost } from "@/lib/content";

// Share-preview image for each blog post.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "From the Pastor's Desk — Pastor Adam Summers";

// Prerender at build time (the content files aren't bundled for
// on-demand rendering on Vercel).
export async function generateStaticParams() {
  const { getPosts } = await import("@/lib/content");
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPost((await params).slug);
  const title = post?.title ?? "Pastor's Desk";

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
            FROM THE PASTOR&apos;S DESK
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: title.length > 40 ? 60 : 72,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 48, fontSize: 26, color: "#94a3b8" }}>
          M. Adam Summers — pastoradamsummers.com
        </div>
      </div>
    ),
    size
  );
}
