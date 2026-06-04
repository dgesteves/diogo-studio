import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b0d10",
        backgroundImage: "radial-gradient(120% 120% at 50% 0%, #181c22 0%, #0b0d10 62%)",
        color: "#22d3ee",
        border: "1px solid #262b33",
        borderRadius: "7px",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        fontWeight: 700,
        fontSize: "16px",
        letterSpacing: "-0.04em",
      }}
    >
      DE
    </div>,
    { ...size },
  );
}
