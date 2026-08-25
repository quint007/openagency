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

export type CalculatorMachineProfile = {
  readonly os: OperatingSystem;
  readonly ramGb: number;
  readonly useCase: UseCase;
  readonly vramGb: number;
};

export type CalculatorInputs = CalculatorMachineProfile & {
  readonly email: string;
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
