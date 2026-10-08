import { Main } from "@/components/layout/main"
import { MailConfigForm } from './mail-config-form'
import { useTranslation } from "react-i18next"
import { Mail } from "lucide-react"

export function SettingsMailConfig() {
  const { t } = useTranslation()
  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center space-x-2">
        <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <Mail className="size-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("mail_config_management")}
        </h2>
      </div>
      <MailConfigForm />
    </Main>
  )
}