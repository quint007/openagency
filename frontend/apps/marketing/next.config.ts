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

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
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
