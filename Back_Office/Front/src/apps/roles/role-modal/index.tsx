"use client";

import { RolesActionModal } from "./roles-action-modal";
import { useDeleteRole, useModules, useReassignUsersRole, useRole, useRoles } from "@/hooks/use-roles";
import { DialogEnum } from "@/models/alert-model";
import { DeleteRoleAlert } from "./delete-role-alert";
import { useRolesStore } from "@/stores/roles-store";

export function RolesModals() {
  const { openRole, setOpenRole, currentRoleId, setCurrentRoleId } = useRolesStore();
  const { data: role, isLoading, isError, error } = useRole(currentRoleId);
  const { data: modules } = useModules();
  const filteredModules = (modules || []).filter((m) => m.module_name !== "transactions");
  const { data: roles } = useRoles();

  const deleteRoleMutation = useDeleteRole();
  const reassignUsersMutation = useReassignUsersRole();

  const handleCloseModal = () => {
    setOpenRole(null);
    setCurrentRoleId(null);
  };

  const handleDeleteWithReassignment = (newRoleId?: number) => {
    if (!role) return;

    if (newRoleId != null) {
      reassignUsersMutation.mutate(
        {
          current_role_id: role.role_id,
          new_role_id: newRoleId,
        },
        {
          onSuccess: () => {
            deleteRoleMutation.mutate(role.role_id, {
              onSuccess: () => {
                handleCloseModal();
              },
            });
          },
        }
      );
    } else {
      deleteRoleMutation.mutate(role.role_id, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    }
  };

  const isDeleting = deleteRoleMutation.isPending || reassignUsersMutation.isPending;

  return (
    <>
      <RolesActionModal
        open={openRole === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
        modules={filteredModules}
      />

      {role && (
        <>
          <RolesActionModal
            open={openRole === DialogEnum.VIEW || openRole === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenRole(DialogEnum.EDIT)}
            mode={openRole as DialogEnum.VIEW | DialogEnum.EDIT}
            role={role}
            modules={filteredModules}
          />

          <DeleteRoleAlert
            open={openRole === DialogEnum.DELETE}
            onClose={handleCloseModal}
            roleToDelete={role}
            availableRoles={roles || []}
            onConfirm={handleDeleteWithReassignment}
            isLoading={isDeleting}
          />
        </>
      )}
    </>
  );
}