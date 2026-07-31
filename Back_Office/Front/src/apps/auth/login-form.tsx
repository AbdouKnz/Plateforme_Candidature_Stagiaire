import React, { type HTMLAttributes, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useTranslation } from "react-i18next";
import { useLogin } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Eye,
  EyeOff,
  Lock,
  MailIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

export function LoginForm({ className, ...props }: UserAuthFormProps) {
  const { t } = useTranslation();
  const { mutate: login, isPending } = useLogin();

  // Memoize the schema so it isn't recreated on every render
  const formSchema = useMemo(() => z.object({
    email: z
      .string()
      .min(1, { message: t("please_enter_email") })
      .email({ message: t("invalid_email") }),
    password: z
      .string()
      .min(1, {
        message: t("please_enter_password"),
      })
      .min(6, {
        message: t("password_min_length"),
      }),
  }), [t]);

  const [showPassword, setShowPassword] = React.useState(false);

  const defaultValues = {
    email: "",
    password: "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const {
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    login(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    placeholder={t("enter_email")}
                    {...field}
                    autoComplete="username"
                  />
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    placeholder={t("enter_password")}
                    {...field}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                  />
                  <InputGroupAddon>
                    <Lock />
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? t("hide_password") : t("show_password")
                      }
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isPending ? (
          <Button disabled variant="custom">
            <Spinner variant="circle" />
            {t("loading")}
          </Button>
        ) : (
          <Button className="mt-2" variant="custom">{t("login")}</Button>
        )}
      </form>
    </Form>
  );
}