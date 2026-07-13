"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/shared/data-table";
import { useTranslation } from "react-i18next";
import { Duration } from "@/models/duration-model";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useDurationsStore } from "@/stores/durations-store";

export function useDurationColumns(): ColumnDef<Duration>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("duration_name")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-36">{row.getValue("name")}</LongText>
      ),
      meta: {
        className: cn("sticky left-4 md:table-cell"),
        label: t("duration_name"),
      },
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("status")} />
      ),
      meta: { label: t("status") },
      cell: ({ row }) => {
        const status = row.getValue("status") as boolean;
        return (
          <Badge variant={status ? "success" : "destructive"}>
            {status ? t("active") : t("inactive")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("updated_at")} />
      ),
      meta: { label: t("updated_at") },
      cell: ({ row }) => (
        <Badge variant="secondary" className="max-w-36 text-xs">
          <LongText>{row.original.updated_at}</LongText>
        </Badge>
      ),
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
        const { setOpenDuration, setCurrentDurationId } = useDurationsStore();
        const { modulePermissions } = usePermissions();
        const isBlocked = !row.original.status;
        const tooltipMessage = isBlocked
          ? t("activate_duration")
          : t("deactivate_duration");

        return (
          <DataTableRowActions
            row={row}
            isBlocked={isBlocked}
            tooltipMessage={tooltipMessage}
            className="justify-end mr-4"
            onView={(data) => {
              setCurrentDurationId(data.id);
              setOpenDuration(DialogEnum.VIEW);
            }}
            onEdit={(data) => {
              setCurrentDurationId(data.id);
              setOpenDuration(DialogEnum.EDIT);
            }}
            onDelete={(data) => {
              setCurrentDurationId(data.id);
              setOpenDuration(DialogEnum.DELETE);
            }}
            onBlock={(data) => {
              setCurrentDurationId(data.id);
              setOpenDuration(DialogEnum.BLOCK);
            }}
            canView={modulePermissions.durations.canView}
            canEdit={modulePermissions.durations.canUpdate}
            canDelete={modulePermissions.durations.canDelete}
          />
        );
      },
      enableSorting: false,
    },
  ];
}
