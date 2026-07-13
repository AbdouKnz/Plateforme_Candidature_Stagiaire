import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { useAuditColumns } from "./table/audit-columns";
import { AuditsModals } from "./audit-modal";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useAudits } from "@/hooks/use-audit";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconInfoCircle, IconClipboardList } from "@tabler/icons-react";
import { useAuditToolbarProps } from "./table/data";
import { useAuditStore } from "@/stores/audit-store";
import { DialogEnum } from "@/models/alert-model";
export function Audits() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, currentAuditId, openAudit } = useAuditStore();
  const selectedAuditId = openAudit === DialogEnum.VIEW ? currentAuditId : null;
  const { data: auditsResponse, isLoading } = useAudits(queryParams);
  const data = useMemo(() => auditsResponse?.data ?? [], [auditsResponse?.data]);
  const pagination = useMemo(() => auditsResponse?.pagination ?? undefined,[auditsResponse?.pagination]);
  const columns = useAuditColumns();
  const toolbarProps = useAuditToolbarProps();
  const totalAudits = auditsResponse?.pagination?.totalRows;
  return (
    <>
      <Main >
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <IconClipboardList className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("audit_log")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
     
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconClipboardList className="size-5" />
                {t("total_audit_logs")}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle size={24} strokeWidth={1.25} className="text-muted-foreground scale-90" />
                </TooltipTrigger>
                <TooltipContent>
                   {t("audit_logs_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{totalAudits}</div>
            </div>
          </Card>
       
        </div>


        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12 mt-4">
          <DataTable
            columns={columns}
            data={data}
            toolbarProps={toolbarProps}
            isLoading={isLoading}
            queryParams={queryParams}
            setQueryParams={setQueryParams}
            pagination={pagination}
            selectedRowId={selectedAuditId}
          />
        </div>
      </Main>
      <AuditsModals />
    </>
  );
}
