import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

import {
  brandRowStyle,
  dotStyle,
  eyebrowStyle,
  footerStyle,
  headerRowStyle,
  logoStyle,
  rootStyle,
  subtitleStyle,
  titleColStyle,
  titleStyle,
  wordmarkStyle,
} from "./og-template-styles";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

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
    <div style={rootStyle}>
      <div style={headerRowStyle}>
        <div style={brandRowStyle}>
          <div style={logoStyle}>{siteConfig.initials}</div>
          <span style={wordmarkStyle}>diogo.studio</span>
        </div>
        <span style={eyebrowStyle}>{eyebrow}</span>
      </div>

      <div style={titleColStyle}>
        <h1 style={titleStyle(title)}>{title}</h1>
        {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
      </div>

      <div style={footerStyle}>
        <span style={dotStyle} />
        <span>{siteConfig.role}</span>
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
