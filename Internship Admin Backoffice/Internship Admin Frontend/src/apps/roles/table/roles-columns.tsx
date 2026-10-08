"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/shared/data-table";
import { useTranslation } from "react-i18next";
import { Role } from "@/models/role-model";
import { DialogEnum } from "@/models/alert-model";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Info, Users } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useRolesStore } from "@/stores/roles-store";

export function useRoleColumns(): ColumnDef<Role>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "role_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("role_name")} />
      ),
      cell: ({ row }) => (
        <LongText className="max-w-36">{row.getValue("role_name")}</LongText>
      ),
      meta: {
        className: cn("sticky left-4 md:table-cell"),
        label: t("role_name"),
      },
      enableHiding: false,
    },

   {
      accessorKey: "role_permissions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("permissions")} />
      ),
      cell: ({ row }) => {
        // Safe access: Default to empty object if null to prevent TypeError
        const permissionsObj = (row.getValue("role_permissions") || {}) as Record<
          string,
          string[]
        >;

        // Verify there is at least one module with at least one permission
        const hasPermissions = Object.values(permissionsObj).some(
          (actions) => Array.isArray(actions) && actions.length > 0
        );

        if (!hasPermissions) {
          return (
            <span className="text-muted-foreground text-xs italic">
              {t("no_permissions")}
            </span>
          );
        }

        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className='text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-sm transition-colors'>
                <Info className='h-4 w-4' />
                <span>{t('view')}</span>
              </div>
            </HoverCardTrigger>

            <HoverCardContent
              side='bottom'
              align='start'
              collisionPadding={20}
              className='max-h-[300px] w-80 overflow-y-auto'
            >
              <div className='flex flex-col gap-3'>
                {Object.entries(permissionsObj).map(([module, actions]) => {
                  // Skip modules with no permissions
                  if (!Array.isArray(actions) || actions.length === 0)
                    return null

                  return (
                    <div
                      key={module}
                      className='border-border/50 flex flex-col gap-1.5 border-b pb-2 last:border-0 last:pb-0'
                    >
                      <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
                        {module}
                      </span>
                      <div className='flex flex-wrap gap-1'>
                        {actions.map((action) => (
                          <Badge
                            key={action}
                            variant='success'
                            className='h-5 px-2 py-0 text-[10px]'
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      },
      enableSorting: false,
      meta: {
        className: "min-w-[120px]",
        label: t("permissions"),
      },
    },
    {
      accessorKey: "user_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('associated_users')} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="flex items-center gap-2 ">
          <span>{row.original.user_count}</span>
          <Users className="" />
        </Badge>
      ),
      meta: {
        label: t("associated_users"),
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("updated_at")} />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="max-w-36 text-xs">
          <LongText>{row.original.updated_at}</LongText>
        </Badge>
      ),
      meta: {
        label: t("updated_at"),
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
        const { setOpenRole, setCurrentRoleId } = useRolesStore();
        const { modulePermissions } = usePermissions();
        const isSuperAdmin = row.original.role_id === 1;

        return (
          <DataTableRowActions
            row={row}
            className="justify-end mr-4"
            onView={(data) => {
              setCurrentRoleId(data.role_id);
              setOpenRole(DialogEnum.VIEW);
            }}
            onEdit={(data) => {
              setCurrentRoleId(data.role_id);
              setOpenRole(DialogEnum.EDIT);
            }}
            onDelete={(data) => {
              setCurrentRoleId(data.role_id);
              setOpenRole(DialogEnum.DELETE);
            }}
            canView={modulePermissions.roles.canView}
            canEdit={!isSuperAdmin && modulePermissions.roles.canUpdate}
            canDelete={!isSuperAdmin && modulePermissions.roles.canDelete}
          />
        );
      },
      enableSorting: false,
    },
  ];
}
