"use client";

import { apiClient, localModelCalculatorToolSlug } from "@open-agency/api-client";
import { Alert, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@open-agency/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { calculateBestModel, normalizeOperatingSystem, normalizeUseCase } from "./score";
import type { CalculatorInputs, CalculatorResult } from "./types";
import { LocalModelResult } from "./LocalModelResult";

const OS_OPTIONS = [
  { label: "macOS", value: "macos" },
  { label: "Windows", value: "windows" },
  { label: "Linux", value: "linux" },
];

const RAM_OPTIONS = [8, 16, 32, 64, 128];

const VRAM_OPTIONS = [
  { label: "No discrete GPU / CPU only", value: 0 },
  { label: "8 GB", value: 8 },
  { label: "16 GB", value: 16 },
  { label: "24 GB", value: 24 },
  { label: "32 GB", value: 32 },
  { label: "48 GB", value: 48 },
  { label: "64 GB+", value: 64 },
];

const USE_CASE_OPTIONS = [
  { label: "Coding & software engineering", value: "coding" },
  { label: "Writing & long-form content", value: "writing" },
  { label: "Multimodal (image + text)", value: "multimodal" },
  { label: "Privacy-first offline use", value: "privacy" },
  { label: "General everyday tasks", value: "general" },
];

export function LocalModelCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get("id");

  const [inputs, setInputs] = useState<CalculatorInputs>({
    email: "",
    os: "macos",
    ramGb: 16,
    useCase: "general",
    vramGb: 0,
  });
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(existingId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateInput<K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) {
    setInputs((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!inputs.email.trim() || !inputs.email.includes("@")) {
      setError("Please enter a valid email address to see your recommendation.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { email, ...machineProfile } = inputs;
      const calculated = calculateBestModel(machineProfile);
      const submission = await apiClient.createToolSubmission({
        toolSlug: localModelCalculatorToolSlug,
        email: email.trim(),
        inputs: machineProfile,
      });

      setResult(calculated);
      setSubmissionId(submission.id);

      router.replace(`/tools/local-model-calculator?id=${encodeURIComponent(submission.id)}`);
    } catch (error) {
      if (error instanceof Error) {
        setError("We could not save your result. Please check your connection and try again.");
      } else {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const shareUrl = submissionId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/tools/local-model-calculator?id=${encodeURIComponent(submissionId)}`
    : "";

  if (result && submissionId) {
    return <LocalModelResult result={result} shareUrl={shareUrl} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error ? (
        <Alert className="border-destructive/20 bg-destructive/10 text-destructive-foreground">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Label htmlFor="os">Operating system</Label>
          <Select
            value={inputs.os}
            onValueChange={(value) => {
              const os = normalizeOperatingSystem(value);
              if (os) updateInput("os", os);
            }}
          >
            <SelectTrigger id="os" className="w-full">
              <SelectValue placeholder="Select your OS" />
            </SelectTrigger>
            <SelectContent>
              {OS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="ram">System RAM</Label>
          <Select
            value={String(inputs.ramGb)}
            onValueChange={(value) => updateInput("ramGb", Number(value))}
          >
            <SelectTrigger id="ram" className="w-full">
              <SelectValue placeholder="Select RAM" />
            </SelectTrigger>
            <SelectContent>
              {RAM_OPTIONS.map((gb) => (
                <SelectItem key={gb} value={String(gb)}>
                  {gb} GB
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="vram">GPU video memory (VRAM)</Label>
          <Select
            value={String(inputs.vramGb)}
            onValueChange={(value) => updateInput("vramGb", Number(value))}
          >
            <SelectTrigger id="vram" className="w-full">
              <SelectValue placeholder="Select VRAM" />
            </SelectTrigger>
            <SelectContent>
              {VRAM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="use-case">Primary use case</Label>
          <Select
            value={inputs.useCase}
            onValueChange={(value) => {
              const useCase = normalizeUseCase(value);
              if (useCase) updateInput("useCase", useCase);
            }}
          >
            <SelectTrigger id="use-case" className="w-full">
              <SelectValue placeholder="Select use case" />
            </SelectTrigger>
            <SelectContent>
              {USE_CASE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={inputs.email}
          onChange={(event) => updateInput("email", event.target.value)}
          required
        />
        <p className="text-sm text-on-surface-variant">
          We will send your recommendation here and use it to unlock the result on this page.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Calculating..." : "Find my best-fit model"}
      </Button>
    </form>
  );
}
