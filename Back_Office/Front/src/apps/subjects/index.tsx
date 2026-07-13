import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { IconNotebook, IconInfoCircle } from "@tabler/icons-react";
import { useSubjectColumns } from "./table/subjects-columns";
import { SubjectsModals } from "./subject-modal";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useSubjectToolbarProps } from "./table/data";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubjectsStore } from "@/stores/subjects-store";
import { useSubjects } from "@/hooks/use-subjects";
import { DialogEnum } from "@/models/alert-model";

export function Subjects() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, currentSubjectId, openSubject } = useSubjectsStore();
  const selectedSubjectId = openSubject === DialogEnum.VIEW ? currentSubjectId : null;

  const { data: subjects, isLoading, isError, error } = useSubjects(queryParams);
  const data = useMemo(() => subjects ?? [], [subjects]);

  const columns = useSubjectColumns();
  const toolbarProps = useSubjectToolbarProps();
  const totalSubjects = data.length;
  const activeSubjects = data.filter((d) => d.status).length;
  const inactiveSubjects = data.filter((d) => !d.status).length;

  return (
    <>
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconNotebook className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("subject_management")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconNotebook className="size-5" />
                {t("total_subjects")}
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
                  {t("total_subjects_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{totalSubjects}</div>
            </div>
          </Card>
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconNotebook className="size-5 text-green-600" />
                {t("active_subjects")}
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
                  {t("active_subjects_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{activeSubjects}</div>
            </div>
          </Card>
          <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pt-4 pb-2">
              <div className="tracking-tight flex items-center gap-2 text-sm font-medium">
                <IconNotebook className="size-5 text-red-600" />
                {t("inactive_subjects")}
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
                  {t("inactive_subjects_description")}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-6 pt-0 pb-4">
              <div className="text-2xl font-bold">{inactiveSubjects}</div>
            </div>
          </Card>
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12 mt-4">
          <DataTable
            data={data}
            columns={columns}
            toolbarProps={toolbarProps}
            selectedRowId={selectedSubjectId}
          />
        </div>
      </Main>
      <SubjectsModals />
    </>
  );
}
