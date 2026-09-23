import { useState } from "react"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { SaveIcon } from "lucide-react"
import { useFrontOfficeStatus, useToggleFrontOffice } from "@/hooks/use-front-office"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { usePermissions } from "@/hooks/use-permissions"

export function FrontOfficeInfoCard() {
  const { t } = useTranslation()
  const { data: statusData } = useFrontOfficeStatus()
  const toggleMutation = useToggleFrontOffice()
  const { modulePermissions } = usePermissions()
  const canEditFrontOffice = modulePermissions.settings.canUpdate

  const isEnabled = statusData?.is_enabled ?? true

  // Drafts stay undefined until the user types, so background refetches
  // never clobber in-progress edits. They reset after a successful save.
  const [yearDraft, setYearDraft] = useState<string | undefined>(undefined)
  const [titleDraft, setTitleDraft] = useState<string | undefined>(undefined)
  const year = yearDraft ?? statusData?.year ?? ""
  const internshipTitle = titleDraft ?? statusData?.internship_title ?? ""

  const handleSaveInfo = () => {
    toggleMutation.mutate({
      is_enabled: isEnabled,
      year,
      internship_title: internshipTitle,
    }, {
      onSuccess: () => {
        setYearDraft(undefined)
        setTitleDraft(undefined)
      },
    })
  }

  return (
    <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm mb-6">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-primary/10 text-primary flex aspect-square size-10 items-center justify-center rounded-lg">
            <SaveIcon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">{t("internship_title")}</p>
          </div>
        </div>
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="front-office-year" className="text-sm font-medium">
              {t("year")}
            </Label>
            <Input
              id="front-office-year"
              value={year}
              onChange={(e) => setYearDraft(e.target.value)}
              placeholder={t("year_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="front-office-title" className="text-sm font-medium">
              {t("internship_title")}
            </Label>
            <Input
              id="front-office-title"
              value={internshipTitle}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder={t("internship_title_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
        </div>
        {canEditFrontOffice && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveInfo}
              disabled={toggleMutation.isPending}
            >
              <SaveIcon className="size-4 mr-2" />
              {t("save")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
