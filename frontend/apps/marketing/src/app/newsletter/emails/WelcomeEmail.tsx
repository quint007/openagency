import { Html, Head, Body, Container, Heading, Text, Link, Section } from "@react-email/components";

type WelcomeEmailProps = {
  email: string;
  baseUrl: string;
};

export function WelcomeEmail({ email, baseUrl }: WelcomeEmailProps) {
  const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "20px", maxWidth: "600px" }}>
          <Section style={{ backgroundColor: "#ffffff", padding: "30px", borderRadius: "8px" }}>
            <Heading style={{ fontSize: "24px", marginBottom: "16px" }}>
              Welcome to Open Agency
            </Heading>
            <Text style={{ fontSize: "16px", lineHeight: "1.5" }}>
              You are now subscribed to the Open Agency newsletter. Expect focused emails on AI workflow patterns, guides, and tools.
            </Text>
            <Text style={{ fontSize: "14px", color: "#666666", marginTop: "16px" }}>
              No spam. No selling your email. Unsubscribe any time.
            </Text>
            <Text style={{ fontSize: "14px", marginTop: "24px" }}>
              <Link href={unsubscribeUrl}>Unsubscribe →</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}