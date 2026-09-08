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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
} from "@tabler/icons-react";
import { EmailTemplate } from "@/models/email-template-model";
import {
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useEmailTemplates,
} from "@/hooks/use-email-templates";
import { DialogEnum, ModalMode } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

const typeLabelMap: Record<string, Record<string, string>> = {
  fr: { confirmation: "Accusé de réception", online_quiz: "Quiz en ligne", disapproval: "Refus", reopening: "Réouverture", online_meeting: "Réunion en ligne", f2f_meeting: "Entretien présentiel", final_decision: "Décision finale" },
  en: { confirmation: "Acknowledgment of Receipt", online_quiz: "Online Quiz", disapproval: "Disapproval", reopening: "Reopening", online_meeting: "Online Meeting", f2f_meeting: "Face to Face Meeting", final_decision: "Final Decision" },
};

const subjectOptions = [
  { label: "Acknowledgment of Receipt", type: "confirmation", subject: "Acknowledgment of Receipt" },
  { label: "Online Quiz", type: "online_quiz", subject: "Online Quiz" },
  { label: "Disapproval", type: "disapproval", subject: "Disapproval" },
  { label: "Reopening", type: "reopening", subject: "Reopening" },
  { label: "Online Meeting", type: "online_meeting", subject: "Online Meeting" },
  { label: "Face to Face Meeting", type: "f2f_meeting", subject: "Face to Face Meeting" },
  { label: "Final Decision", type: "final_decision", subject: "Final Decision" },
] as const;

const viewTypeVariants: Record<string, string> = {
  confirmation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  online_quiz: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  disapproval: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  reopening: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  online_meeting: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  f2f_meeting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  final_decision: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
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

  const { data: existingTemplates } = useEmailTemplates();
  const { modulePermissions } = usePermissions();
  const canUpdateEmailTemplate = modulePermissions.email_templates.canUpdate;

  const availableSubjectOptions = isAdd
    ? subjectOptions.filter((opt) => !existingTemplates?.some((t) => t.type === opt.type))
    : subjectOptions;

  const { mutate: createEmailTemplate, isPending: isCreating } = useCreateEmailTemplate();
  const { mutate: updateEmailTemplate, isPending: isUpdating } = useUpdateEmailTemplate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: emailTemplate?.type || "",
      subject: emailTemplate?.subject || "",
      body: emailTemplate?.body || "",
      },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  function onSubmit(data: FormData) {
    const duplicate = existingTemplates?.find(
      (t) => t.type === data.type && t.id !== emailTemplate?.id
    );
    if (duplicate) {
      form.setError("type", { message: t("email_subject_exists") || "This subject is already used by another template" });
      return;
    }
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

  return (
    <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              {isEdit ? <IconEdit className="size-5" /> : isView ? <IconEye className="size-5" /> : <IconPlus className="size-5" />}
            </div>
            {isEdit ? t("edit_email_template") : isView ? t("view_email_template") : t("add_new_email_template")}
          </DialogTitle>
        </DialogHeader>

        {isView && emailTemplate ? (
          <ScrollArea className="px-6 py-4 max-h-[60vh]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase inline-block leading-none",
                  viewTypeVariants[emailTemplate.type] || ""
                )}>
                  {typeLabelMap.en[emailTemplate.type] || emailTemplate.type}
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
        ) : (
          <Form {...form}>
            <form
              id="email-template-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mt-2 p-0.5"
            >
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">
                      {t("subject")}
                    </FormLabel>
                    <FormControl>
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
                        <SelectTrigger className="col-span-4">
                          <SelectValue placeholder={t("placeholder_email_subject")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjectOptions.map((opt) => (
                            <SelectItem key={opt.type} value={opt.type}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right pt-2">
                      {t("body")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholder_email_body")}
                        className="col-span-4 min-h-[300px] text-sm resize-none"
                        disabled={isView}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                {isView && canUpdateEmailTemplate && (
                  <Button type="button" onClick={() => switchToEdit?.()}>
                    {t("edit")}
                  </Button>
                )}
                {!isView && (
                  <Button type="submit" form="email-template-form" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? (
                      <Spinner variant="circle" />
                    ) : (
                      t("submit")
                    )}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
