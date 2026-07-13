"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/shared/data-table";
import { useTranslation } from "react-i18next";
import { Type } from "@/models/type-model";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useTypesStore } from "@/stores/types-store";

export function useTypeColumns(): ColumnDef<Type>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("type_name")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-36">{row.getValue("name")}</LongText>
      ),
      meta: {
        className: cn("sticky left-4 md:table-cell"),
        label: t("type_name"),
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
        const { setOpenType, setCurrentTypeId } = useTypesStore();
        const { modulePermissions } = usePermissions();
        const isBlocked = !row.original.status;
        const tooltipMessage = isBlocked
          ? t("activate_type")
          : t("deactivate_type");

        return (
          <DataTableRowActions
            row={row}
            isBlocked={isBlocked}
            tooltipMessage={tooltipMessage}
            className="justify-end mr-4"
            onView={(data) => {
              setCurrentTypeId(data.id);
              setOpenType(DialogEnum.VIEW);
            }}
            onEdit={(data) => {
              setCurrentTypeId(data.id);
              setOpenType(DialogEnum.EDIT);
            }}
            onDelete={(data) => {
              setCurrentTypeId(data.id);
              setOpenType(DialogEnum.DELETE);
            }}
            onBlock={(data) => {
              setCurrentTypeId(data.id);
              setOpenType(DialogEnum.BLOCK);
            }}
            canView={modulePermissions.types.canView}
            canEdit={modulePermissions.types.canUpdate}
            canDelete={modulePermissions.types.canDelete}
          />
        );
      },
      enableSorting: false,
    },
  ];
}
