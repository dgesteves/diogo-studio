import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)",
        color: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 700,
        fontSize: "92px",
        letterSpacing: "-0.04em",
      }}
    >
      DE
    </div>,
    { ...size },
  );
}
