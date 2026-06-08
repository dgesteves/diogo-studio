import type { CSSProperties } from "react";
import { brandColors } from "@/config/brand";

const INK = "#0a0a0a";
const SURFACE = "#141414";
const BORDER = "#2a2a2a";
const TEXT = "#ededed";
const MUTED = "#a1a1aa";
const ACCENT = brandColors.accent;

const MONO = "'SF Mono', ui-monospace, Menlo, monospace";
const SANS = "ui-sans-serif, system-ui, -apple-system, sans-serif";

export const labelStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "10px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: MUTED,
  margin: "0 0 4px",
};

export const valueStyle: CSSProperties = {
  fontFamily: SANS,
  fontSize: "15px",
  color: TEXT,
  margin: "0 0 20px",
  lineHeight: 1.5,
};

export const bodyStyle: CSSProperties = {
  backgroundColor: INK,
  margin: 0,
  padding: "32px 0",
  fontFamily: SANS,
};

export const containerStyle: CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  overflow: "hidden",
};

export const eyebrowStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "11px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: ACCENT,
  margin: "0 0 6px",
};

export const headingStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  color: TEXT,
  letterSpacing: "-0.02em",
  margin: "0 0 4px",
};

export const receivedStyle: CSSProperties = { fontSize: "12px", color: MUTED, margin: 0 };

export const hrTopStyle: CSSProperties = { borderColor: BORDER, margin: "24px 0" };

export const fromLinkStyle: CSSProperties = { color: ACCENT, textDecoration: "none" };

export const messageStyle: CSSProperties = {
  ...valueStyle,
  whiteSpace: "pre-wrap",
  backgroundColor: INK,
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  padding: "16px",
};

export const hrBottomStyle: CSSProperties = { borderColor: BORDER, margin: "8px 0 24px" };

export const footerStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: "10px",
  letterSpacing: "0.08em",
  color: MUTED,
  margin: 0,
};
