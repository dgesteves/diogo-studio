import type { CSSProperties } from "react";
import { brandColors } from "@/config/brand";

const INK = "#0a0a0a";
const SURFACE = "#111317";
const BORDER = brandColors.edge;
const TEXT = "#f4f4f5";
const MUTED = "#9ca3af";
const ACCENT = brandColors.accent;

export const rootStyle: CSSProperties = {
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
};

export const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
};

export const brandRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: "18px" };

export const logoStyle: CSSProperties = {
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
};

export const wordmarkStyle: CSSProperties = {
  fontSize: "22px",
  color: MUTED,
  letterSpacing: "0.02em",
};

export const eyebrowStyle: CSSProperties = {
  fontSize: "16px",
  color: ACCENT,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 600,
};

export const titleColStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

export function titleStyle(title: string): CSSProperties {
  return {
    fontSize: title.length > 48 ? "64px" : "80px",
    fontWeight: 700,
    lineHeight: 1.04,
    letterSpacing: "-0.035em",
    margin: 0,
    maxWidth: "1000px",
  };
}

export const subtitleStyle: CSSProperties = {
  fontSize: "28px",
  color: MUTED,
  lineHeight: 1.35,
  margin: 0,
  maxWidth: "920px",
};

export const footerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  fontSize: "18px",
  color: MUTED,
};

export const dotStyle: CSSProperties = {
  display: "flex",
  width: "10px",
  height: "10px",
  borderRadius: "5px",
  backgroundColor: ACCENT,
};
