import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { PasswordInput } from "@/components/password-input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useChangePassword } from "@/hooks/use-users";

import { IconEdit } from "@tabler/icons-react";
import { useMemo } from "react";

const getSchema = (t: any) =>
  z.object({
    old_password: z
      .string()
      .nonempty({ message: t("old_password_req") })
      .min(6, { message: t("old_password_min") }),
    new_password: z
      .string()
      .nonempty({ message: t("new_password_req") })
      .min(6, { message: t("new_password_min") }),
  });

type ChangePasswordForm = z.infer<ReturnType<typeof getSchema>>;
interface Props {
  user: any;
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose, user }: Props) {
  const { t } = useTranslation();
  const { mutate: changePassword, isPending } = useChangePassword();

  const schema = useMemo(() => getSchema(t), [t]);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { old_password: "", new_password: "" },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (values: ChangePasswordForm) => {
    if (!user.user_id) return;

    changePassword(
      { id: user.user_id, payload: values },
      { onSuccess: handleClose }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <IconEdit className="size-5" />
            </div>
            {t("change_password")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="change-password-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("old_password")}</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel> {t("new_password")}</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("cancel")}
          </Button>

          <Button
            type="submit"
            form="change-password-form"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner variant="circle" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
