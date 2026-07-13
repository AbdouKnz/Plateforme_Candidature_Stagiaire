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
import { Profile } from "@/models/profile-model";
import { useCreateProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { DialogEnum, ModalMode } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { usePermissions } from "@/hooks/use-permissions";

const formSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "Profile name is required." })
    .min(3, { message: "Profile name must be at least 3 characters long." }),
});

type FormData = z.infer<typeof formSchema>;

interface ProfilesActionModalProps {
  profile?: Profile;
  open: boolean;
  onClose: () => void;
  mode?: ModalMode | "delete";
  switchToEdit?: () => void;
  onConfirm?: () => void;
  isDeleting?: boolean;
}

export function ProfilesActionModal({
  profile,
  open,
  onClose,
  mode,
  switchToEdit,
  onConfirm,
  isDeleting,
}: ProfilesActionModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === DialogEnum.EDIT;
  const isView = mode === DialogEnum.VIEW;
  const isAdd = mode === DialogEnum.ADD;
  const isDelete = mode === DialogEnum.DELETE;

  const { modulePermissions } = usePermissions();
  const canUpdateProfile = modulePermissions.profiles.canUpdate;

  const { mutate: createProfile, isPending: isCreating } = useCreateProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile?.name || "",
    },
  });

  function onSubmit(data: FormData) {
    if (isEdit && profile) {
      updateProfile(
        { id: profile.id, data },
        { onSuccess: handleClose },
      );
    } else if (isAdd) {
      createProfile(data, { onSuccess: handleClose });
    }
  }

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
      });
    } else {
      form.reset({
        name: "",
      });
    }
  }, [profile, form]);

  if (isDelete) {
    return (
      <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-destructive/10 text-destructive flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconTrash className="size-5" />
              </div>
              {t("delete_profile")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              {t("delete_profile_confirmation", { name: profile?.name })}
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
              ? t("edit_profile")
              : isView
                ? t("view_profile")
                : t("add_new_profile")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="profile-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">
                    {t("profile_name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholder_profile_name")}
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
              {isView && canUpdateProfile && (
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
                  form="profile-form"
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
