"use client";

import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import {
  IconFileDescription,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useCandidatureColumns } from "./table/candidatures-columns";
import { CandidatureModals } from "./candidature-modal";
import { BulkAcceptModal } from "./candidature-modal/bulk-accept-modal";
import { BulkRejectModal } from "./candidature-modal/bulk-reject-modal";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";
import { useCandidatureToolbarProps } from "./table/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { useCandidatures } from "@/hooks/use-candidatures";
import { DialogEnum, AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";
import type { Candidature } from "@/models/candidature-model";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type BulkTemplateType = "acceptance" | "disapproval";

import { PIPELINE_STEPS, DEFAULT_STEP, type PipelineStep } from "./pipeline";
import { hasCurrentStepScore, currentStepScore, stepScoreField } from "./scoring";
import { PipelineNav } from "./pipeline-nav";
import { usePermissions } from "@/hooks/use-permissions";

const statusTabs = [
  { value: "all", labelKey: "all", color: "text-foreground" },
  { value: "pending", labelKey: "candidature_status_pending", color: "text-amber-600 dark:text-amber-400" },
  { value: "accepted", labelKey: "candidature_status_accepted", color: "text-green-600 dark:text-green-400" },
  { value: "rejected", labelKey: "candidature_status_rejected", color: "text-red-600 dark:text-red-400" },
];

export function Candidatures() {
  const { t } = useTranslation();
  const { showAlert } = useAlertStore();
  const { queryParams, stepFilters, currentCandidatureId, openCandidature } = useCandidaturesStore();
  const selectedCandidatureId = openCandidature === DialogEnum.VIEW ? currentCandidatureId : null;
  const [statusFilter, setStatusFilter] = useState("all");
  const [stepFilter, setStepFilter] = useState("all");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkAcceptOpen, setBulkAcceptOpen] = useState(false);

  // Only send `search` to the server. All toolbar filters (type, gender,
  // degree, subject, score_sort) are stored per-step and applied client-side
  // after the step filter so each pipeline step has its own independent scope.
  // Memoized so the react-query key stays referentially stable.
  const fetchParams = useMemo(
    () => ({ search: queryParams.search }),
    [queryParams.search]
  );
  const { data: candidatures } = useCandidatures(fetchParams);
  const currentStepFilters = stepFilters[stepFilter as PipelineStep | 'all'] ?? {};
  const rawScoreSort = currentStepFilters.score_sort ?? "";
  const scoreDirection =
    rawScoreSort === "desc" || rawScoreSort.endsWith(":desc")
      ? "desc"
      : rawScoreSort === "asc" || rawScoreSort.endsWith(":asc")
        ? "asc"
        : null;
  const { modulePermissions } = usePermissions();
  const canUpdateCandidatures = modulePermissions.candidatures.canUpdate;
  const allData = useMemo(() => candidatures ?? [], [candidatures]);

  // Statuts par étape réels (colonnes step1..step5_status) : une ligne apparaît
  // dans chaque étape qu'elle a atteinte (NULL = pas encore atteinte).
  const stepStatusCol = (step: string): keyof Candidature => {
    const idx = PIPELINE_STEPS.indexOf(step as (typeof PIPELINE_STEPS)[number]);
    return `step${idx === -1 ? 1 : idx + 1}_status` as keyof Candidature;
  };

  const stepCounts = useMemo(() => {
    const map: Record<string, number> = { all: allData.length };
    for (const step of PIPELINE_STEPS) {
      const col = stepStatusCol(step);
      map[step] = allData.filter((d) => d[col] != null).length;
    }
    return map;
  }, [allData]);

  const stepData = useMemo(() => {
    if (stepFilter === "all") return allData;
    const col = stepStatusCol(stepFilter);
    return allData.filter((d) => d[col] != null);
  }, [allData, stepFilter]);

  // Client-side toolbar filters applied AFTER the step filter so each step
  // (including "all") has its own independent filter scope.
  const { candidature_type: stepType, gender: stepGender, degree: stepDegree, subject_name: stepSubject, score_min: stepScoreMin, score_max: stepScoreMax } = currentStepFilters;
  const filteredData = useMemo(() => {
    let result = stepData;
    if (stepType && stepType !== "all") {
      result = result.filter((d) => {
        const hasSecond = !!d.full_name2;
        return stepType === "pair" ? hasSecond : !hasSecond;
      });
    }
    if (stepGender && stepGender !== "all") {
      result = result.filter((d) => d.gender1 === stepGender || d.gender2 === stepGender);
    }
    if (stepDegree && stepDegree !== "all") {
      result = result.filter((d) => d.degree1 === stepDegree || d.degree2 === stepDegree);
    }
    if (stepSubject && stepSubject !== "all") {
      result = result.filter((d) => d.subject_name === stepSubject);
    }
    // Score range on the active tab's score column ("all" tab uses each row's
    // own current-step score, mirroring the sort below and the backend CASE).
    const min = stepScoreMin === '' || stepScoreMin == null ? NaN : Number(stepScoreMin);
    const max = stepScoreMax === '' || stepScoreMax == null ? NaN : Number(stepScoreMax);
    if (!Number.isNaN(min) || !Number.isNaN(max)) {
      const bounds = [min, max].filter((v) => !Number.isNaN(v));
      const low = Math.min(...bounds);
      const high = Math.max(...bounds);
      result = result.filter((d) => {
        const s = stepFilter === "all" ? currentStepScore(d) : Number((d as any)[stepScoreField(stepFilter)] ?? 0);
        return s >= low && s <= high;
      });
    }
    return result;
  }, [stepData, stepType, stepGender, stepDegree, stepSubject, stepScoreMin, stepScoreMax, stepFilter]);

  // Statut affiché : celui de l'étape consultée (stepN_status), pas celui de
  // l'étape courante. Une candidature acceptée en CV puis passée au quiz
  // affiche donc "accepted" dans l'onglet CV et "pending" dans l'onglet quiz.
  const displayStatus = useCallback(
    (d: Candidature): string => {
      if (stepFilter === "all") return d.status || "pending";
      const col = stepStatusCol(stepFilter);
      const v = d[col] as unknown as string | null | undefined;
      return v || d.status || "pending";
    },
    [stepFilter]
  );

  const counts = useMemo(() => {
    const pending = filteredData.filter((d) => displayStatus(d) === "pending").length;
    const accepted = filteredData.filter((d) => {
      const s = displayStatus(d);
      return s === "accepted" || s === "invited";
    }).length;
    const rejected = filteredData.filter((d) => displayStatus(d) === "rejected").length;
    return { all: filteredData.length, pending, accepted, rejected };
  }, [filteredData, displayStatus]);

  const data = useMemo(() => {
    if (statusFilter === "all") return filteredData;
    if (statusFilter === "pending") return filteredData.filter((d) => displayStatus(d) === "pending");
    if (statusFilter === "accepted")
      return filteredData.filter((d) => {
        const s = displayStatus(d);
        return s === "accepted" || s === "invited";
      });
    return filteredData.filter((d) => displayStatus(d) === statusFilter);
  }, [filteredData, statusFilter, displayStatus]);

  // Score sort, applied automatically per step tab: on a step tab rows are
  // ordered by that step's score column; on "all" each row uses its own
  // current-step score.
  const sortedData = useMemo(() => {
    if (!scoreDirection) return data;
    const scoreOf = (d: Candidature): number => {
      if (stepFilter === "all") return currentStepScore(d);
      const field = stepScoreField(stepFilter) as keyof Candidature;
      const v = d[field];
      return typeof v === "number" ? v : Number(v) || 0;
    };
    const mul = scoreDirection === "asc" ? 1 : -1;
    return [...data].sort((a, b) => (scoreOf(a) - scoreOf(b)) * mul);
  }, [data, scoreDirection, stepFilter]);

  // Bulk selection is restricted to pending rows (active step tab status):
  // non-pending checkboxes render disabled and select-all skips them.
  const rowCanSelect = useCallback(
    (row: { original: Candidature }) =>
      displayStatus(row.original) === "pending",
    [displayStatus]
  );

  const handleSelectAllEmpty = useCallback(() => {
    showAlert({ message: t("only_pending_selectable"), type: AlertEnum.INFO });
  }, [showAlert, t]);

  const selectedRows = useMemo(
    () => data.filter((c) => rowSelection[String(c.id)]),
    [data, rowSelection]
  );

  const pendingSelected = useMemo(
    () => selectedRows.filter((c) => displayStatus(c) === "pending"),
    [selectedRows, displayStatus]
  );

  const startBulk = (templateType: BulkTemplateType) => {
    if (pendingSelected.length === 0) {
      showAlert({ message: t("no_pending_selected"), type: AlertEnum.INFO });
      return;
    }
    if (!pendingSelected.every(hasCurrentStepScore)) {
      showAlert({ message: t("score_required_bulk"), type: AlertEnum.WARNING });
      return;
    }
    if (templateType === "disapproval") {
      // Bulk rejection: a single email view + one rejection reason applies
      // to the whole selection, so the task is done once instead of once per
      // candidate.
      setBulkRejectOpen(true);
      return;
    }
    // Bulk acceptance: ONE email view for the whole selection; a single Send
    // click invites every selected row (no per-candidate clicking).
    setBulkAcceptOpen(true);
  };

  const columns = useCandidatureColumns(
    (candidature) => {
      setStepFilter(candidature.step || DEFAULT_STEP);
    },
    stepFilter !== "all" && canUpdateCandidatures,
    displayStatus,
    stepFilter === "all" ? undefined : stepFilter
  );
  const toolbarProps = useCandidatureToolbarProps({
    stepFilter,
  });

  return (
    <>
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconFileDescription className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("candidature_management")}
          </h2>
        </div>
        <div className="mt-4 mb-3">
          <PipelineNav
            value={stepFilter}
            counts={stepCounts}
            onValueChange={(value) => {
              setStepFilter(value);
              setRowSelection({});
            }}
          />
        </div>

        {stepFilter !== "all" && selectedRows.length > 0 && (
          <Card className="bg-card mb-3 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span>{t("x_selected", { count: selectedRows.length })}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
              >
                {t("clear_selection")}
              </Button>
            </div>
            {canUpdateCandidatures && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkAcceptOpen || bulkRejectOpen}
                  className="text-green-600 hover:border-green-300 hover:text-green-700"
                  onClick={() => startBulk("acceptance")}
                  title={t("send_confirmation_email")}
                >
                  <IconCheck size={16} />
                  {t("bulk_invite")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkAcceptOpen || bulkRejectOpen}
                  className="text-red-600 hover:border-red-300 hover:text-red-700"
                  onClick={() => startBulk("disapproval")}
                >
                  <IconX size={16} />
                  {t("bulk_reject")}
                </Button>
              </div>
            )}
          </Card>
        )}

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <DataTable
            data={sortedData}
            columns={columns}
            toolbarProps={toolbarProps}
            selectedRowId={selectedCandidatureId}
            enableRowSelection={stepFilter !== "all" && canUpdateCandidatures}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            rowCanSelect={rowCanSelect}
            onSelectAllEmpty={handleSelectAllEmpty}
            toolbarCenter={
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  {statusTabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                      <span className={cn(tab.color)}>{t(tab.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({counts[tab.value as keyof typeof counts] || 0})
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            }
          />
        </div>
      </Main>
      <CandidatureModals />
      {bulkAcceptOpen && (
        <BulkAcceptModal
          open
          onClose={() => {
            setBulkAcceptOpen(false);
            setRowSelection({});
          }}
          onSent={() => {
            setBulkAcceptOpen(false);
            setRowSelection({});
          }}
          candidatures={pendingSelected}
          step={stepFilter}
        />
      )}
      {bulkRejectOpen && (
        <BulkRejectModal
          open
          onClose={() => {
            setBulkRejectOpen(false);
            setRowSelection({});
          }}
          onSent={() => {
            setBulkRejectOpen(false);
            setRowSelection({});
          }}
          candidatures={selectedRows}
          step={stepFilter}
        />
      )}
    </>
  );
}
