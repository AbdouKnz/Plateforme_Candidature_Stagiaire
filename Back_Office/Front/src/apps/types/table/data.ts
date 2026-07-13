import { IconTags } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useTypesStore } from "@/stores/types-store";

export const useTypeToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpenType, setQueryParams } = useTypesStore();
  const { modulePermissions } = usePermissions();

  const canCreateType = modulePermissions.types?.canCreate;

  return {
    tableSearchProps: {
      placeholder: t("search_types"),
      setQueryParams,
    },
    tableAddProps: canCreateType
      ? {
          addButtonLabel: t("add_type"),
          addButtonIcon: IconTags,
          addFunction: () => setOpenType(DialogEnum.ADD),
        }
      : undefined,
  };
};
