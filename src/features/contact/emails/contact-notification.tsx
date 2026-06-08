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
import type { ReactElement } from "react";
import type { ContactInput } from "../schemas/contact";

import {
  bodyStyle,
  containerStyle,
  eyebrowStyle,
  footerStyle,
  fromLinkStyle,
  headingStyle,
  hrBottomStyle,
  hrTopStyle,
  labelStyle,
  messageStyle,
  receivedStyle,
  valueStyle,
} from "./contact-notification-styles";

type ContactNotificationProps = Pick<
  ContactInput,
  "name" | "email" | "company" | "roleAltitude" | "message"
> & {
  receivedAt: string;
};

export function ContactNotification({
  name,
  email,
  company,
  roleAltitude,
  message,
  receivedAt,
}: ContactNotificationProps): ReactElement {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`New inbound from ${name}${company ? ` · ${company}` : ""}`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={{ padding: "28px 32px 0" }}>
            <Text style={eyebrowStyle}>diogo.studio · inbound</Text>
            <Heading as="h1" style={headingStyle}>
              New contact submission
            </Heading>
            <Text style={receivedStyle}>{receivedAt}</Text>
          </Section>

          <Hr style={hrTopStyle} />

          <Section style={{ padding: "0 32px" }}>
            <Text style={labelStyle}>From</Text>
            <Text style={valueStyle}>
              {name}
              {"  "}
              <Link href={`mailto:${email}`} style={fromLinkStyle}>
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
            <Text style={messageStyle}>{message}</Text>
          </Section>

          <Hr style={hrBottomStyle} />

          <Section style={{ padding: "0 32px 28px" }}>
            <Text style={footerStyle}>Reply directly to this email to reach {name}.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
