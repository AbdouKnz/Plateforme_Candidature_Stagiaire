"use client";

import { SubjectsActionModal } from "./subjects-action-modal";
import { useDeleteSubject, useSubject, useUpdateSubject } from "@/hooks/use-subjects";
import { DialogEnum } from "@/models/alert-model";
import { useSubjectsStore } from "@/stores/subjects-store";
import { StatusAlert } from "@/components/shared/alert/status-alert";
import { useTranslation } from "react-i18next";

export function SubjectsModals() {
  const { t } = useTranslation();
  const { openSubject, setOpenSubject, currentSubjectId, setCurrentSubjectId } = useSubjectsStore();
  const { data: subject, isLoading, isError, error } = useSubject(currentSubjectId);

  const deleteSubjectMutation = useDeleteSubject();
  const updateStatusMutation = useUpdateSubject();

  const isBlocked = subject?.status;
  const statusAction = isBlocked ? t("deactivate") : t("activate");

  const handleCloseModal = () => {
    setOpenSubject(null);
    setCurrentSubjectId(null);
  };

  const handleDelete = () => {
    if (!subject) return;
    deleteSubjectMutation.mutate(subject.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleUpdateStatus = () => {
    if (!subject) return;
    updateStatusMutation.mutate(
      {
        id: subject.id,
        data: { status: !subject.status },
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
      <SubjectsActionModal
        open={openSubject === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
      />

      {subject && (
        <>
          <SubjectsActionModal
            open={openSubject === DialogEnum.VIEW || openSubject === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenSubject(DialogEnum.EDIT)}
            mode={openSubject as DialogEnum.VIEW | DialogEnum.EDIT}
            subject={subject}
          />

          <SubjectsActionModal
            open={openSubject === DialogEnum.DELETE}
            onClose={handleCloseModal}
            mode={DialogEnum.DELETE}
            subject={subject}
            onConfirm={handleDelete}
            isDeleting={deleteSubjectMutation.isPending}
          />

          <StatusAlert
            isBlocked={!!isBlocked}
            open={openSubject === DialogEnum.BLOCK}
            onClose={handleCloseModal}
            isLoading={updateStatusMutation.isPending}
            onConfirm={handleUpdateStatus}
            title={t("confirm_subject_status_change", { action: statusAction })}
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
