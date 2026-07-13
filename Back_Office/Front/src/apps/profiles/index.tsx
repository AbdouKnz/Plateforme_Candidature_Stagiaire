import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { IconIdBadge, IconInfoCircle } from "@tabler/icons-react";
import { useProfileColumns } from "./table/profiles-columns";
import { ProfilesModals } from "./profile-modal";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useProfileToolbarProps } from "./table/data";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProfilesStore } from "@/stores/profiles-store";
import { useProfiles } from "@/hooks/use-profiles";
import { DialogEnum } from "@/models/alert-model";

export function Profiles() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, currentProfileId, openProfile } = useProfilesStore();
  const selectedProfileId = openProfile === DialogEnum.VIEW ? currentProfileId : null;

  const { data: profiles, isLoading, isError, error } = useProfiles(queryParams);
  const data = useMemo(() => profiles ?? [], [profiles]);

  const columns = useProfileColumns();
  const toolbarProps = useProfileToolbarProps();
  const totalProfiles = data.length;
  const activeProfiles = data.filter((d) => d.status).length;
  const inactiveProfiles = data.filter((d) => !d.status).length;

  return (
    <>
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconIdBadge className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("profile_management")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconIdBadge className="size-5" />
                {t("total_profiles")}
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
                  {t("total_profiles_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{totalProfiles}</div>
            </div>
          </Card>
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconIdBadge className="size-5 text-green-600" />
                {t("active_profiles")}
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
                  {t("active_profiles_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{activeProfiles}</div>
            </div>
          </Card>
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconIdBadge className="size-5 text-red-600" />
                {t("inactive_profiles")}
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
                  {t("inactive_profiles_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{inactiveProfiles}</div>
            </div>
          </Card>
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12 mt-4">
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            selectedRowId={selectedProfileId}
          />
        </div>
      </Main>
      <ProfilesModals />
    </>
  );
}
