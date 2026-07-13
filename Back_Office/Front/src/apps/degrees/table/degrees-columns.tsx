"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/shared/data-table";
import { useTranslation } from "react-i18next";
import { Degree } from "@/models/degree-model";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useDegreesStore } from "@/stores/degrees-store";

export function useDegreeColumns(): ColumnDef<Degree>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("degree_name")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-36">{row.getValue("name")}</LongText>
      ),
      meta: {
        className: cn("sticky left-4 md:table-cell"),
        label: t("degree_name"),
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
        const { setOpenDegree, setCurrentDegreeId } = useDegreesStore();
        const { modulePermissions } = usePermissions();
        const isBlocked = !row.original.status;
        const tooltipMessage = isBlocked
          ? t("activate_degree")
          : t("deactivate_degree");

        return (
          <DataTableRowActions
            row={row}
            isBlocked={isBlocked}
            tooltipMessage={tooltipMessage}
            className="justify-end mr-4"
            onView={(data) => {
              setCurrentDegreeId(data.id);
              setOpenDegree(DialogEnum.VIEW);
            }}
            onEdit={(data) => {
              setCurrentDegreeId(data.id);
              setOpenDegree(DialogEnum.EDIT);
            }}
            onDelete={(data) => {
              setCurrentDegreeId(data.id);
              setOpenDegree(DialogEnum.DELETE);
            }}
            onBlock={(data) => {
              setCurrentDegreeId(data.id);
              setOpenDegree(DialogEnum.BLOCK);
            }}
            canView={modulePermissions.degrees.canView}
            canEdit={modulePermissions.degrees.canUpdate}
            canDelete={modulePermissions.degrees.canDelete}
          />
        );
      },
      enableSorting: false,
    },
  ];
}
