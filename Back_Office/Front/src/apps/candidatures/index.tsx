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
import { SendEmailModal } from "./candidature-modal/send-email-modal";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo, useState } from "react";
import { useCandidatureToolbarProps } from "./table/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { useCandidatures, useUpdateCandidature } from "@/hooks/use-candidatures";
import { DialogEnum, AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";
import type { Candidature } from "@/models/candidature-model";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type BulkTemplateType = "acceptance" | "disapproval";

interface BulkState {
  queue: Candidature[];
  index: number;
  templateType: BulkTemplateType;
}

import { PIPELINE_STEPS, DEFAULT_STEP } from "./pipeline";
import { hasCurrentStepScore } from "./scoring";
import { PipelineNav } from "./pipeline-nav";

const statusTabs = [
  { value: "all", labelKey: "all", color: "text-foreground" },
  { value: "pending", labelKey: "candidature_status_pending", color: "text-amber-600 dark:text-amber-400" },
  { value: "accepted", labelKey: "candidature_status_accepted", color: "text-green-600 dark:text-green-400" },
  { value: "rejected", labelKey: "candidature_status_rejected", color: "text-red-600 dark:text-red-400" },
];

export function Candidatures() {
  const { t } = useTranslation();
  const { showAlert } = useAlertStore();
  const { queryParams, currentCandidatureId, openCandidature } = useCandidaturesStore();
  const selectedCandidatureId = openCandidature === DialogEnum.VIEW ? currentCandidatureId : null;
  const [statusFilter, setStatusFilter] = useState("all");
  const [stepFilter, setStepFilter] = useState("all");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulk, setBulk] = useState<BulkState | null>(null);

  const { data: candidatures } = useCandidatures(queryParams);
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
    const pending = stepData.filter((d) => displayStatus(d) === "pending").length;
    const accepted = stepData.filter((d) => {
      const s = displayStatus(d);
      return s === "accepted" || s === "invited";
    }).length;
    const rejected = stepData.filter((d) => displayStatus(d) === "rejected").length;
    return { all: stepData.length, pending, accepted, rejected };
  }, [stepData, displayStatus]);

  const data = useMemo(() => {
    if (statusFilter === "all") return stepData;
    if (statusFilter === "pending") return stepData.filter((d) => displayStatus(d) === "pending");
    if (statusFilter === "accepted")
      return stepData.filter((d) => {
        const s = displayStatus(d);
        return s === "accepted" || s === "invited";
      });
    return stepData.filter((d) => displayStatus(d) === statusFilter);
  }, [stepData, statusFilter, displayStatus]);

  const selectedRows = useMemo(
    () => data.filter((c) => rowSelection[String(c.id)]),
    [data, rowSelection]
  );

  const updateMutation = useUpdateCandidature();

  const handleBulkAdvance = () => {
    const queue = selectedRows.filter(
      (c) => displayStatus(c) === "pending"
    );
    if (queue.length === 0) {
      showAlert({ message: t("no_pending_selected"), type: AlertEnum.INFO });
      return;
    }
    if (!queue.every(hasCurrentStepScore)) {
      showAlert({ message: t("score_required_bulk"), type: AlertEnum.WARNING });
      return;
    }
    // Le backend marque l'étape courante accepted et crée l'étape suivante en pending.
    queue.forEach((candidature) => {
      updateMutation.mutate({
        id: candidature.id,
        data: { status: "accepted" },
      });
    });
    setRowSelection({});
  };

  const startBulk = (templateType: BulkTemplateType) => {
    const queue = selectedRows.filter(
      (c) => displayStatus(c) === "pending"
    );
    if (queue.length === 0) {
      showAlert({ message: t("no_pending_selected"), type: AlertEnum.INFO });
      return;
    }
    if (!queue.every(hasCurrentStepScore)) {
      showAlert({ message: t("score_required_bulk"), type: AlertEnum.WARNING });
      return;
    }
    setBulk({ queue, index: 0, templateType });
  };

  const handleBulkSent = () => {
    if (!bulk) return;
    const isLast = bulk.index + 1 >= bulk.queue.length;
    if (isLast) {
      setBulk(null);
      setRowSelection({});
    } else {
      setBulk({ ...bulk, index: bulk.index + 1 });
    }
  };

  const handleBulkClose = () => {
    setBulk(null);
    setRowSelection({});
  };

  const columns = useCandidatureColumns(
    (candidature) => {
      setStepFilter(candidature.step || DEFAULT_STEP);
    },
    stepFilter !== "all",
    displayStatus
  );
  const toolbarProps = useCandidatureToolbarProps();

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:border-green-300 hover:text-green-700"
                onClick={handleBulkAdvance}
                title={t("advance_to_next_step")}
              >
                <IconCheck size={16} />
                {t("bulk_advance")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!!bulk}
                className="text-red-600 hover:border-red-300 hover:text-red-700"
                onClick={() => startBulk("disapproval")}
              >
                <IconX size={16} />
                {t("bulk_reject")}
              </Button>
            </div>
          </Card>
        )}

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            selectedRowId={selectedCandidatureId}
            enableRowSelection={stepFilter !== "all"}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
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
      {bulk && bulk.index < bulk.queue.length && (
        <SendEmailModal
          open
          onClose={handleBulkClose}
          onSent={handleBulkSent}
          candidature={bulk.queue[bulk.index]}
          templateType={bulk.templateType}
          bulkIndex={bulk.index}
          bulkTotal={bulk.queue.length}
        />
      )}
    </>
  );
}
