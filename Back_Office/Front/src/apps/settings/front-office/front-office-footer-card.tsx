import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { SaveIcon, Phone, Mail, Linkedin, Globe, ShieldCheck, FileText, PanelBottom, Loader2 } from "lucide-react"
import { useFrontOfficeStatus } from "@/hooks/use-front-office"
import { updateFrontOfficeFooter } from "@/service/front-office"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";
import { usePermissions } from "@/hooks/use-permissions";

const formKeys = [
  "footer_phone",
  "footer_email",
  "footer_linkedin",
  "footer_website",
  "footer_privacy_url",
  "footer_terms_url",
] as const;

type FooterFormKey = (typeof formKeys)[number];

export function FrontOfficeFooterCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { showAlert } = useAlertStore()
  const { data: statusData } = useFrontOfficeStatus()
  const { modulePermissions } = usePermissions()
  const canEditFrontOffice = modulePermissions.settings.canUpdate

  // Drafts stay empty until the user types, so background refetches never
  // clobber in-progress edits. They reset after a successful save.
  const [drafts, setDrafts] = useState<Partial<Record<FooterFormKey, string>>>({})
  const val = (key: FooterFormKey): string => drafts[key] ?? (statusData?.[key] as string | undefined) ?? ""

  const saveMutation = useMutation({
    mutationFn: updateFrontOfficeFooter,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["front_office_status"] })
      queryClient.invalidateQueries({ queryKey: ["audits"] })
      setDrafts({})
      showAlert({ message: res?.message || t("front_office_footer_updated"), type: AlertEnum.SUCCESS })
    },
    onError: (err) => {
      showAlert({ message: err?.response?.data?.error || t("error_saving"), type: AlertEnum.ERROR })
    },
  })

  const set = (key: FooterFormKey, value: string) => setDrafts((prev) => ({ ...prev, [key]: value }))
  const handleSave = () => {
    const payload = Object.fromEntries(formKeys.map((key) => [key, val(key)])) as Record<FooterFormKey, string>
    saveMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card text-card-foreground p-6 gap-0 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PanelBottom className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("footer_contact")}</h3>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fo-footer-phone" className="flex items-center gap-1.5">
              <Phone className="size-3.5 text-muted-foreground" />
              {t("footer_phone")}
            </Label>
            <Input
              id="fo-footer-phone"
              value={val("footer_phone")}
              onChange={(e) => set("footer_phone", e.target.value)}
              placeholder={t("footer_phone_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fo-footer-email" className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              {t("footer_email")}
            </Label>
            <Input
              id="fo-footer-email"
              type="email"
              value={val("footer_email")}
              onChange={(e) => set("footer_email", e.target.value)}
              placeholder={t("footer_email_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fo-footer-linkedin" className="flex items-center gap-1.5">
              <Linkedin className="size-3.5 text-muted-foreground" />
              {t("footer_linkedin")}
            </Label>
            <Input
              id="fo-footer-linkedin"
              value={val("footer_linkedin")}
              onChange={(e) => set("footer_linkedin", e.target.value)}
              placeholder={t("footer_linkedin_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fo-footer-website" className="flex items-center gap-1.5">
              <Globe className="size-3.5 text-muted-foreground" />
              {t("footer_website")}
            </Label>
            <Input
              id="fo-footer-website"
              value={val("footer_website")}
              onChange={(e) => set("footer_website", e.target.value)}
              placeholder={t("footer_website_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
        </div>
      </Card>

      <Card className="bg-card text-card-foreground p-6 gap-0 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("footer_legal")}</h3>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fo-footer-privacy" className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-muted-foreground" />
              {t("footer_privacy_url")}
            </Label>
            <Input
              id="fo-footer-privacy"
              value={val("footer_privacy_url")}
              onChange={(e) => set("footer_privacy_url", e.target.value)}
              placeholder={t("footer_url_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fo-footer-terms" className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" />
              {t("footer_terms_url")}
            </Label>
            <Input
              id="fo-footer-terms"
              value={val("footer_terms_url")}
              onChange={(e) => set("footer_terms_url", e.target.value)}
              placeholder={t("footer_url_placeholder")}
              disabled={!canEditFrontOffice}
            />
          </div>
        </div>
      </Card>

      {canEditFrontOffice && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => handleSave()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin me-1.5" /> : <SaveIcon className="size-4 mr-2" />}
            {saveMutation.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </div>
  )
}
