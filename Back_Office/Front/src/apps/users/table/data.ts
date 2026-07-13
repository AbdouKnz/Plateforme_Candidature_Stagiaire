import { IconUserPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { UserStatusTypes } from "@/models/user-model";
import { DialogEnum } from "@/models/alert-model";
import { exportUsers } from "@/service/users";
import { FileType } from "@/models/export-model";
import { FieldTypeEnum } from "@/models/table-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useUsersStore } from "@/stores/users-store";
import { useRoles } from "@/hooks/use-roles";

export const callTypes = Object.values(UserStatusTypes);

export const useUserToolbarProps = () => {
  const { t } = useTranslation();
  const { setOpen, queryParams, setQueryParams, resetFilterQueryParams } =
    useUsersStore();
  const { modulePermissions } = usePermissions();
  const canCreateUser = modulePermissions.users?.canCreate;
  const { data: rolesData } = useRoles();

  const roleItems = [
    { label: t("all"), value: "all" },
    ...(rolesData?.map((role) => ({
      label: role.role_name,
      value: role.role_name,
    })) || []),
  ];

  return {
    tableSearchProps: {
      placeholder:  t("search_users"),
      setQueryParams,
    },
    tableAddProps: canCreateUser
      ? {
          addButtonLabel: t("add_user"),
          addButtonIcon: IconUserPlus,
          addFunction: () => setOpen(DialogEnum.ADD),
        }
      : undefined,
    tableFilterProps: {
      setQueryParams,
      resetFilterQueryParams,
      formDefaultValues: {
        status: "all",
      },
      formFields: [
        {
          name: "status",
          label: t("status"),
          type: FieldTypeEnum.DROPDOWN,
          items: [
            { label: t("all"), value: "all" },
            { label: t("active"), value: "true" },
            { label: t("inactive"), value: "false" },
          ],
        },
        {
          name: "role_name",
          label: t("role"),
          type: FieldTypeEnum.DROPDOWN,
          items: roleItems,
        },
      ],
    },

    exportFunction: (props: { fileType: FileType }) =>
      exportUsers(props.fileType, queryParams),
  };
};
