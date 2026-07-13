import { IconCapProjecting } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useDegreesStore } from "@/stores/degrees-store";

export const useDegreeToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpenDegree, setQueryParams } = useDegreesStore();
  const { modulePermissions } = usePermissions();

  const canCreateDegree = modulePermissions.degrees?.canCreate;

  return {
    tableSearchProps: {
      placeholder: t("search_degrees"),
      setQueryParams,
    },
    tableAddProps: canCreateDegree
      ? {
          addButtonLabel: t("add_degree"),
          addButtonIcon: IconCapProjecting,
          addFunction: () => setOpenDegree(DialogEnum.ADD),
        }
      : undefined,
  };
};
