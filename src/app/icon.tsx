import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        fontSize: "18px",
        letterSpacing: "-0.02em",
        borderRadius: "6px",
      }}
    >
      DE
    </div>,
    { ...size },
  );
}
