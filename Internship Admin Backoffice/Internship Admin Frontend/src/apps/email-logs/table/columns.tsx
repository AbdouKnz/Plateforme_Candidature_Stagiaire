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
import { templateTypeBadgeVariant } from "../template-type";

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
      accessorKey: "subject",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("email_subject")} />
      ),
      cell: ({ row }) => {
        const subject = row.original.subject || "-";
        return (
          <Badge
            variant={templateTypeBadgeVariant(row.original.template_type)}
            className="max-w-64 capitalize"
          >
            <LongText>{subject}</LongText>
          </Badge>
        );
      },
      meta: { label: t("email_subject") },
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
