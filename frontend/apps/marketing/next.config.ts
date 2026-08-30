import type { NextConfig } from "next";

function normalizeImageOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.startsWith("http") ? trimmedValue : `https://${trimmedValue}`;
}

const imageHostUrls = [
  normalizeImageOrigin(process.env.__NEXT_PRIVATE_ORIGIN),
  normalizeImageOrigin(process.env.PAYLOAD_API_URL),
  normalizeImageOrigin(process.env.NEXT_PUBLIC_SERVER_URL),
  normalizeImageOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  ),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
].filter((value): value is string => Boolean(value));

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
  "worker-src 'self' blob:",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/awesome", destination: "/", permanent: true },
      { source: "/awesome/agents", destination: "/", permanent: true },
      { source: "/awesome/workflows", destination: "/", permanent: true },
      { source: "/awesome/prompts", destination: "/", permanent: true },
      { source: "/tools/prompt-brief", destination: "/tools", permanent: true },
      { source: "/tools/launch-checklist", destination: "/tools", permanent: true },
      { source: "/tools/review-rubric", destination: "/tools", permanent: true },
      { source: "/newsletter", destination: "/#newsletter", permanent: true },
    ];
  },
  images: {
    remotePatterns: imageHostUrls.map((item) => {
      const url = new URL(item);

      return {
        hostname: url.hostname,
        pathname: "/**",
        port: url.port,
        protocol: url.protocol.replace(":", "") as "http" | "https",
      };
    }),
  },
  transpilePackages: ["@open-agency/ui"],
};

export default nextConfig;
