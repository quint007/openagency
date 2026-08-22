import { apiClient } from "@open-agency/api-client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoonBanner } from "../../components/ComingSoon";
import { ResourceIndexPage } from "../../(resources)/ResourceIndexPage";
import { homepageContent } from "../../homepage-content";
import { LocalModelCalculator } from "../local-model-calculator/LocalModelCalculator";
import { LocalModelResult } from "../local-model-calculator/LocalModelResult";
import { normalizeOperatingSystem, normalizeUseCase } from "../local-model-calculator/score";
import type { CalculatorInputs, CalculatorResult } from "../local-model-calculator/types";

const tools = homepageContent.toolsTeaser.cards.map((card) => ({
  ...card,
  slug: card.href.replace("/tools/", ""),
  title: card.label,
}));

const LOCAL_MODEL_CALCULATOR_SLUG = "local-model-calculator";

type ToolDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    return { title: "Tool not found" };
  }

  return {
    alternates: { canonical: tool.href },
    description: tool.description,
    title: `${tool.title} · Tools`,
  };
}

function parseSubmissionInputs(raw: unknown): CalculatorInputs | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const os = normalizeOperatingSystem(String(data.os ?? ""));
  const useCase = normalizeUseCase(String(data.useCase ?? ""));
  const ramGb = Number(data.ramGb);
  const vramGb = Number(data.vramGb);
  const email = String(data.email ?? "");

  if (!os || !useCase || Number.isNaN(ramGb) || Number.isNaN(vramGb)) {
    return null;
  }

  return { os, useCase, ramGb, vramGb, email };
}

async function loadSharedResult(submissionId: string | undefined) {
  if (!submissionId) {
    return null;
  }

  try {
    const submission = await apiClient.getToolSubmission(submissionId);

    if (!submission || submission.toolSlug !== LOCAL_MODEL_CALCULATOR_SLUG) {
      return null;
    }

    const inputs = parseSubmissionInputs(submission.inputs);
    const result = submission.result as {
      recommended?: unknown;
      alternatives?: unknown[];
    };

    if (!inputs || !result?.recommended) {
      return null;
    }

    return { inputs, result: result as CalculatorResult };
  } catch {
    return null;
  }
}

export default async function ToolDetailPage({ params, searchParams }: ToolDetailPageProps) {
  const { slug } = await params;
  const { id } = await searchParams;
  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    notFound();
  }

  if (slug === LOCAL_MODEL_CALCULATOR_SLUG) {
    const shared = await loadSharedResult(id);

    return (
      <ResourceIndexPage
        cards={tools.filter((item) => item.slug !== slug)}
        eyebrow="Tool"
        intro={tool.description}
        title={tool.title}
      >
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[100rem]">
            {shared ? (
              <LocalModelResult inputs={shared.inputs} result={shared.result} shareUrl={`/tools/local-model-calculator?id=${id}`} />
            ) : (
              <LocalModelCalculator />
            )}
          </div>
        </section>
      </ResourceIndexPage>
    );
  }

  // Temporary: remove this banner when the tools content is ready.
  return (
    <ResourceIndexPage
      cards={tools.filter((item) => item.slug !== slug)}
      banner={<ComingSoonBanner />}
      eyebrow="Tool"
      intro={tool.description}
      title={tool.title}
    />
  );
}
