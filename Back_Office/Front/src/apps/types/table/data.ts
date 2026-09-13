import { IconTags } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useTypesStore } from "@/stores/types-store";
import { useTypes } from "@/hooks/use-types";

export const useTypeToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpenType, setQueryParams } = useTypesStore();
  const { modulePermissions } = usePermissions();
  const { data: allTypes = [] } = useTypes({});

  const canCreateType = modulePermissions.settings?.canUpdate;
  const maxTypesReached = allTypes.length >= 2;

  return {
    tableSearchProps: {
      placeholder: t("search_types"),
      setQueryParams,
    },
    tableAddProps: canCreateType && !maxTypesReached
      ? {
          addButtonLabel: t("add_type"),
          addButtonIcon: IconTags,
          addFunction: () => setOpenType(DialogEnum.ADD),
        }
      : undefined,
  };
};
