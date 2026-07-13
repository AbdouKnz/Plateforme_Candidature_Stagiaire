import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/shared/data-table";
import { useTranslation } from "react-i18next";
import type { EmailLog } from "@/models/email-log-model";
import { DialogEnum } from "@/models/alert-model";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useEmailLogsStore } from "@/stores/email-logs-store";

export function useEmailLogColumns(): ColumnDef<EmailLog>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "sent_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("sent_at")} />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="max-w-38 text-xs">
          <LongText>{row.original.sent_at}</LongText>
        </Badge>
      ),
      meta: { className: cn("pl-6 md:table-cell"), label: t("sent_at") },
    },
    {
      accessorKey: "recipient",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("recipient")} />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("recipient")}</div>
      ),
      meta: { label: t("recipient") },
    },
    {
      accessorKey: "template_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("email_template_type")} />
      ),
      cell: ({ row }) => {
        const type = row.getValue("template_type") as string;
        const variantMap: Record<string, "blue" | "success" | "destructive" | "info"> = {
          confirmation: "blue",
          acceptance: "success",
          disapproval: "destructive",
          reopening: "info",
        };
        const typeLabel: Record<string, string> = {
          confirmation: t("email_template_type_confirmation"),
          acceptance: t("email_template_type_acceptance"),
          disapproval: t("email_template_type_disapproval"),
          reopening: t("email_template_type_reopening"),
        };
        return (
          <Badge variant={variantMap[type] ?? "default"} className="capitalize">
            {typeLabel[type] || type}
          </Badge>
        );
      },
      meta: { label: t("email_template_type") },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("status")} />
      ),
      cell: ({ row }) => (
        <Badge variant={row.getValue("status") === "sent" ? "success" : "secondary"} className="capitalize">
          {t(row.getValue("status") as string)}
        </Badge>
      ),
      meta: { label: t("status") },
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("actions")} />
      ),
      cell: ({ row }) => {
        const { setOpenEmailLog, setCurrentEmailLogId } = useEmailLogsStore();
        return (
          <DataTableRowActions
            row={row}
            onView={(data) => {
              setCurrentEmailLogId(data.id);
              setOpenEmailLog(DialogEnum.VIEW);
            }}
          />
        );
      },
      meta: { label: t("actions") },
    },
  ];
}
