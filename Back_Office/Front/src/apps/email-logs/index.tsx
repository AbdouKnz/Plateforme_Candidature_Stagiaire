import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { useEmailLogColumns } from "./table/columns";
import { EmailLogsModals } from "./email-log-modal";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useEmailLogs } from "@/hooks/use-email-logs";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconInfoCircle, IconSend } from "@tabler/icons-react";
import { useEmailLogsStore } from "@/stores/email-logs-store";
import { DialogEnum } from "@/models/alert-model";
import { exportEmailLogs } from "@/service/email-logs";

export function EmailLogs() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, currentEmailLogId, openEmailLog } = useEmailLogsStore();
  const selectedEmailLogId = openEmailLog === DialogEnum.VIEW ? currentEmailLogId : null;
  const { data: emailLogsResponse, isLoading } = useEmailLogs(queryParams);
  const data = useMemo(() => emailLogsResponse?.data ?? [], [emailLogsResponse?.data]);
  const pagination = useMemo(() => emailLogsResponse?.pagination ?? undefined, [emailLogsResponse?.pagination]);
  const columns = useEmailLogColumns();
  const totalEmailLogs = emailLogsResponse?.pagination?.totalRows;

  return (
    <>
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <IconSend className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("email_logs")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconSend className="size-5" />
                {t("total_email_logs")}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle size={24} strokeWidth={1.25} className="text-muted-foreground scale-90" />
                </TooltipTrigger>
                <TooltipContent>
                  {t("total_email_logs_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{totalEmailLogs}</div>
            </div>
          </Card>
        </div>

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12 mt-4">
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            queryParams={queryParams}
            setQueryParams={setQueryParams}
            pagination={pagination}
            selectedRowId={selectedEmailLogId}
            toolbarProps={{
              tableSearchProps: {
                placeholder: t("search_email_logs"),
                setQueryParams,
              },
              exportFunction: (props) =>
                exportEmailLogs(props.fileType, queryParams),
            }}
          />
        </div>
      </Main>
      <EmailLogsModals />
    </>
  );
}