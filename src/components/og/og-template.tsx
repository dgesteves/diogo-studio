import { ImageResponse } from "next/og";
import { brandColors } from "@/config/brand";
import { siteConfig } from "@/config/site";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const INK = "#0a0a0a";
const SURFACE = "#111317";
const BORDER = brandColors.edge;
const TEXT = "#f4f4f5";
const MUTED = "#9ca3af";
const ACCENT = brandColors.accent;

export function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        backgroundColor: INK,
        backgroundImage: `radial-gradient(900px 600px at 100% 0%, ${SURFACE} 0%, ${INK} 60%), radial-gradient(600px 400px at 0% 100%, rgba(34,211,238,0.12) 0%, rgba(10,10,10,0) 70%)`,
        color: TEXT,
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              border: `1px solid ${BORDER}`,
              backgroundColor: brandColors.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: ACCENT,
              fontWeight: 700,
              fontSize: "24px",
              letterSpacing: "0.02em",
            }}
          >
            {siteConfig.initials}
          </div>
          <span style={{ fontSize: "22px", color: MUTED, letterSpacing: "0.02em" }}>
            diogo.studio
          </span>
        </div>
        <span
          style={{
            fontSize: "16px",
            color: ACCENT,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <h1
          style={{
            fontSize: title.length > 48 ? "64px" : "80px",
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            margin: 0,
            maxWidth: "1000px",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              fontSize: "28px",
              color: MUTED,
              lineHeight: 1.35,
              margin: 0,
              maxWidth: "920px",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "18px",
          color: MUTED,
        }}
      >
        <span
          style={{
            display: "flex",
            width: "10px",
            height: "10px",
            borderRadius: "5px",
            backgroundColor: ACCENT,
          }}
        />
        <span>{siteConfig.role}</span>
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
