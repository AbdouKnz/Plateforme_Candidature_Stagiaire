import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/shared/data-table";
import * as TablerIcons from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Audit } from "@/models/audit-model";
import { DialogEnum } from "@/models/alert-model";
import { auditActionTypes, formatAuditModule } from "./data";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useAuditStore } from "@/stores/audit-store";
import { formatAuditDate } from "../format-audit-date";

// Canonical icon per module (lowercased key): the module is the source of
// truth for display, so legacy/broken stored icon values ("x", "check",
// mismatched names) can never blank the cell. Every module keeps its own
// icon; unknown modules fall back to IconClipboardList.
export const AUDIT_MODULE_ICONS: Record<string, string> = {
  user: "IconUser",
  role: "IconShield",
  auth: "IconKey",
  session: "IconRefresh",
  setting: "IconSettings",
  degree: "IconSchool",
  technology: "IconCpu",
  profile: "IconIdBadge",
  duration: "IconClock",
  type: "IconTags",
  subject: "IconNotebook",
  candidature: "IconFileDescription",
  emailtemplate: "IconMail",
  emaillog: "IconSend",
  mailconfig: "IconMailCog",
  waitlist: "IconCalendarEvent",
};

const MODULE_ICON_FALLBACK = AUDIT_MODULE_ICONS;

export function useAuditColumns(): ColumnDef<Audit>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("date")} />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="max-w-38 text-xs">
          <LongText>{formatAuditDate(row.original.date)}</LongText>
        </Badge>
      ),
      meta: { className: cn("pl-6 md:table-cell"), label: t("date") },
    },
    {
      accessorKey: "actor_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("user")} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="font-medium">{row.getValue("actor_name")}</div>
        </div>
      ),
      meta: { label: t("user") },
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("action")} />
      ),
      cell: ({ row }) => {
        const actionType = row.getValue("action") as string;
        const variant =
          auditActionTypes[actionType as keyof typeof auditActionTypes]
            ?.variant ?? "default";

        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant} className="">
              {actionType === "accept" ? "Accept" : actionType === "reject" ? "Reject" : actionType}
            </Badge>
          </div>
        );
      },

      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      enableSorting: true,
      meta: { label: t("action") },
    },
    {
      accessorKey: "module",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("module")} />
      ),
      cell: ({ row }) => {
        const module = row.getValue("module") as string;
        type IconName = keyof typeof TablerIcons;

        // Module-canonical first: stored icon values are legacy/broken for
        // some rows ("x"/"check" on candidature). Stored value is only used
        // when valid and no module mapping exists; default guarantees an icon.
        const moduleIconName = MODULE_ICON_FALLBACK[module.toLowerCase()];
        const storedIconName = row.original.icon as IconName;
        const storedValid =
          !!storedIconName &&
          (TablerIcons as Record<string, unknown>)[storedIconName] !==
            undefined;
        const iconName = (moduleIconName ||
          (storedValid ? storedIconName : "") ||
          "IconClipboardList") as IconName;

        // Type-safe icon retrieval
        const Icon = TablerIcons[iconName] as
          | React.ComponentType<{
              size?: number;
              className?: string;
            }>
          | undefined;

        return (
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-muted-foreground" />}
            <span className="text-sm capitalize">{formatAuditModule(module)}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      enableSorting: true,
      meta: { label: t("module") },
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("actions")}
          className="flex justify-end mr-4"
        />
      ),
      cell: ({ row }) => {
        const { setOpenAudit, setCurrentAuditId } = useAuditStore();
        return (
          <DataTableRowActions
            row={row}
            className="justify-end mr-4"
            onCompare={(data) => {
              setCurrentAuditId(data.audit_id);
              setOpenAudit(DialogEnum.COMPARE);
            }}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
