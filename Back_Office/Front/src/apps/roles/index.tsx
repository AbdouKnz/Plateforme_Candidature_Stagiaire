import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { ShieldCheck } from "lucide-react";
import { useRoleColumns } from "./table/roles-columns";
import { RolesModals } from "./role-modal";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useRoleToolbarProps } from "./table/data";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconInfoCircle } from "@tabler/icons-react";
import { IconShieldCog } from "@tabler/icons-react";
import { useRolesStore } from "@/stores/roles-store";
import { useRoles } from "@/hooks/use-roles";
import { DialogEnum } from "@/models/alert-model";

export function Roles() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, currentRoleId, openRole } = useRolesStore();
  const selectedRoleId = openRole === DialogEnum.VIEW ? currentRoleId : null;

  const { data: roles, isLoading, isError, error } = useRoles(queryParams);
  const data = useMemo(() => roles ?? [], [roles]);

  const columns = useRoleColumns();
  const toolbarProps = useRoleToolbarProps();
  const totalRoles = data.length;

  return (
    <>
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <IconShieldCog className="size-5" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {t("role_management")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-5" />
                {t("total_roles")}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={24}
                    strokeWidth={1.25}
                    className="text-muted-foreground scale-90"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {t("total_roles_tooltip")}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{totalRoles}</div>
            </div>
          </Card>
        </div>

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12 mt-4">
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            selectedRowId={selectedRoleId}
          />
        </div>
      </Main>
      <RolesModals />
    </>
  );
}
