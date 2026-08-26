import { ImageResponse } from "next/og";

// Default OG image for every public page (14-metadata-and-og-images.md § ImageResponse).
export const alt = "A* Apply — Ask a mentor who got in";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b0b0b", color: "#f4f1ea", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 6, color: "#9a958b" }}>A* | apply</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>Ask a mentor who got in.</div>
          <div style={{ display: "flex", fontSize: 34, color: "#9a958b" }}>Investment banking interview prep for UK undergrads — technicals, graded mocks, and a mentor chatbot that cites its sources.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#f1e8d6" }}>astar-apply · free to start</div>
      </div>
    ),
    { ...size },
  );
}
