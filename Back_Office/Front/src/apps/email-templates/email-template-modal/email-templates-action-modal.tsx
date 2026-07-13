"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconEdit,
  IconPlus,
  IconEye,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { EmailTemplate } from "@/models/email-template-model";
import {
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from "@/hooks/use-email-templates";
import { DialogEnum, ModalMode } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

const typeLabelMap: Record<string, Record<string, string>> = {
  fr: { confirmation: "Accusé réception", acceptance: "Invitation", disapproval: "Refus", reopening: "Réouverture" },
  en: { confirmation: "Confirmation", acceptance: "Acceptance", disapproval: "Disapproval", reopening: "Reopening" },
};

const subjectOptions = [
  { label: "Accusé réception", type: "confirmation", subject: "Accusé réception de votre candidature" },
  { label: "Invitation entretien", type: "acceptance", subject: "Invitation à un entretien" },
  { label: "Refus candidature", type: "disapproval", subject: "Refus de votre candidature" },
  { label: "Réouverture", type: "reopening", subject: "Réouverture des candidatures" },
] as const;

const viewTypeVariants: Record<string, string> = {
  confirmation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  acceptance: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  disapproval: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  reopening: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const formSchema = z.object({
  type: z.string().nonempty({ message: "Type is required." }),
  subject: z.string().nonempty({ message: "Subject is required." }),
  body: z.string().nonempty({ message: "Body is required." }),
});

type FormData = z.infer<typeof formSchema>;

interface EmailTemplatesActionModalProps {
  emailTemplate?: EmailTemplate;
  open: boolean;
  onClose: () => void;
  mode?: ModalMode | "delete";
  switchToEdit?: () => void;
  onConfirm?: () => void;
  isDeleting?: boolean;
}

export function EmailTemplatesActionModal({
  emailTemplate,
  open,
  onClose,
  mode,
  switchToEdit,
  onConfirm,
  isDeleting,
}: EmailTemplatesActionModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === DialogEnum.EDIT;
  const isView = mode === DialogEnum.VIEW;
  const isAdd = mode === DialogEnum.ADD;
  const isDelete = mode === DialogEnum.DELETE;

  const { modulePermissions } = usePermissions();
  const canUpdateEmailTemplate = modulePermissions.email_templates.canUpdate;

  const { mutate: createEmailTemplate, isPending: isCreating } = useCreateEmailTemplate();
  const { mutate: updateEmailTemplate, isPending: isUpdating } = useUpdateEmailTemplate();

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: emailTemplate?.type || "",
      subject: emailTemplate?.subject || "",
      body: emailTemplate?.body || "",
      },
  });

  function onSubmit(data: FormData) {
    if (isEdit && emailTemplate) {
      updateEmailTemplate(
        { id: emailTemplate.id, data },
        { onSuccess: handleClose },
      );
    } else if (isAdd) {
      createEmailTemplate(data, { onSuccess: handleClose });
    }
  }

  useEffect(() => {
    if (emailTemplate) {
      form.reset({
        type: emailTemplate.type || "",
        subject: emailTemplate.subject || "",
        body: emailTemplate.body || "",
        });
    } else {
      form.reset({ type: "", subject: "", body: "" });
    }
  }, [emailTemplate, form]);

  if (isDelete) {
    return (
      <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-2 pb-2">
            <div className="bg-destructive/10 text-destructive flex aspect-square size-8 items-center justify-center rounded-lg">
              <IconTrash className="size-5" />
            </div>
            <DialogTitle className="text-base font-semibold">{t("delete_email_template")}</DialogTitle>
          </div>
          <div className="py-4">
            <p className="text-muted-foreground">{t("delete_email_template_confirmation")}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? <Spinner variant="circle" /> : t("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formContent = (
    <Form {...form}>
      <form
        id="email-template-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? t("edit_email_template") : t("add_email_template")}
          </DialogTitle>
          <Button variant="ghost" size="icon" type="button" onClick={handleClose} className="size-8">
            <IconX className="size-4" />
          </Button>
        </div>

        <div className="px-6 pt-4 shrink-0 space-y-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <Select
                  disabled={isView}
                  value={field.value || ""}
                  onValueChange={(value) => {
                    const option = subjectOptions.find((o) => o.type === value);
                    if (option) {
                      form.setValue("type", option.type);
                      form.setValue("subject", option.subject);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("placeholder_email_subject")} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((opt) => (
                      <SelectItem key={opt.type} value={opt.type}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ScrollArea className="flex-1 px-6 pt-3 pb-4">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder={t("placeholder_email_body")}
                    className="min-h-[300px] text-sm resize-none"
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ScrollArea>

        <div className="border-t shrink-0 px-4 py-2 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
            {t("cancel")}
          </Button>
          {!isView && (
            <Button size="sm" type="submit" form="email-template-form" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <Spinner variant="circle" className="size-3.5" />
              ) : (
                <>
                  <IconPlus className="size-3.5 mr-1" />
                  {t("save")}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );

  const viewContent = emailTemplate && (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <DialogTitle className="text-base font-semibold">{t("view_email_template")}</DialogTitle>
        <Button variant="ghost" size="icon" type="button" onClick={handleClose} className="size-8">
          <IconX className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase inline-block leading-none",
              viewTypeVariants[emailTemplate.type] || ""
            )}>
              {typeLabelMap.fr[emailTemplate.type] || emailTemplate.type}
            </span>
          </div>
          <div className="text-sm font-medium text-foreground border rounded-lg px-3 py-2 bg-muted/20">
            {emailTemplate.subject || "-"}
          </div>
          <div className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed min-h-[200px] border rounded-lg px-3 py-3 bg-muted/20">
            {emailTemplate.body || "-"}
          </div>
        </div>
      </ScrollArea>

      <div className="border-t shrink-0 px-4 py-2 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
          {t("close")}
        </Button>
        {canUpdateEmailTemplate && (
          <Button size="sm" type="button" onClick={() => switchToEdit?.()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <IconEdit className="size-3.5 mr-1" />
            {t("edit")}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
      <DialogContent
        className="sm:max-w-3xl h-[80vh] max-h-[750px] min-h-[500px] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {isView ? viewContent : formContent}
      </DialogContent>
    </Dialog>
  );
}
