import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("../src/app/(resources)/ResourceIndexPage", () => ({
  ResourceIndexPage: ({ children, intro, title }: { children: ReactNode; intro: string; title: string }) => (
    <main>
      <h1>{title}</h1>
      <p>{intro}</p>
      {children}
    </main>
  ),
}));

test("contact page renders the contact form", async () => {
  const { default: ContactPage } = await import("../src/app/contact/page");

  render(<ContactPage />);

  expect(screen.getByRole("heading", { name: "Contact" })).toBeTruthy();
  expect(screen.getByLabelText(/name/i)).toBeTruthy();
  expect(screen.getByLabelText(/email/i)).toBeTruthy();
  expect(screen.getByLabelText(/message/i)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
});
