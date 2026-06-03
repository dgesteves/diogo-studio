import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ContactInput } from "@/lib/contact-schema";

/**
 * Branded notification email sent to Diogo when the contact form is submitted.
 *
 * Email clients ignore most modern CSS, so everything is inline styles with
 * web-safe fallbacks. The palette mirrors the site's deep-space console:
 * near-black surface, hairline borders, signal-cyan accent, mono labels.
 *
 * Rendered server-side by Resend (`emails.send({ react })`).
 */

type ContactNotificationProps = Pick<
  ContactInput,
  "name" | "email" | "company" | "roleAltitude" | "message"
> & {
  /** ISO timestamp of receipt — rendered for the audit trail. */
  receivedAt: string;
};

const INK = "#0a0a0a";
const SURFACE = "#141414";
const BORDER = "#2a2a2a";
const TEXT = "#ededed";
const MUTED = "#a1a1aa";
const ACCENT = "#22d3ee";

const labelStyle: React.CSSProperties = {
  fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
  fontSize: "10px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: MUTED,
  margin: "0 0 4px",
};

const valueStyle: React.CSSProperties = {
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontSize: "15px",
  color: TEXT,
  margin: "0 0 20px",
  lineHeight: 1.5,
};

export function ContactNotification({
  name,
  email,
  company,
  roleAltitude,
  message,
  receivedAt,
}: ContactNotificationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`New inbound from ${name}${company ? ` · ${company}` : ""}`}</Preview>
      <Body
        style={{
          backgroundColor: INK,
          margin: 0,
          padding: "32px 0",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <Section style={{ padding: "28px 32px 0" }}>
            <Text
              style={{
                fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: ACCENT,
                margin: "0 0 6px",
              }}
            >
              diogo.studio · inbound
            </Text>
            <Heading
              as="h1"
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: TEXT,
                letterSpacing: "-0.02em",
                margin: "0 0 4px",
              }}
            >
              New contact submission
            </Heading>
            <Text style={{ fontSize: "12px", color: MUTED, margin: 0 }}>{receivedAt}</Text>
          </Section>

          <Hr style={{ borderColor: BORDER, margin: "24px 0" }} />

          <Section style={{ padding: "0 32px" }}>
            <Text style={labelStyle}>From</Text>
            <Text style={valueStyle}>
              {name}
              {"  "}
              <Link href={`mailto:${email}`} style={{ color: ACCENT, textDecoration: "none" }}>
                &lt;{email}&gt;
              </Link>
            </Text>

            {company ? (
              <>
                <Text style={labelStyle}>Company</Text>
                <Text style={valueStyle}>{company}</Text>
              </>
            ) : null}

            {roleAltitude ? (
              <>
                <Text style={labelStyle}>Context</Text>
                <Text style={valueStyle}>{roleAltitude}</Text>
              </>
            ) : null}

            <Text style={labelStyle}>Message</Text>
            <Text
              style={{
                ...valueStyle,
                whiteSpace: "pre-wrap",
                backgroundColor: INK,
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              {message}
            </Text>
          </Section>

          <Hr style={{ borderColor: BORDER, margin: "8px 0 24px" }} />

          <Section style={{ padding: "0 32px 28px" }}>
            <Text
              style={{
                fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: MUTED,
                margin: 0,
              }}
            >
              Reply directly to this email to reach {name}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
