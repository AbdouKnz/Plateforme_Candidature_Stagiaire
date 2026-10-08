"use client";

import { TypesActionModal } from "./types-action-modal";
import { useDeleteType, useType, useUpdateType } from "@/hooks/use-types";
import { DialogEnum } from "@/models/alert-model";
import { useTypesStore } from "@/stores/types-store";
import { StatusAlert } from "@/components/shared/alert/status-alert";
import { useTranslation } from "react-i18next";

export function TypesModals() {
  const { t } = useTranslation();
  const { openType, setOpenType, currentTypeId, setCurrentTypeId } = useTypesStore();
  const { data: typ, isLoading, isError, error } = useType(currentTypeId);

  const deleteTypeMutation = useDeleteType();
  const updateStatusMutation = useUpdateType();

  const isBlocked = typ?.status;
  const statusAction = isBlocked ? t("deactivate") : t("activate");

  const handleCloseModal = () => {
    setOpenType(null);
    setCurrentTypeId(null);
  };

  const handleDelete = () => {
    if (!typ) return;
    deleteTypeMutation.mutate(typ.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleUpdateStatus = () => {
    if (!typ) return;
    updateStatusMutation.mutate(
      {
        id: typ.id,
        data: { status: !typ.status },
      },
      {
        onSuccess: () => {
          handleCloseModal();
        },
      }
    );
  };

  return (
    <>
      <TypesActionModal
        open={openType === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
      />

      {typ && (
        <>
          <TypesActionModal
            open={openType === DialogEnum.VIEW || openType === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenType(DialogEnum.EDIT)}
            mode={openType as DialogEnum.VIEW | DialogEnum.EDIT}
            typ={typ}
          />

          <TypesActionModal
            open={openType === DialogEnum.DELETE}
            onClose={handleCloseModal}
            mode={DialogEnum.DELETE}
            typ={typ}
            onConfirm={handleDelete}
            isDeleting={deleteTypeMutation.isPending}
          />

          <StatusAlert
            isBlocked={!!isBlocked}
            open={openType === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isLoading={updateStatusMutation.isPending}
            onConfirm={handleUpdateStatus}
            title={t("confirm_type_status_change", { action: statusAction })}
            blockLoadingText={t("disabling")}
            unblockLoadingText={t("enabling")}
            unblockButtonText={t("activate")}
            blockButtonText={t("deactivate")}
          />
        </>
      )}
    </>
  );
}
