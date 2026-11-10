import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d5c56",
          color: "#f4f1ea",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 2 }}>VISAED SCHOLARSHIPS</div>
        <div style={{ fontSize: 72, lineHeight: 1.05, maxWidth: 900 }}>Scholarships with the facts checked.</div>
        <div style={{ fontSize: 28 }}>Deadlines, funding, and eligibility, with the date we last checked.</div>
      </div>
    ),
    size,
  );
}
