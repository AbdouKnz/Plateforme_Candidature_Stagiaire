import { Main } from "@/components/layout/main"
import { EmailFooterForm } from './email-footer-form'
import { useTranslation } from "react-i18next"
import { PanelBottom } from "lucide-react"

export function SettingsEmailFooter() {
  const { t } = useTranslation()
  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center space-x-2">
        <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <PanelBottom className="size-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("email_footer_management")}
        </h2>
      </div>
      <EmailFooterForm />
    </Main>
  )
}
