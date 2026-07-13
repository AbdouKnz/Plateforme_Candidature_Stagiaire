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
import { IconEdit, IconPlus, IconEye, IconTrash } from "@tabler/icons-react";
import { Duration } from "@/models/duration-model";
import { useCreateDuration, useUpdateDuration } from "@/hooks/use-durations";
import { DialogEnum, ModalMode } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { usePermissions } from "@/hooks/use-permissions";

const formSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "Duration name is required." })
    .min(3, { message: "Duration name must be at least 3 characters long." }),
});

type FormData = z.infer<typeof formSchema>;

interface DurationsActionModalProps {
  duration?: Duration;
  open: boolean;
  onClose: () => void;
  mode?: ModalMode | "delete";
  switchToEdit?: () => void;
  onConfirm?: () => void;
  isDeleting?: boolean;
}

export function DurationsActionModal({
  duration,
  open,
  onClose,
  mode,
  switchToEdit,
  onConfirm,
  isDeleting,
}: DurationsActionModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === DialogEnum.EDIT;
  const isView = mode === DialogEnum.VIEW;
  const isAdd = mode === DialogEnum.ADD;
  const isDelete = mode === DialogEnum.DELETE;

  const { modulePermissions } = usePermissions();
  const canUpdateDuration = modulePermissions.durations.canUpdate;

  const { mutate: createDuration, isPending: isCreating } = useCreateDuration();
  const { mutate: updateDuration, isPending: isUpdating } = useUpdateDuration();

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: duration?.name || "",
    },
  });

  function onSubmit(data: FormData) {
    if (isEdit && duration) {
      updateDuration(
        { id: duration.id, data },
        { onSuccess: handleClose },
      );
    } else if (isAdd) {
      createDuration(data, { onSuccess: handleClose });
    }
  }

  useEffect(() => {
    if (duration) {
      form.reset({
        name: duration.name || "",
      });
    } else {
      form.reset({
        name: "",
      });
    }
  }, [duration, form]);

  if (isDelete) {
    return (
      <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-destructive/10 text-destructive flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconTrash className="size-5" />
              </div>
              {t("delete_duration")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              {t("delete_duration_confirmation", { name: duration?.name })}
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
      <DialogContent className="sm:max-w-lg">
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
              ? t("edit_duration")
              : isView
                ? t("view_duration")
                : t("add_new_duration")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="duration-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">
                    {t("duration_name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholder_duration_name")}
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

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                {t("cancel")}
              </Button>
              {isView && canUpdateDuration && (
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
                  form="duration-form"
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
