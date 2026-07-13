import { IconNotebook } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useSubjectsStore } from "@/stores/subjects-store";

export const useSubjectToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpenSubject, setQueryParams } = useSubjectsStore();
  const { modulePermissions } = usePermissions();

  const canCreateSubject = modulePermissions.subjects?.canCreate;

  return {
    tableSearchProps: {
      placeholder: t("search_subjects"),
      setQueryParams,
    },
    tableAddProps: canCreateSubject
      ? {
          addButtonLabel: t("add_subject"),
          addButtonIcon: IconNotebook,
          addFunction: () => setOpenSubject(DialogEnum.ADD),
        }
      : undefined,
  };
};
