import { useTranslation } from "react-i18next";
import { useCandidatures, usePipeline } from "@/hooks/use-candidatures";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Candidature } from "@/models/candidature-model";

type StageCounts = { pending: number; accepted: number; rejected: number };

const STEPS = [
  { id: "cv", labelKey: "pipeline_step_cv_screening", fallback: "CV Screening", final: false },
  { id: "quiz", labelKey: "pipeline_step_online_quiz", fallback: "Online Quiz", final: false },
  { id: "online", labelKey: "pipeline_step_online_meeting", fallback: "Online Meeting", final: false },
  { id: "f2f", labelKey: "pipeline_step_f2f_meeting", fallback: "F2F Meeting", final: false },
  { id: "final", labelKey: "pipeline_step_final_decision", fallback: "Final Decision", final: false },
] as const;

const STATUS_ROWS = [
  { key: "pending" as const, labelKey: "pending", fallback: "Pending", dot: "bg-amber-500", bar: "bg-amber-500" },
  { key: "accepted" as const, labelKey: "accepted", fallback: "Accepted", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  { key: "rejected" as const, labelKey: "rejected", fallback: "Rejected", dot: "bg-red-500", bar: "bg-red-500" },
];

function normStage(step?: string | null): string {
  const s = (step ?? "").trim().toLowerCase();
  if (!s) return "cv";
  if (s === "cv" || s === "cv_screening" || s.includes("cv_screening")) return "cv";
  if (s === "quiz" || s === "online_quiz" || s.includes("quiz")) return "quiz";
  if (s === "online" || s === "online_meeting" || s.includes("online_meeting")) return "online";
  if (s === "f2f" || s === "f2f_meeting" || s.includes("f2f")) return "f2f";
  if (s === "final" || s === "final_decision" || s.includes("final")) return "final";
  return "cv";
}

function normStatus(status?: string | null): "pending" | "accepted" | "rejected" {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "accepted" || s === "invited" || s === "approved") return "accepted";
  if (s === "rejected" || s === "refused" || s === "declined" || s === "failed") return "rejected";
  return "pending";
}

// Pure aggregation, kept separate from the visual card.
// Missing values count as zero. Prefers real per-step columns when present,
// otherwise falls back to the legacy current step/status grouping.
export function aggregatePipelineStages(rows: Candidature[]): Record<string, StageCounts> {
  const acc: Record<string, StageCounts> = {};
  for (const s of STEPS) acc[s.id] = { pending: 0, accepted: 0, rejected: 0 };

  const hasStepColumns = rows.some((r) => r.step1_status !== undefined);
  if (hasStepColumns) {
    for (const r of rows) {
      STEPS.forEach((s, i) => {
        const v = r[`step${i + 1}_status` as keyof Candidature] as string | null | undefined;
        if (v == null) return;
        acc[s.id][normStatus(v)] += 1;
      });
    }
    return acc;
  }

  for (const r of rows) {
    acc[normStage(r.step)][normStatus(r.status)] += 1;
  }
  return acc;
}

export function KpiCards() {
  const { t } = useTranslation();
  const { data: candidatures, isLoading: rowsLoading, isError: rowsError } = useCandidatures();
  const { data: liveStages, isLoading: liveLoading, isError: liveError } = usePipeline();

  const counts = useMemo<Record<string, StageCounts> | null>(() => {
    if (liveStages && liveStages.length > 0) {
      const acc: Record<string, StageCounts> = {};
      for (const s of liveStages) {
        acc[s.id] = {
          pending: s.counts?.pending ?? 0,
          accepted: s.counts?.accepted ?? 0,
          rejected: s.counts?.rejected ?? 0,
        };
      }
      return acc;
    }
    if (!candidatures) return null;
    return aggregatePipelineStages(candidatures);
  }, [liveStages, candidatures]);

  const isLoading = (liveLoading || rowsLoading) && !counts;
  const hasFailed = liveError && rowsError && !counts;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STEPS.map((s) => (
          <div key={s.id} className="h-[248px] animate-pulse rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <p className="text-sm text-muted-foreground">
          {t("error_loading_pipeline") || "Failed to load pipeline data."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {STEPS.map((step, i) => {
        const c: StageCounts = counts?.[step.id] ?? { pending: 0, accepted: 0, rejected: 0 };
        const total = c.pending + c.accepted + c.rejected;
        return (
          <div
            key={step.id}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50",
              "bg-card transition-all duration-200",
              "hover:shadow-lg hover:-translate-y-0.5 hover:border-transparent",
              "fade-in",
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-semibold text-foreground">
                  {t(step.labelKey) || step.fallback}
                </span>
                {step.final ? (
                  <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
                    Final
                  </span>
                ) : null}
              </div>

              <div className="mt-3">
                <p className="truncate font-bold tracking-tight leading-none text-3xl text-foreground tabular-nums">
                  {total}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {t("total") || "Total"}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {STATUS_ROWS.map((row) => {
                  const value = c[row.key];
                  const width = total ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={row.key}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                          <span className={cn("size-1.5 shrink-0 rounded-full", row.dot)} />
                          <span className="truncate">{t(row.labelKey) || row.fallback}</span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-foreground">
                          {value}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", row.bar)}
                          style={{ width: `${Math.min(100, width)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
