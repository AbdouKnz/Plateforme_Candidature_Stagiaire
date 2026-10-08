import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Mail, Linkedin, Globe, MapPin, PanelBottom } from "lucide-react";
import { getEmailFooter, updateEmailFooter } from "@/service/email-footer";
import { useState } from "react";
import { z } from "zod";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";
import { usePermissions } from "@/hooks/use-permissions";

export function EmailFooterForm() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
  const { modulePermissions } = usePermissions();
  const canEdit = modulePermissions.settings.canUpdate;

  // Drafts stay empty until the user types, so background refetches never
  // clobber in-progress edits. They reset after a successful save.
  const [drafts, setDrafts] = useState({ phone: undefined as string | undefined, email: undefined as string | undefined, linkedin: undefined as string | undefined, website: undefined as string | undefined, address_url: undefined as string | undefined });

  type EmailFooterKey = keyof typeof drafts;

  const linkKeys: readonly EmailFooterKey[] = ["linkedin", "website", "address_url"];

  // Empty values are allowed (readers fall back to defaults); non-empty
  // values must be a valid email (email) or a valid http(s) URL (links).
  const validateField = (key: EmailFooterKey, value: string): string | undefined => {
    const v = value.trim()
    if (!v) return undefined
    if (key === "phone") {
      return /^\d{8}$/.test(v) ? undefined : "footer_phone_digits"
    }
    if (key === "email") {
      return z.string().email().safeParse(v).success ? undefined : "invalid_email"
    }
    if ((linkKeys as readonly string[]).includes(key)) {
      const ok = z.string().url().safeParse(v).success && /^https?:\/\//i.test(v)
      return ok ? undefined : "subject_invalid_url"
    }
    return undefined
  };

  const [errors, setErrors] = useState<Partial<Record<EmailFooterKey, string>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["email_footer"],
    queryFn: getEmailFooter,
  });

  const val = (key: keyof typeof drafts): string => drafts[key] ?? (data?.[key] as string | undefined) ?? "";

  const saveMutation = useMutation({
    mutationFn: updateEmailFooter,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["email_footer"] });
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      setDrafts({ phone: undefined, email: undefined, linkedin: undefined, website: undefined, address_url: undefined });
      setErrors({});
      showAlert({ message: res?.message || t("email_footer_updated"), type: AlertEnum.SUCCESS });
    },
    onError: (err) => {
      showAlert({ message: err?.response?.data?.error || t("error_saving"), type: AlertEnum.ERROR });
    },
  });

  const set = (key: keyof typeof drafts, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const handleSave = () => {
    const nextErrors: Partial<Record<EmailFooterKey, string>> = {};
    for (const key of ["phone", "email", "linkedin", "website", "address_url"] as EmailFooterKey[]) {
      const err = validateField(key, val(key));
      if (err) nextErrors[key] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    saveMutation.mutate({ phone: val("phone"), email: val("email"), linkedin: val("linkedin"), website: val("website"), address_url: val("address_url") });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="bg-card text-card-foreground p-6 gap-0 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PanelBottom className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("footer")}</h3>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email-footer-phone" className="flex items-center gap-1.5">
              <Phone className="size-3.5 text-muted-foreground" />
              {t("footer_phone")}
            </Label>
            <Input
              id="email-footer-phone"
              inputMode="numeric"
              value={val("phone")}
              onChange={(e) => set("phone", e.target.value)}
              placeholder={t("footer_phone_placeholder")}
              disabled={!canEdit}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{t(errors.phone)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-footer-email" className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              {t("footer_email")}
            </Label>
            <Input
              id="email-footer-email"
              type="email"
              value={val("email")}
              onChange={(e) => set("email", e.target.value)}
              placeholder={t("footer_email_placeholder")}
              disabled={!canEdit}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{t(errors.email)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-footer-linkedin" className="flex items-center gap-1.5">
              <Linkedin className="size-3.5 text-muted-foreground" />
              {t("footer_linkedin")}
            </Label>
            <Input
              id="email-footer-linkedin"
              value={val("linkedin")}
              onChange={(e) => set("linkedin", e.target.value)}
              placeholder={t("footer_linkedin_placeholder")}
              disabled={!canEdit}
              aria-invalid={!!errors.linkedin}
            />
            {errors.linkedin && (
              <p className="text-xs text-destructive">{t(errors.linkedin)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-footer-website" className="flex items-center gap-1.5">
              <Globe className="size-3.5 text-muted-foreground" />
              {t("footer_website")}
            </Label>
            <Input
              id="email-footer-website"
              value={val("website")}
              onChange={(e) => set("website", e.target.value)}
              placeholder={t("footer_website_placeholder")}
              disabled={!canEdit}
              aria-invalid={!!errors.website}
            />
            {errors.website && (
              <p className="text-xs text-destructive">{t(errors.website)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-footer-address" className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              {t("footer_address")}
            </Label>
            <Input
              id="email-footer-address"
              value={val("address_url")}
              onChange={(e) => set("address_url", e.target.value)}
              placeholder={t("footer_address_placeholder")}
              disabled={!canEdit}
              aria-invalid={!!errors.address_url}
            />
            {errors.address_url && (
              <p className="text-xs text-destructive">{t(errors.address_url)}</p>
            )}
          </div>
        </div>
      </Card>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => handleSave()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin me-1.5" /> : null}
            {saveMutation.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}
