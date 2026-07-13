"use client";

import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { IconFileDescription, IconInfoCircle } from "@tabler/icons-react";
import { useCandidatureColumns } from "./table/candidatures-columns";
import { CandidatureModals } from "./candidature-modal";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { useCandidatureToolbarProps } from "./table/data";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { useCandidatures } from "@/hooks/use-candidatures";
import { DialogEnum } from "@/models/alert-model";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const statusTabs = [
  { value: "all", labelKey: "all", color: "text-foreground" },
  { value: "pending", labelKey: "candidature_status_pending", color: "text-amber-600 dark:text-amber-400" },
  { value: "invited", labelKey: "candidature_status_invited", color: "text-green-600 dark:text-green-400" },
  { value: "rejected", labelKey: "candidature_status_rejected", color: "text-red-600 dark:text-red-400" },
];

export function Candidatures() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, currentCandidatureId, openCandidature } = useCandidaturesStore();
  const selectedCandidatureId = openCandidature === DialogEnum.VIEW ? currentCandidatureId : null;
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: candidatures, isLoading } = useCandidatures(queryParams);
  const allData = useMemo(() => candidatures ?? [], [candidatures]);

  const counts = useMemo(() => {
    const pending = allData.filter((d) => !d.status || d.status === "pending").length;
    const invited = allData.filter((d) => d.status === "invited").length;
    const rejected = allData.filter((d) => d.status === "rejected").length;
    return { all: allData.length, pending, invited, rejected };
  }, [allData]);

  const data = useMemo(() => {
    if (statusFilter === "all") return allData;
    if (statusFilter === "pending") return allData.filter((d) => !d.status || d.status === "pending");
    return allData.filter((d) => d.status === statusFilter);
  }, [allData, statusFilter]);

  const columns = useCandidatureColumns();
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconFileDescription className="size-5" />
                {t("total_candidatures")}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={24}
                    strokeWidth={1.25}
                    className="text-muted-foreground scale-90"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {t("total_candidatures_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{allData.length}</div>
            </div>
          </Card>
        </div>

        <div className="mt-4 mb-3">
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
        </div>

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            selectedRowId={selectedCandidatureId}
          />
        </div>
      </Main>
      <CandidatureModals />
    </>
  );
}
