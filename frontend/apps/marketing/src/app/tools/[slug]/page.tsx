import { apiClient, localModelCalculatorToolSlug } from "@open-agency/api-client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ResourceIndexPage } from "../../(resources)/ResourceIndexPage";
import { homepageContent } from "../../homepage-content";
import { LocalModelCalculator } from "../local-model-calculator/LocalModelCalculator";
import { LocalModelResult } from "../local-model-calculator/LocalModelResult";
import { calculateBestModel } from "../local-model-calculator/score";
import type { CalculatorMachineProfile } from "../local-model-calculator/types";

const tools = homepageContent.toolsTeaser.cards.map((card) => ({
  ...card,
  slug: card.href.replace("/tools/", ""),
  title: card.label,
}));

const LOCAL_MODEL_CALCULATOR_SLUG = localModelCalculatorToolSlug;

const calculatorMachineProfileSchema = z.object({
  os: z.enum(["macos", "windows", "linux"]),
  ramGb: z.number().finite(),
  useCase: z.enum(["coding", "writing", "multimodal", "privacy", "general"]),
  vramGb: z.number().finite(),
});

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

function parseSubmissionInputs(raw: unknown): CalculatorMachineProfile | null {
  const parsed = calculatorMachineProfileSchema.safeParse(raw);

  return parsed.success ? parsed.data : null;
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
    if (!inputs) {
      return null;
    }

    return { inputs, result: calculateBestModel(inputs) };
  } catch (error) {
    if (error instanceof Error) {
      return null;
    }

    throw error;
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
              <LocalModelResult
                result={shared.result}
                shareUrl={`/tools/local-model-calculator?id=${encodeURIComponent(id ?? "")}`}
              />
            ) : (
              <LocalModelCalculator />
            )}
          </div>
        </section>
      </ResourceIndexPage>
    );
  }

  notFound();
}
