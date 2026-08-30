import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import ErrorPage from "../src/app/error";
import NotFoundPage, { metadata } from "../src/app/not-found";

const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => undefined);

afterEach(() => {
  consoleErrorMock.mockClear();
});

test("the not-found boundary is branded, navigable, and excluded from indexing", () => {
  render(<NotFoundPage />);

  expect(screen.getByRole("heading", { name: "Nothing is running here." })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Return home" }).getAttribute("href")).toBe("/");
  expect(screen.getByRole("link", { name: "Browse guides" }).getAttribute("href")).toBe("/blog");
  expect(metadata.robots).toEqual({ follow: false, index: false });
});

test("the route error boundary reports the error and can retry", () => {
  const error = new Error("render failed");
  const reset = vi.fn();

  render(<ErrorPage error={error} reset={reset} />);

  expect(screen.getByRole("heading", { name: "The system lost the thread." })).toBeTruthy();
  expect(consoleErrorMock).toHaveBeenCalledWith(error);

  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).toHaveBeenCalledOnce();
});
