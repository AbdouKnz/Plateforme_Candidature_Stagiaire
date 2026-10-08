import { IconShieldPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useRolesStore } from "@/stores/roles-store";

export const usePermissionModules = () => {
  const { t } = useTranslation();
};

export const useRoleToolbarProps = () => {
  const { t } = useTranslation();
    const { setOpenRole, queryParams, setQueryParams } = useRolesStore();
  
  const { modulePermissions } = usePermissions();

  const canCreateRole = modulePermissions.roles?.canCreate;

  return {
    tableSearchProps: {
      placeholder: t("search_roles"),
      setQueryParams
    },
    tableAddProps: canCreateRole
      ? {
          addButtonLabel: t("add_role"),
          addButtonIcon: IconShieldPlus,
          addFunction: () => setOpenRole(DialogEnum.ADD),
        }
      : undefined,
  };
};
