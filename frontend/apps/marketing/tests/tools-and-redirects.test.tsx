import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { afterEach, expect, test } from "vitest";

import nextConfig, { securityHeaders } from "../next.config";
import ToolsPage from "../src/app/tools/page";
import { proxy } from "../src/proxy";

const originalUsername = process.env.ALPHA_BASIC_AUTH_USERNAME;
const originalPassword = process.env.ALPHA_BASIC_AUTH_PASSWORD;

afterEach(() => {
  if (originalUsername === undefined) {
    delete process.env.ALPHA_BASIC_AUTH_USERNAME;
  } else {
    process.env.ALPHA_BASIC_AUTH_USERNAME = originalUsername;
  }

  if (originalPassword === undefined) {
    delete process.env.ALPHA_BASIC_AUTH_PASSWORD;
  } else {
    process.env.ALPHA_BASIC_AUTH_PASSWORD = originalPassword;
  }
});

test("retired resource routes have exact permanent redirects", async () => {
  const redirects = (await nextConfig.redirects?.()) ?? [];

  expect(redirects).toEqual([
    { source: "/awesome", destination: "/", permanent: true },
    { source: "/awesome/agents", destination: "/", permanent: true },
    { source: "/awesome/workflows", destination: "/", permanent: true },
    { source: "/awesome/prompts", destination: "/", permanent: true },
    { source: "/tools/prompt-brief", destination: "/tools", permanent: true },
    { source: "/tools/launch-checklist", destination: "/tools", permanent: true },
    { source: "/tools/review-rubric", destination: "/tools", permanent: true },
    { source: "/newsletter", destination: "/#newsletter", permanent: true },
  ]);
});

test("all marketing routes receive the security header contract", async () => {
  const headers = (await nextConfig.headers?.()) ?? [];
  const headerValues = Object.fromEntries(
    securityHeaders.map(({ key, value }) => [key, value]),
  );

  expect(headers).toEqual([{ source: "/:path*", headers: securityHeaders }]);
  expect(headerValues["Content-Security-Policy"]).toContain("default-src 'self'");
  expect(headerValues["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  expect(headerValues["Permissions-Policy"]).toBe("camera=(), geolocation=(), microphone=()");
  expect(headerValues["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  expect(headerValues["X-Content-Type-Options"]).toBe("nosniff");
  expect(headerValues["X-Frame-Options"]).toBe("DENY");
});

test("tools index lists only the calculator without placeholder messaging", () => {
  render(<ToolsPage />);

  expect(screen.getAllByRole("link", { name: "Open resource" })).toHaveLength(1);
  expect(
    screen.getByRole("link", { name: "Open resource" }).getAttribute("href"),
  ).toBe("/tools/local-model-calculator");
  expect(screen.queryByText(/coming soon|in progress/i)).toBeNull();
});

test("proxy protects retired Awesome paths while preserving live public exclusions", () => {
  process.env.ALPHA_BASIC_AUTH_USERNAME = "alpha-user";
  process.env.ALPHA_BASIC_AUTH_PASSWORD = "alpha-password";

  expect(proxy(new NextRequest("http://localhost:3000/awesome")).status).toBe(401);
  expect(proxy(new NextRequest("http://localhost:3000/about")).status).toBe(200);
  expect(proxy(new NextRequest("http://localhost:3000/contact")).status).toBe(200);
  expect(proxy(new NextRequest("http://localhost:3000/privacy/cookies")).status).toBe(200);
  expect(proxy(new NextRequest("http://localhost:3000/tools")).status).toBe(200);
  expect(proxy(new NextRequest("http://localhost:3000/newsletter/unsubscribe")).status).toBe(200);
});
