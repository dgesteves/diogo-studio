import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0c0f",
        backgroundImage:
          "radial-gradient(140% 120% at 50% 0%, #161a20 0%, #0a0c0f 55%), radial-gradient(90% 90% at 50% 125%, rgba(34,211,238,0.20) 0%, rgba(10,12,15,0) 70%)",
        color: "#22d3ee",
        border: "1px solid #262b33",
        borderRadius: "40px",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
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
