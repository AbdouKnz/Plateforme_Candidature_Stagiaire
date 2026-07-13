"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/shared/data-table";
import { useTranslation } from "react-i18next";
import { Subject } from "@/models/subject-model";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useSubjectsStore } from "@/stores/subjects-store";

export function useSubjectColumns(): ColumnDef<Subject>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("subject_code")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-24 font-mono font-medium">{row.getValue("code")}</LongText>
      ),
      meta: {
        className: cn("sticky left-4 md:table-cell"),
        label: t("subject_code"),
      },
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("subject_name")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-36">{row.getValue("name")}</LongText>
      ),
      meta: { label: t("subject_name") },
    },
    {
      id: "technologies",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("technologies")} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-48">
          {row.original.technology_names.map((name) => (
            <Badge key={name} variant="outline" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      ),
      meta: { label: t("technologies") },
    },
    {
      id: "profiles",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("profiles")} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-48">
          {row.original.profile_names.map((name) => (
            <Badge key={name} variant="outline" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      ),
      meta: { label: t("profiles") },
    },
    {
      accessorKey: "priority_rank",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("priority_rank")} />
      ),
      cell: ({ row }) => {
        const rank = row.getValue("priority_rank") as string;
        const variant = rank === "Critical" ? "destructive" : rank === "High" ? "warning" : "secondary";
        return <Badge variant={variant}>{rank}</Badge>;
      },
      meta: { label: t("priority_rank") },
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
        const { setOpenSubject, setCurrentSubjectId } = useSubjectsStore();
        const { modulePermissions } = usePermissions();
        const isBlocked = !row.original.status;
        const tooltipMessage = isBlocked
          ? t("activate_subject")
          : t("deactivate_subject");

        return (
          <DataTableRowActions
            row={row}
            isBlocked={isBlocked}
            tooltipMessage={tooltipMessage}
            className="justify-end mr-4"
            onView={(data) => {
              setCurrentSubjectId(data.id);
              setOpenSubject(DialogEnum.VIEW);
            }}
            onEdit={(data) => {
              setCurrentSubjectId(data.id);
              setOpenSubject(DialogEnum.EDIT);
            }}
            onDelete={(data) => {
              setCurrentSubjectId(data.id);
              setOpenSubject(DialogEnum.DELETE);
            }}
            onBlock={(data) => {
              setCurrentSubjectId(data.id);
              setOpenSubject(DialogEnum.BLOCK);
            }}
            canView={modulePermissions.subjects.canView}
            canEdit={modulePermissions.subjects.canUpdate}
            canDelete={modulePermissions.subjects.canDelete}
          />
        );
      },
      enableSorting: false,
    },
  ];
}
