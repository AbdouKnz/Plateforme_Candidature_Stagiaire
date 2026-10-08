import { useState } from "react";
import { Main } from "@/components/layout/main";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { SessionResetModal } from "@/components/shared/session-reset-modal";

export function SettingsSession() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);

  if (user?.role_name !== "Super Admin") {
    return (
      <Main>
        <div className="mb-2 flex flex-wrap items-center space-x-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <RotateCcw className="size-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t("reset_session")}</h2>
        </div>
        <Card className="p-6 mt-4">
          <p className="text-sm text-muted-foreground">{t("access_forbidden")}</p>
        </Card>
      </Main>
    );
  }

  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center space-x-2">
        <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <RotateCcw className="size-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{t("reset_session")}</h2>
      </div>
      <Card className="mt-4 border-destructive/40 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-destructive">
              {t("reset_recruitment_session")}
            </h3>
            <p className="text-sm text-muted-foreground">{t("reset_session_warning_1")}</p>
            <p className="text-sm font-medium text-foreground">{t("reset_session_warning_2")}</p>
          </div>
          <Button variant="destructive" onClick={() => setOpen(true)} className="shrink-0">
            <RotateCcw className="size-4" />
            {t("reset_session")}
          </Button>
        </div>
      </Card>
      <SessionResetModal open={open} onOpenChange={setOpen} />
    </Main>
  );
}
