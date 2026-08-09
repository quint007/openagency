import { localModels } from "./models";
import type { CalculatorInputs, CalculatorResult, LocalModel, ModelMatch, OperatingSystem, UseCase } from "./types";

const USE_CASE_WEIGHT = 3;
const RAM_WEIGHT = 2;
const VRAM_WEIGHT = 1.5;
const OS_WEIGHT = 0.5;

function buildReasons(match: ModelMatch, inputs: CalculatorInputs): string[] {
  const reasons = [...match.reasons];

  if (inputs.ramGb >= match.model.recommendedRamGb) {
    reasons.push(`Your ${inputs.ramGb} GB of RAM is more than the recommended ${match.model.recommendedRamGb} GB.`);
  } else if (inputs.ramGb >= match.model.minRamGb) {
    reasons.push(`Your ${inputs.ramGb} GB of RAM meets the minimum; expect slower loads.`);
  }

  if (match.model.minVramGb === null) {
    reasons.push("Runs on CPU, so no discrete GPU is required.");
  } else if (inputs.vramGb >= match.model.minVramGb) {
    reasons.push(`Your ${inputs.vramGb} GB of VRAM is enough for smooth GPU inference.`);
  } else {
    reasons.push("Your GPU VRAM is lower than ideal; quantization or CPU offloading may be needed.");
  }

  return reasons;
}

export function scoreModel(model: LocalModel, inputs: CalculatorInputs): ModelMatch {
  let score = 0;
  const reasons: string[] = [];

  // OS compatibility is required.
  if (!model.os.includes(inputs.os)) {
    return { model, score: 0, reasons: ["Not available for your operating system."] };
  }
  score += OS_WEIGHT;

  // RAM compatibility.
  if (inputs.ramGb < model.minRamGb) {
    return { model, score: 0, reasons: ["Requires more RAM than your device has."] };
  }
  if (inputs.ramGb >= model.recommendedRamGb) {
    score += RAM_WEIGHT;
    reasons.push("RAM is well matched.");
  } else {
    const ramRatio = (inputs.ramGb - model.minRamGb) / (model.recommendedRamGb - model.minRamGb);
    score += RAM_WEIGHT * Math.max(0, ramRatio);
    reasons.push("RAM meets the minimum; performance will be limited.");
  }

  // VRAM compatibility.
  if (model.minVramGb === null) {
    score += VRAM_WEIGHT;
    reasons.push("No discrete GPU required.");
  } else if (inputs.vramGb === 0) {
    // No GPU but model prefers one; still possible via CPU but heavily penalized.
    score += VRAM_WEIGHT * 0.1;
    reasons.push("No discrete GPU detected; the model will run on CPU.");
  } else if (inputs.vramGb >= model.minVramGb) {
    score += VRAM_WEIGHT;
    reasons.push("GPU VRAM is sufficient.");
  } else {
    const vramRatio = inputs.vramGb / model.minVramGb;
    score += VRAM_WEIGHT * Math.max(0.1, vramRatio);
    reasons.push("GPU VRAM is below the ideal; lower precision may help.");
  }

  // Use-case fit.
  if (model.strengths.includes(inputs.useCase)) {
    score += USE_CASE_WEIGHT;
    reasons.push(`Strong fit for ${inputs.useCase} tasks.`);
  } else if (inputs.useCase === "general" && model.strengths.includes("general")) {
    score += USE_CASE_WEIGHT;
    reasons.push("Good all-round choice.");
  } else if (inputs.useCase === "privacy" && model.strengths.includes("privacy")) {
    score += USE_CASE_WEIGHT;
    reasons.push("Runs fully offline for maximum privacy.");
  } else {
    score += USE_CASE_WEIGHT * 0.25;
    reasons.push(`Okay for ${inputs.useCase}, but not a primary strength.`);
  }

  return { model, score, reasons };
}

export function calculateBestModel(inputs: CalculatorInputs): CalculatorResult {
  const scored = localModels
    .map((model) => scoreModel(model, inputs))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    // Fallback: return a lightweight model with a warning.
    const fallback = localModels.find((model) => model.id === "llama-3.1-8b") ?? localModels[0];
    const match: ModelMatch = {
      model: fallback,
      score: 0,
      reasons: [
        "We could not find a model that comfortably fits your specs. Try increasing RAM or choosing a smaller quantization.",
      ],
    };
    return { recommended: match, alternatives: [] };
  }

  const [recommended, ...rest] = scored;

  return {
    recommended: { ...recommended, reasons: buildReasons(recommended, inputs) },
    alternatives: rest.slice(0, 2).map((match) => ({ ...match, reasons: buildReasons(match, inputs) })),
  };
}

export function normalizeOperatingSystem(value: string): OperatingSystem | null {
  if (value === "macos" || value === "windows" || value === "linux") {
    return value;
  }
  return null;
}

export function normalizeUseCase(value: string): UseCase | null {
  if (value === "coding" || value === "writing" || value === "multimodal" || value === "privacy" || value === "general") {
    return value;
  }
  return null;
}
