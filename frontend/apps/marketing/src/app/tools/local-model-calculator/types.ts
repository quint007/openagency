export type OperatingSystem = "macos" | "windows" | "linux";

export type UseCase = "coding" | "writing" | "multimodal" | "privacy" | "general";

export type LocalModel = {
  description: string;
  id: string;
  minRamGb: number;
  minVramGb: number | null;
  name: string;
  os: OperatingSystem[];
  provider: string;
  recommendedRamGb: number;
  strengths: UseCase[];
  tags: string[];
  url: string;
};

export type CalculatorInputs = {
  email: string;
  os: OperatingSystem;
  ramGb: number;
  useCase: UseCase;
  vramGb: number;
};

export type ModelMatch = {
  model: LocalModel;
  reasons: string[];
  score: number;
};

export type CalculatorResult = {
  alternatives: ModelMatch[];
  recommended: ModelMatch;
};
