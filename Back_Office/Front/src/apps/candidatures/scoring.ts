import type { Candidature } from "@/models/candidature-model";
import { DEFAULT_STEP, type PipelineStep } from "./pipeline";

export const STEP_SCORE_FIELD: Record<PipelineStep, string> = {
  cv_screening: "score_cv_screening",
  online_quiz: "score_online_quiz",
  online_meeting: "score_online_meeting",
  f2f_meeting: "score_f2f_meeting",
  final_decision: "score_final_decision",
};

export function stepScoreField(step?: string): string {
  return STEP_SCORE_FIELD[(step || DEFAULT_STEP) as PipelineStep] ?? STEP_SCORE_FIELD.cv_screening;
}

export function currentStepScore(c: Candidature): number {
  const field = stepScoreField(c.step) as keyof Candidature;
  const value = c[field];
  return typeof value === "number" ? value : Number(value) || 0;
}

export function hasCurrentStepScore(c: Candidature): boolean {
  return currentStepScore(c) > 0;
}
