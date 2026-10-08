"use client";

import { DegreesActionModal } from "./degrees-action-modal";
import { useDeleteDegree, useDegree, useUpdateDegree } from "@/hooks/use-degrees";
import { DialogEnum } from "@/models/alert-model";
import { useDegreesStore } from "@/stores/degrees-store";
import { StatusAlert } from "@/components/shared/alert/status-alert";
import { useTranslation } from "react-i18next";

export function DegreesModals() {
  const { t } = useTranslation();
  const { openDegree, setOpenDegree, currentDegreeId, setCurrentDegreeId } = useDegreesStore();
  const { data: degree, isLoading, isError, error } = useDegree(currentDegreeId);

  const deleteDegreeMutation = useDeleteDegree();
  const updateStatusMutation = useUpdateDegree();

  const isBlocked = degree?.status;
  const statusAction = isBlocked ? t("deactivate") : t("activate");

  const handleCloseModal = () => {
    setOpenDegree(null);
    setCurrentDegreeId(null);
  };

  const handleDelete = () => {
    if (!degree) return;
    deleteDegreeMutation.mutate(degree.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleUpdateStatus = () => {
    if (!degree) return;
    updateStatusMutation.mutate(
      {
        id: degree.id,
        data: { status: !degree.status },
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
      <DegreesActionModal
        open={openDegree === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
      />

      {degree && (
        <>
          <DegreesActionModal
            open={openDegree === DialogEnum.VIEW || openDegree === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenDegree(DialogEnum.EDIT)}
            mode={openDegree as DialogEnum.VIEW | DialogEnum.EDIT}
            degree={degree}
          />

          <DegreesActionModal
            open={openDegree === DialogEnum.DELETE}
            onClose={handleCloseModal}
            mode={DialogEnum.DELETE}
            degree={degree}
            onConfirm={handleDelete}
            isDeleting={deleteDegreeMutation.isPending}
          />

          <StatusAlert
            isBlocked={!!isBlocked}
            open={openDegree === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isLoading={updateStatusMutation.isPending}
            onConfirm={handleUpdateStatus}
            title={t("confirm_degree_status_change", { action: statusAction })}
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
