"use client";

import { EmailTemplatesActionModal } from "./email-templates-action-modal";
import { useDeleteEmailTemplate, useEmailTemplate } from "@/hooks/use-email-templates";
import { DialogEnum } from "@/models/alert-model";
import { useEmailTemplatesStore } from "@/stores/email-templates-store";

export function EmailTemplateModals() {
  const { openEmailTemplate, setOpenEmailTemplate, currentEmailTemplateId, setCurrentEmailTemplateId } = useEmailTemplatesStore();
  const { data: emailTemplate } = useEmailTemplate(currentEmailTemplateId);

  const deleteEmailTemplateMutation = useDeleteEmailTemplate();

  const handleCloseModal = () => {
    setOpenEmailTemplate(null);
    setCurrentEmailTemplateId(null);
  };

  const handleDelete = () => {
    if (!emailTemplate) return;
    deleteEmailTemplateMutation.mutate(emailTemplate.id, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  return (
    <>
      {emailTemplate && (
        <>
          <EmailTemplatesActionModal
            open={openEmailTemplate === DialogEnum.VIEW || openEmailTemplate === DialogEnum.EDIT}
            onClose={() => handleCloseModal()}
            switchToEdit={() => setOpenEmailTemplate(DialogEnum.EDIT)}
            mode={openEmailTemplate as DialogEnum.VIEW | DialogEnum.EDIT}
            emailTemplate={emailTemplate}
          />

          <EmailTemplatesActionModal
            open={openEmailTemplate === DialogEnum.DELETE}
            onClose={handleCloseModal}
            mode={DialogEnum.DELETE}
            emailTemplate={emailTemplate}
            onConfirm={handleDelete}
            isDeleting={deleteEmailTemplateMutation.isPending}
          />
        </>
      )}

      <EmailTemplatesActionModal
        open={openEmailTemplate === DialogEnum.ADD}
        onClose={() => handleCloseModal()}
        mode={DialogEnum.ADD}
      />
    </>
  );
}
