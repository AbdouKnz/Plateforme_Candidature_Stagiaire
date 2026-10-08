import { Main } from "@/components/layout/main";
import { DataTable } from "@/components/shared/data-table";
import { IconNotebook } from "@tabler/icons-react";
import { useSubjectColumns } from "./table/subjects-columns";
import { SubjectsModals } from "./subject-modal";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useSubjectToolbarProps } from "./table/data";
import { useSubjectsStore } from "@/stores/subjects-store";
import { useSubjects } from "@/hooks/use-subjects";
import { DialogEnum } from "@/models/alert-model";
import { SubjectKpis } from "./components/subject-kpis";

export function Subjects() {
  const { t } = useTranslation();
  const { queryParams, currentSubjectId, openSubject } = useSubjectsStore();
  const selectedSubjectId = openSubject === DialogEnum.VIEW ? currentSubjectId : null;

  const { data: subjects } = useSubjects(queryParams);
  const data = useMemo(() => subjects ?? [], [subjects]);

  const columns = useSubjectColumns();
  const toolbarProps = useSubjectToolbarProps();

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
        <div className="mt-4">
          <SubjectKpis />
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
