import { apiClient } from "@open-agency/api-client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ComingSoonBanner } from "../../components/ComingSoon";
import { ResourceIndexPage } from "../../(resources)/ResourceIndexPage";
import { homepageContent } from "../../homepage-content";
import { LocalModelCalculator } from "../local-model-calculator/LocalModelCalculator";
import { LocalModelResult } from "../local-model-calculator/LocalModelResult";
import type { CalculatorMachineProfile } from "../local-model-calculator/types";

const tools = homepageContent.toolsTeaser.cards.map((card) => ({
  ...card,
  slug: card.href.replace("/tools/", ""),
  title: card.label,
}));

const LOCAL_MODEL_CALCULATOR_SLUG = "local-model-calculator";

const calculatorMachineProfileSchema = z.object({
  os: z.enum(["macos", "windows", "linux"]),
  ramGb: z.number().finite(),
  useCase: z.enum(["coding", "writing", "multimodal", "privacy", "general"]),
  vramGb: z.number().finite(),
});

const localModelSchema = z.object({
  description: z.string(),
  id: z.string(),
  minRamGb: z.number(),
  minVramGb: z.number().nullable(),
  name: z.string(),
  os: z.array(z.enum(["macos", "windows", "linux"])),
  provider: z.string(),
  recommendedRamGb: z.number(),
  strengths: z.array(z.enum(["coding", "writing", "multimodal", "privacy", "general"])),
  tags: z.array(z.string()),
  url: z.string(),
});

const calculatorResultSchema = z.object({
  alternatives: z.array(
    z.object({
      model: localModelSchema,
      reasons: z.array(z.string()),
      score: z.number(),
    }),
  ),
  recommended: z.object({
    model: localModelSchema,
    reasons: z.array(z.string()),
    score: z.number(),
  }),
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
    const result = calculatorResultSchema.safeParse(submission.result);

    if (!inputs || !result.success) {
      return null;
    }

    return { inputs, result: result.data };
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
              <LocalModelResult result={shared.result} shareUrl={`/tools/local-model-calculator?id=${id}`} />
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
