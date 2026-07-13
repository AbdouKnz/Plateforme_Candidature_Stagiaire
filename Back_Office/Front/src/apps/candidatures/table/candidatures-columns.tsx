"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTableColumnHeader,
} from "@/components/shared/data-table";
import { useTranslation } from "react-i18next";
import { Candidature } from "@/models/candidature-model";
import { DialogEnum } from "@/models/alert-model";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { IconEye, IconCheck, IconX } from "@tabler/icons-react";

const statusVariants: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  invited: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const typeVariants: Record<string, string> = {
  solo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  pair: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export function useCandidatureColumns(): ColumnDef<Candidature>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("status")} />
      ),
      cell: ({ row }) => {
        const status = row.original.status || "pending";
        return (
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase leading-none inline-block ml-4",
            statusVariants[status] || ""
          )}>
            {t(`candidature_status_${status}`)}
          </span>
        );
      },
      meta: {
        label: t("status"),
        className: "pl-6",
      },
    },
    {
      accessorKey: "candidature_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("type")} />
      ),
      cell: ({ row }) => {
        const isPair = !!row.original.full_name2;
        const typeKey = isPair ? "pair" : "solo";
        return (
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase leading-none inline-block ml-4",
            typeVariants[typeKey] || ""
          )}>
            {t(typeKey) || (isPair ? "Binôme" : "Solo")}
          </span>
        );
      },
      meta: {
        label: t("type"),
        className: "pl-6",
      },
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("full_name")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-36">{row.original.full_name || "-"}</LongText>
      ),
      meta: {
        className: cn("sticky left-4 md:table-cell"),
        label: t("full_name"),
      },
    },
    {
      accessorKey: "gender1",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("gender")} />
      ),
      cell: ({ row }) => {
        const gender = row.getValue("gender1") as string;
        return <Badge variant="secondary">{gender || "-"}</Badge>;
      },
      meta: {
        label: t("gender"),
      },
    },
    {
      accessorKey: "full_name2",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("full_name")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-36">{row.original.full_name2 || "-"}</LongText>
      ),
      meta: {
        label: t("full_name"),
      },
    },
    {
      accessorKey: "gender2",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("gender")} />
      ),
      cell: ({ row }) => {
        const gender = row.getValue("gender2") as string;
        return <Badge variant="secondary">{gender || "-"}</Badge>;
      },
      meta: {
        label: t("gender"),
      },
    },
    {
      accessorKey: "subject_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("project")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-24">{row.original.subject_name || "-"}</LongText>
      ),
      meta: {
        label: t("project"),
      },
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("start_date")} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.start_date || "-"}
        </Badge>
      ),
      meta: {
        label: t("start_date"),
      },
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
        const { setOpenCandidature, setCurrentCandidatureId, setEmailModalData } = useCandidaturesStore();
        const status = row.original.status || "pending";
        const isPending = status === "pending";

        return (
          <div className="flex items-center justify-end gap-1 mr-4">
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0 text-blue-500 hover:border-blue-300 hover:text-blue-600"
              onClick={() => {
                setCurrentCandidatureId(row.original.id);
                setOpenCandidature(DialogEnum.VIEW);
              }}
            >
              <IconEye size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isPending}
              className={cn(
                "size-8 p-0",
                isPending
                  ? "text-green-500 hover:border-green-300 hover:text-green-600"
                  : "text-muted-foreground/40"
              )}
              onClick={() => setEmailModalData({ candidatureId: row.original.id, templateType: "acceptance" })}
            >
              <IconCheck size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isPending}
              className={cn(
                "size-8 p-0",
                isPending
                  ? "text-red-500 hover:border-red-300 hover:text-red-600"
                  : "text-muted-foreground/40"
              )}
              onClick={() => setEmailModalData({ candidatureId: row.original.id, templateType: "disapproval" })}
            >
              <IconX size={16} />
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
  ];
}
