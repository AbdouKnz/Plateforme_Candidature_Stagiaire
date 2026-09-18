"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
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
import { useCreateSubject, useUpdateSubject, useSubjects } from "@/hooks/use-subjects";
import { useDurations } from "@/hooks/use-durations";
import { useTechnologies } from "@/hooks/use-technologies";
import { useProfiles } from "@/hooks/use-profiles";
import { DialogEnum, ModalMode } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

const createSubjectFormSchema = (t: (key: string) => string) => z.object({
  code: z
    .string()
    .nonempty({ message: t("subject_code_required") })
    .min(2, { message: t("subject_code_min") }),
  name: z
    .string()
    .nonempty({ message: t("subject_name_required") })
    .min(3, { message: t("subject_name_min") }),
  technology_ids: z.array(z.number()).min(1, { message: t("subject_technology_required") }),
  profile_ids: z.array(z.number()).min(1, { message: t("subject_profile_required") }),
  description: z
    .string()
    .nonempty({ message: t("subject_description_required") })
    .min(10, { message: t("subject_description_min") }),
  online_quiz_link: z
    .string()
    .nonempty({ message: t("subject_quiz_link_required") })
    .url({ message: t("subject_invalid_url") }),
  online_meeting_link: z
    .string()
    .nonempty({ message: t("subject_meeting_link_required") })
    .url({ message: t("subject_invalid_url") }),
  f2f_meeting_link: z
    .string()
    .nonempty({ message: t("subject_f2f_link_required") })
    .url({ message: t("subject_invalid_url") }),
  duration_id: z.preprocess(
    (val) => (val == null || val === "" ? undefined : Number(val)),
    z.number({ error: t("subject_period_required") }).refine((val) => !Number.isNaN(val) && val >= 1, { message: t("subject_period_required") })
  ),
  image_path: z.string().optional(),
});

type FormData = z.infer<ReturnType<typeof createSubjectFormSchema>>;

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
  const { t, i18n } = useTranslation();
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
  const { data: durations = [] } = useDurations({ status: true });
  const { data: existingSubjects = [] } = useSubjects();

  const handleClose = () => {
    form.reset();
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  const imageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("/")) return path;
    return `/api/${path}`;
  };

  const formSchema = useMemo(() => createSubjectFormSchema(t), [t]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: subject?.code || "",
      name: subject?.name || "",
      technology_ids: subject?.technology_ids || [],
      profile_ids: subject?.profile_ids || [],
      description: subject?.description || "",
      online_quiz_link: subject?.online_quiz_link || "",
      online_meeting_link: subject?.online_meeting_link || "",
      f2f_meeting_link: subject?.f2f_meeting_link || "",
      duration_id: subject?.duration_id ?? undefined as unknown as number,
    },
  });

  const technologyOptions: MultiSelectOption[] = useMemo(() => {
    const options = technologies.map((t) => ({
      value: String(t.id),
      label: t.name,
    }));
    const known = new Set(options.map((o) => o.value));
    subject?.technology_ids?.forEach((id, index) => {
      const value = String(id);
      if (!known.has(value)) {
        known.add(value);
        options.push({ value, label: subject.technology_names?.[index] ?? value });
      }
    });
    return options;
  }, [technologies, subject]);

  const profileOptions: MultiSelectOption[] = useMemo(() => {
    const options = profiles.map((p) => ({
      value: String(p.id),
      label: p.name,
    }));
    const known = new Set(options.map((o) => o.value));
    subject?.profile_ids?.forEach((id, index) => {
      const value = String(id);
      if (!known.has(value)) {
        known.add(value);
        options.push({ value, label: subject.profile_names?.[index] ?? value });
      }
    });
    return options;
  }, [profiles, subject]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function onSubmit(data: FormData) {
    if (isAdd && !imageFile) {
      form.setError("image_path", { message: t("subject_image_required") });
      return;
    }

    const duplicateCode = existingSubjects.find(
      (s) => s.code === data.code && s.id !== subject?.id
    );
    if (duplicateCode) {
      form.setError("code", { message: t("subject_code_exists") });
      return;
    }

    const duplicateName = existingSubjects.find(
      (s) => s.name === data.name && s.id !== subject?.id
    );
    if (duplicateName) {
      form.setError("name", { message: t("subject_name_exists") });
      return;
    }

    const payload = { ...data, image: imageFile } as typeof data & { image: File | null };
    if (isEdit && subject) {
      updateSubject(
        { id: subject.id, data: payload },
        { onSuccess: handleClose },
      );
    } else if (isAdd) {
      createSubject(payload, { onSuccess: handleClose });
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
        online_quiz_link: subject.online_quiz_link || "",
        online_meeting_link: subject.online_meeting_link || "",
        f2f_meeting_link: subject.f2f_meeting_link || "",
        duration_id: subject.duration_id ?? undefined as unknown as number,
        image_path: subject.image_path || "",
      });
      setImageFile(null);
      setImagePreview(imageUrl(subject.image_path));
    } else {
      form.reset({
        code: "",
        name: "",
        technology_ids: [],
        profile_ids: [],
        description: "",
        online_quiz_link: "",
        online_meeting_link: "",
        f2f_meeting_link: "",
        duration_id: undefined as unknown as number,
        image_path: "",
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [subject, form]);

  // Re-validate visible errors when the UI language changes so messages
  // switch language immediately instead of staying in the previous one.
  useEffect(() => {
    if (Object.keys(form.formState.errors).length === 0) return;
    form.trigger().then(() => {
      if (isAdd && !imageFile) {
        form.setError("image_path", { message: t("subject_image_required") });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

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
      <DialogContent className="sm:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
        <DialogHeader className="border-b pb-4">
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
            onSubmit={form.handleSubmit(onSubmit, () => {
              if (isAdd && !imageFile) {
                form.setError("image_path", { message: t("subject_image_required") });
              }
            })}
            className="mt-3 p-1"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
              {/* LEFT — Code / Name / Technologies / Profiles */}
              <div className="rounded-xl border border-border/60 p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>
                        {t("subject_code")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("placeholder_subject_code")}
                          autoComplete="off"
                          disabled={isView}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>
                        {t("subject_name")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("placeholder_subject_name")}
                          autoComplete="off"
                          disabled={isView}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="technology_ids"
                  render={() => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>
                        {t("technologies")}
                      </FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={technologyOptions}
                          selected={form.watch("technology_ids").map(String)}
                          onChange={(vals) => form.setValue("technology_ids", vals.map(Number), { shouldValidate: true })}
                          placeholder={t("select_technologies")}
                          disabled={isView}
                          className="min-h-9 h-auto py-1.5"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile_ids"
                  render={() => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>
                        {t("profiles")}
                      </FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={profileOptions}
                          selected={form.watch("profile_ids").map(String)}
                          onChange={(vals) => form.setValue("profile_ids", vals.map(Number), { shouldValidate: true })}
                          placeholder={t("select_profiles")}
                          disabled={isView}
                          className="min-h-9 h-auto py-1.5"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>
                        {t("project_period")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(val) =>
                            form.setValue(
                              "duration_id",
                              Number(val),
                              { shouldValidate: true },
                            )
                          }
                          disabled={isView}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder={t("select_project_period")} />
                          </SelectTrigger>
                          <SelectContent>
                            {durations.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image_path"
                  render={() => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>
                        {t("subject_image")}
                      </FormLabel>
                      <FormControl>
                        <div className="mt-1.5 flex items-center gap-3">
                          {!isView ? (
                            <>
                              <label
                                htmlFor="subject-image-input"
                                className={cn(
                                  "inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-dashed px-4 text-sm font-medium transition-colors",
                                  form.formState.errors.image_path
                                    ? "border-destructive/60 bg-destructive/5 text-destructive hover:bg-destructive/10"
                                    : "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                                )}
                              >
                                {t("browse")}
                              </label>
                              <Input
                                id="subject-image-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  setImageFile(file);
                                  setImagePreview(null);
                                  if (file) form.clearErrors("image_path");
                                }}
                              />
                              <span className={cn("min-w-0 flex-1 truncate text-sm", form.formState.errors.image_path ? "text-destructive" : "text-muted-foreground")}>
                                {imageFile
                                  ? imageFile.name
                                  : subject?.image_path
                                    ? subject.image_path.split("/").pop()
                                    : t("no_file_chosen")}
                              </span>
                            </>
                          ) : subject?.image_path ? (
                            <span className="truncate text-sm text-muted-foreground">
                              {subject.image_path.split("/").pop()}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-4 min-w-0">
                <div className="rounded-xl border border-border/60 p-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>
                          {t("subject_description")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("placeholder_subject_description")}
                            className="min-h-48"
                            autoComplete="off"
                            disabled={isView}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="rounded-xl border border-border/60 p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="online_quiz_link"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>
                          {t("online_quiz_link")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={t("placeholder_online_quiz_link")}
                            autoComplete="off"
                            disabled={isView}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="online_meeting_link"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>
                          {t("online_meeting_link")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={t("placeholder_online_meeting_link")}
                            autoComplete="off"
                            disabled={isView}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="f2f_meeting_link"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>
                          {t("f2f_meeting_link")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={t("placeholder_f2f_meeting_link")}
                            autoComplete="off"
                            disabled={isView}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </div>
            </div>

            <DialogFooter className="pt-2">
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
