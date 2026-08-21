export const PIPELINE_STEPS = [
  "cv_screening",
  "online_quiz",
  "online_meeting",
  "f2f_meeting",
  "final_decision",
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export const DEFAULT_STEP = "cv_screening";

export const STEP_VARIANTS: Record<string, string> = {
  cv_screening: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  online_quiz: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  online_meeting: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  f2f_meeting: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  final_decision: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

export function stepPosition(step?: string): number {
  const idx = PIPELINE_STEPS.indexOf((step || DEFAULT_STEP) as PipelineStep);
  return idx === -1 ? 0 : idx;
}

export function nextPipelineStep(step?: string): PipelineStep | null {
  const idx = PIPELINE_STEPS.indexOf((step || DEFAULT_STEP) as PipelineStep);
  if (idx === -1 || idx === PIPELINE_STEPS.length - 1) return null;
  return PIPELINE_STEPS[idx + 1];
}
