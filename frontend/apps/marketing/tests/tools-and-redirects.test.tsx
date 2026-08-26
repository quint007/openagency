import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { afterEach, expect, test } from "vitest";

import nextConfig from "../next.config";
import ToolsPage from "../src/app/tools/page";
import { middleware } from "../src/middleware";

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

test("tools index lists only the calculator without placeholder messaging", () => {
  render(<ToolsPage />);

  expect(screen.getAllByRole("link", { name: "Open resource" })).toHaveLength(1);
  expect(
    screen.getByRole("link", { name: "Open resource" }).getAttribute("href"),
  ).toBe("/tools/local-model-calculator");
  expect(screen.queryByText(/coming soon|in progress/i)).toBeNull();
});

test("middleware protects retired Awesome paths while preserving live public exclusions", () => {
  process.env.ALPHA_BASIC_AUTH_USERNAME = "alpha-user";
  process.env.ALPHA_BASIC_AUTH_PASSWORD = "alpha-password";

  expect(middleware(new NextRequest("http://localhost:3000/awesome")).status).toBe(401);
  expect(middleware(new NextRequest("http://localhost:3000/about")).status).toBe(200);
  expect(middleware(new NextRequest("http://localhost:3000/contact")).status).toBe(200);
  expect(middleware(new NextRequest("http://localhost:3000/privacy/cookies")).status).toBe(200);
  expect(middleware(new NextRequest("http://localhost:3000/tools")).status).toBe(200);
  expect(middleware(new NextRequest("http://localhost:3000/newsletter/unsubscribe")).status).toBe(200);
});
