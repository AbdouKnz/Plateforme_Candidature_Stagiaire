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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import { IconEdit, IconPlus, IconEye, IconTrash } from "@tabler/icons-react";
import { Subject } from "@/models/subject-model";
import { useCreateSubject, useUpdateSubject } from "@/hooks/use-subjects";
import { useTechnologies } from "@/hooks/use-technologies";
import { useProfiles } from "@/hooks/use-profiles";
import { DialogEnum, ModalMode } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { usePermissions } from "@/hooks/use-permissions";

const formSchema = z.object({
  code: z
    .string()
    .nonempty({ message: "Code is required." })
    .min(2, { message: "Code must be at least 2 characters long." }),
  name: z
    .string()
    .nonempty({ message: "Subject name is required." })
    .min(3, { message: "Subject name must be at least 3 characters long." }),
  technology_ids: z.array(z.number()).min(1, { message: "Select at least one technology." }),
  profile_ids: z.array(z.number()).min(1, { message: "Select at least one profile." }),
  description: z
    .string()
    .nonempty({ message: "Description is required." })
    .min(10, { message: "Description must be at least 10 characters long." }),
  priority_rank: z
    .string()
    .nonempty({ message: "Priority rank is required." }),
});

type FormData = z.infer<typeof formSchema>;

interface SubjectsActionModalProps {
  subject?: Subject;
  open: boolean;
  onClose: () => void;
  mode?: ModalMode | "delete";
  switchToEdit?: () => void;
  onConfirm?: () => void;
  isDeleting?: boolean;
}

export function SubjectsActionModal({
  subject,
  open,
  onClose,
  mode,
  switchToEdit,
  onConfirm,
  isDeleting,
}: SubjectsActionModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === DialogEnum.EDIT;
  const isView = mode === DialogEnum.VIEW;
  const isAdd = mode === DialogEnum.ADD;
  const isDelete = mode === DialogEnum.DELETE;

  const { modulePermissions } = usePermissions();
  const canUpdateSubject = modulePermissions.subjects.canUpdate;

  const { mutate: createSubject, isPending: isCreating } = useCreateSubject();
  const { mutate: updateSubject, isPending: isUpdating } = useUpdateSubject();
  const { data: technologies = [] } = useTechnologies({ status: true });
  const { data: profiles = [] } = useProfiles({ status: true });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: subject?.code || "",
      name: subject?.name || "",
      technology_ids: subject?.technology_ids || [],
      profile_ids: subject?.profile_ids || [],
      description: subject?.description || "",
      priority_rank: subject?.priority_rank || "",
    },
  });

  const technologyOptions: MultiSelectOption[] = technologies.map((t) => ({
    value: String(t.id),
    label: t.name,
  }));
  const profileOptions: MultiSelectOption[] = profiles.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  function onSubmit(data: FormData) {
    if (isEdit && subject) {
      updateSubject(
        { id: subject.id, data },
        { onSuccess: handleClose },
      );
    } else if (isAdd) {
      createSubject(data, { onSuccess: handleClose });
    }
  }

  useEffect(() => {
    if (subject) {
      form.reset({
        code: subject.code || "",
        name: subject.name || "",
        technology_ids: subject.technology_ids || [],
        profile_ids: subject.profile_ids || [],
        description: subject.description || "",
        priority_rank: subject.priority_rank || "",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        technology_ids: [],
        profile_ids: [],
        description: "",
        priority_rank: "",
      });
    }
  }, [subject, form]);

  if (isDelete) {
    return (
      <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-destructive/10 text-destructive flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconTrash className="size-5" />
              </div>
              {t("delete_subject")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              {t("delete_subject_confirmation", { name: subject?.name })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Spinner variant="circle" />
                  {t("deleting")}
                </>
              ) : (
                t("delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              {isEdit ? (
                <IconEdit className="size-5" />
              ) : isView ? (
                <IconEye className="size-5" />
              ) : (
                <IconPlus className="size-5" />
              )}
            </div>
            {isEdit
              ? t("edit_subject")
              : isView
                ? t("view_subject")
                : t("add_new_subject")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="subject-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">
                      {t("subject_code")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholder_subject_code")}
                        className="col-span-4"
                        autoComplete="off"
                        disabled={isView}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">
                      {t("subject_name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholder_subject_name")}
                        className="col-span-4"
                        autoComplete="off"
                        disabled={isView}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="technology_ids"
                render={() => (
                  <FormItem className="grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right pt-2">
                      {t("technologies")}
                    </FormLabel>
                    <FormControl>
                      <div className="col-span-4">
                        <MultiSelect
                          options={technologyOptions}
                          selected={form.watch("technology_ids").map(String)}
                          onChange={(vals) => form.setValue("technology_ids", vals.map(Number), { shouldValidate: true })}
                          placeholder={t("select_technologies")}
                          disabled={isView}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profile_ids"
                render={() => (
                  <FormItem className="grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right pt-2">
                      {t("profiles")}
                    </FormLabel>
                    <FormControl>
                      <div className="col-span-4">
                        <MultiSelect
                          options={profileOptions}
                          selected={form.watch("profile_ids").map(String)}
                          onChange={(vals) => form.setValue("profile_ids", vals.map(Number), { shouldValidate: true })}
                          placeholder={t("select_profiles")}
                          disabled={isView}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right pt-2">
                    {t("subject_description")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("placeholder_subject_description")}
                      className="col-span-4 min-h-24"
                      autoComplete="off"
                      disabled={isView}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority_rank"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">
                    {t("priority_rank")}
                  </FormLabel>
                  <FormControl>
                    <Select
                      disabled={isView}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="col-span-4">
                        <SelectValue placeholder={t("select_priority")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">{t("priority_low")}</SelectItem>
                        <SelectItem value="Medium">{t("priority_medium")}</SelectItem>
                        <SelectItem value="High">{t("priority_high")}</SelectItem>
                        <SelectItem value="Critical">{t("priority_critical")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                {t("cancel")}
              </Button>
              {isView && canUpdateSubject && (
                <Button
                  form=""
                  onClick={() => {
                    if (switchToEdit) switchToEdit();
                  }}
                >
                  {t("edit")}
                </Button>
              )}
              {!isView && (
                <Button
                  type="submit"
                  form="subject-form"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Spinner variant="circle" />
                      {t("submitting")}
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
