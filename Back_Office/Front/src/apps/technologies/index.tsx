import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { IconCpu, IconInfoCircle } from "@tabler/icons-react";
import { Laptop } from "lucide-react";
import { useTechnologyColumns } from "./table/technologies-columns";
import { TechnologiesModals } from "./technology-modal";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useTechnologyToolbarProps } from "./table/data";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTechnologiesStore } from "@/stores/technologies-store";
import { useTechnologies } from "@/hooks/use-technologies";
import { DialogEnum } from "@/models/alert-model";

export function Technologies() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, currentTechnologyId, openTechnology } = useTechnologiesStore();
  const selectedTechnologyId = openTechnology === DialogEnum.VIEW ? currentTechnologyId : null;

  const { data: technologies, isLoading, isError, error } = useTechnologies(queryParams);
  const data = useMemo(() => technologies ?? [], [technologies]);

  const columns = useTechnologyColumns();
  const toolbarProps = useTechnologyToolbarProps();
  const totalTechnologies = data.length;
  const activeTechnologies = data.filter((d) => d.status).length;
  const inactiveTechnologies = data.filter((d) => !d.status).length;

  return (
    <>
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconCpu className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("technology_management")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <Laptop className="size-5" />
                {t("total_technologies")}
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
                  {t("total_technologies_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{totalTechnologies}</div>
            </div>
          </Card>
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <Laptop className="size-5 text-green-600" />
                {t("active_technologies")}
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
                  {t("active_technologies_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{activeTechnologies}</div>
            </div>
          </Card>
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <Laptop className="size-5 text-red-600" />
                {t("inactive_technologies")}
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
                  {t("inactive_technologies_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{inactiveTechnologies}</div>
            </div>
          </Card>
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12 mt-4">
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            selectedRowId={selectedTechnologyId}
          />
        </div>
      </Main>
      <TechnologiesModals />
    </>
  );
}
