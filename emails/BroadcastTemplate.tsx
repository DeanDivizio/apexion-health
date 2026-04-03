import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Markdown,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface BroadcastTemplateProps {
  subject: string;
  body: string;
}

export function BroadcastTemplate({ subject, body }: BroadcastTemplateProps) {
  return (
    <Html style={{ backgroundColor: "#0a0a0a" }}>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Img
              src="https://beta.apexion.health/logo.webp"
              width={40}
              height={40}
              alt="Apexion Health"
              style={logoStyle}
            />
          </Section>

          <Section style={contentStyle}>
            <Heading style={subjectStyle}>{subject}</Heading>
            <Hr style={dividerStyle} />
            <Markdown
              markdownContainerStyles={markdownContainerStyle}
              markdownCustomStyles={{
                p: markdownParagraphStyle,
                h1: markdownH1Style,
                h2: markdownH2Style,
                h3: markdownH3Style,
                li: markdownListItemStyle,
                link: markdownLinkStyle,
                codeInline: markdownCodeStyle,
              }}
            >
              {body}
            </Markdown>
          </Section>

          <Hr style={dividerStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              You are receiving this email because you have an account with
              Apexion Health. This inbox is unmonitored.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: "0",
  padding: "24px 0",
};

const containerStyle = {
  backgroundColor: "#141414",
  border: "1px solid #262626",
  borderRadius: "8px",
  maxWidth: "600px",
  margin: "0 auto",
  overflow: "hidden",
};

const headerStyle = {
  backgroundColor: "#0d0d0d",
  borderBottom: "1px solid #262626",
  padding: "20px 32px",
  textAlign: "center" as const,
};

const logoStyle = {
  display: "block",
  margin: "0 auto",
};

const contentStyle = {
  padding: "32px",
};

const subjectStyle = {
  color: "#f5f5f5",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const dividerStyle = {
  borderColor: "#262626",
  borderTopWidth: "1px",
  margin: "20px 0",
};

const markdownContainerStyle: React.CSSProperties = {
  color: "#d4d4d4",
  fontSize: "15px",
  lineHeight: "1.7",
};

const markdownParagraphStyle: React.CSSProperties = {
  color: "#d4d4d4",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const markdownH1Style: React.CSSProperties = {
  color: "#f5f5f5",
  fontSize: "22px",
  fontWeight: "700",
  margin: "24px 0 12px",
};

const markdownH2Style: React.CSSProperties = {
  color: "#f5f5f5",
  fontSize: "18px",
  fontWeight: "600",
  margin: "20px 0 10px",
};

const markdownH3Style: React.CSSProperties = {
  color: "#e5e5e5",
  fontSize: "16px",
  fontWeight: "600",
  margin: "16px 0 8px",
};

const markdownListItemStyle: React.CSSProperties = {
  color: "#d4d4d4",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "4px 0",
};

const markdownLinkStyle: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "underline",
};

const markdownCodeStyle: React.CSSProperties = {
  backgroundColor: "#1f1f1f",
  borderRadius: "4px",
  color: "#a78bfa",
  fontFamily: "ui-monospace, monospace",
  fontSize: "13px",
  padding: "2px 6px",
};

const footerStyle = {
  padding: "0 32px 24px",
};

const footerTextStyle = {
  color: "#525252",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};
