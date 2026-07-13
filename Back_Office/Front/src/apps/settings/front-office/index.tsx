import { Main } from "@/components/layout/main"
import { FrontOfficeForm } from './front-office-form'
import { useTranslation } from "react-i18next"
import { Building2 } from "lucide-react"

export function SettingsFrontOffice() {
  const { t } = useTranslation()
  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center space-x-2">
        <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <Building2 className="size-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("front_office_management")}
        </h2>
      </div>
      <FrontOfficeForm />
    </Main>
  )
}