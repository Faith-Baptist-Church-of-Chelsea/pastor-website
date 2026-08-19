import { ImageResponse } from "next/og";
import site from "@/content/site.json";

// The default share card for any page without its own. The homepage photo
// is a tall portrait, which social platforms crop badly, so links get this
// properly-proportioned card instead.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pastor Adam Summers — Faith Baptist Church, Chelsea, Michigan";

export default function OgImage() {
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
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#e5b45b" }}>
            {`${site.church.name.toUpperCase()} · ${site.church.city.toUpperCase()}`}
          </div>
        </div>
        <div style={{ marginTop: 36, fontSize: 82, fontWeight: 700, lineHeight: 1.05 }}>
          Pastor Adam Summers
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 34,
            color: "#cbd5e1",
            fontStyle: "italic",
            maxWidth: 940,
          }}
        >
          {`“${site.verse.text}”`}
        </div>
        <div style={{ marginTop: 14, fontSize: 26, color: "#94a3b8" }}>
          {site.verse.reference}
        </div>
      </div>
    ),
    size
  );
}
