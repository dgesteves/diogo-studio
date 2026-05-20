import { ImageResponse } from "next/og";

export const alt = "Diogo Esteves — Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "28px",
          opacity: 0.7,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)",
            color: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "22px",
          }}
        >
          DE
        </span>
        Diogo Esteves
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <h1
          style={{
            fontSize: "92px",
            fontWeight: 700,
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: "-0.04em",
          }}
        >
          Portfolio &amp; Digital Studio
        </h1>
        <p
          style={{
            fontSize: "32px",
            color: "#a1a1aa",
            margin: 0,
            maxWidth: "900px",
            lineHeight: 1.3,
          }}
        >
          Selected work, experiments, and writing.
        </p>
      </div>
    </div>,
    { ...size },
  );
}
