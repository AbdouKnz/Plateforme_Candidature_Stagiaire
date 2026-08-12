import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STEP,
  STEP_VARIANTS,
  type PipelineStep,
} from "./pipeline";

interface PipelineStepCellProps {
  step?: string;
}

export function PipelineStepCell({ step }: PipelineStepCellProps) {
  const { t } = useTranslation();
  const current = (step || DEFAULT_STEP) as PipelineStep;

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase leading-none",
        STEP_VARIANTS[current] || STEP_VARIANTS[DEFAULT_STEP]
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {t(`pipeline_step_${current}`)}
    </span>
  );
}