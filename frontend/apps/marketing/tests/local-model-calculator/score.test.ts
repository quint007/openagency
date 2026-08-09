import { expect, test } from "vitest";

import { calculateBestModel, scoreModel } from "../../src/app/tools/local-model-calculator/score";
import type { CalculatorInputs } from "../../src/app/tools/local-model-calculator/types";

const baseInputs: CalculatorInputs = {
  email: "test@example.com",
  os: "macos",
  ramGb: 16,
  useCase: "general",
  vramGb: 0,
};

test("excludes models that do not support the chosen operating system", () => {
  const match = scoreModel(
    {
      description: "Windows-only model",
      id: "windows-only",
      minRamGb: 8,
      minVramGb: null,
      name: "Windows Only",
      os: ["windows"],
      provider: "Test",
      recommendedRamGb: 16,
      strengths: ["general"],
      tags: [],
      url: "https://example.com",
    },
    { ...baseInputs, os: "macos" },
  );

  expect(match.score).toBe(0);
});

test("excludes models that require more RAM than available", () => {
  const match = scoreModel(
    {
      description: "Hungry model",
      id: "hungry",
      minRamGb: 64,
      minVramGb: null,
      name: "Hungry",
      os: ["macos"],
      provider: "Test",
      recommendedRamGb: 128,
      strengths: ["general"],
      tags: [],
      url: "https://example.com",
    },
    { ...baseInputs, ramGb: 16 },
  );

  expect(match.score).toBe(0);
});

test("ranks a use-case match higher than a generic fit", () => {
  const codingInputs: CalculatorInputs = { ...baseInputs, useCase: "coding" };
  const codingMatch = calculateBestModel(codingInputs);

  expect(codingMatch.recommended.model.strengths).toContain("coding");
});

test("returns a fallback when no model matches the specs", () => {
  const result = calculateBestModel({ ...baseInputs, os: "linux", ramGb: 4 });

  expect(result.recommended.model).toBeDefined();
  expect(result.alternatives).toHaveLength(0);
});

test("prefers CPU-friendly models when no discrete GPU is present", () => {
  const result = calculateBestModel({ ...baseInputs, vramGb: 0, useCase: "general" });

  expect(result.recommended.model.minVramGb).toBeNull();
});
