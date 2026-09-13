"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconMail, IconSend, IconAlertCircle, IconX } from "@tabler/icons-react";
import type { Candidature, RejectionReason } from "@/models/candidature-model";
import { getEmailPreview, getRejectionReasons, bulkRejectEmails } from "@/service/candidatures";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAlertStore } from "@/stores/alert-store";
import { AlertEnum } from "@/models/alert-model";

interface BulkRejectModalProps {
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
  candidatures: Candidature[];
  step: string;
}

function stripHtml(html: string): string {
  if (!html) return "";
  let text = html;
  text = text.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
  return text.trim();
}

export function BulkRejectModal({ open, onClose, onSent, candidatures, step }: BulkRejectModalProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const ids = candidatures.map((c) => c.id);
  const sample = candidatures[0];

  // Load the rejection reasons specific to the step the selection lives in,
  // so the single reason chosen in the bulk view matches the selected step.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSelectedRejectionReason("");
    setRejectionReasons([]);
    getRejectionReasons()
      .then((all) => {
        if (cancelled) return;
        setRejectionReasons(all[step] ?? Object.values(all).flat());
      })
      .catch(() => {
        if (!cancelled) setRejectionReasons([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, step]);

  // Preview the rejection email on the first selected candidature. The mail
  // content only depends on the shared template + rejection reason, so the
  // same message applies to every row of the selection.
  const loadPreview = useCallback(async () => {
    if (!sample) return;
    setError(null);
    try {
      const preview = await getEmailPreview(sample.id, "disapproval", "", "", "", selectedRejectionReason);
      setSubject(preview.subject);
      setBody(stripHtml(preview.body || ""));
    } catch (err: any) {
      setError(err?.response?.data?.error || t("error_loading_template"));
    } finally {
      setLoading(false);
    }
  }, [sample, selectedRejectionReason, t]);

  useEffect(() => {
    if (open) loadPreview();
  }, [open, loadPreview]);

  const isSendDisabled = sending || loading || !!error || !selectedRejectionReason;

  const handleSend = async () => {
    setSending(true);
    try {
      await bulkRejectEmails(ids, selectedRejectionReason);
      queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      queryClient.invalidateQueries({ queryKey: ["candidature"] });
      // Optimistic cache update for immediate feedback
      queryClient.getQueriesData<any[]>({ queryKey: ["candidatures"] }).forEach(([queryKey]) => {
        queryClient.setQueryData<any[]>(queryKey, (old) =>
          old?.map((c) => {
            if (!ids.includes(c.id)) return c;
            return { ...c, status: "rejected" as const, rejection_reason: selectedRejectionReason };
          })
        );
      });
      showAlert({ message: t("bulk_reject_success", { count: ids.length }), type: AlertEnum.SUCCESS });
      if (onSent) onSent();
      else onClose();
    } catch (err: any) {
      showAlert({
        message: err?.response?.data?.error || t("error_sending_email"),
        type: AlertEnum.ERROR,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(state) => { if (!state) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-destructive text-destructive-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <IconX className="size-5" />
            </div>
            {t("bulk_reject_title")}
            <span className="ml-auto rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
              {t("bulk_progress", { current: ids.length, total: ids.length })}
            </span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {t("bulk_reject_hint", { count: ids.length })}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <IconAlertCircle className="size-4" />
              {t("rejection_reason")}
            </Label>
            <p className="text-xs font-medium text-muted-foreground">
              {t(`pipeline_step_${step}`)}
            </p>
            {rejectionReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("no_rejection_reasons")}</p>
            ) : (
              <Select value={selectedRejectionReason} onValueChange={setSelectedRejectionReason}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder={t("select_rejection_reason")} />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {rejectionReasons.map((reason) => (
                      <SelectItem key={reason.key} value={i18n.language?.startsWith("fr") ? reason.fr : reason.en}>
                        {i18n.language?.startsWith("fr") ? reason.fr : reason.en}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              {t("bulk_reject_applies_to_all")}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner variant="circle" className="size-6" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <IconAlertCircle className="size-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconMail className="size-4 shrink-0" />
                <span>{t("recipient")}:</span>
                <strong className="text-foreground">
                  {t("bulk_recipients_count", { count: ids.length })}
                </strong>
              </div>
              <div className="space-y-2">
                <Label>{t("subject")}</Label>
                <Textarea
                  value={subject}
                  readOnly
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("email_body")}</Label>
                <Textarea
                  value={body}
                  readOnly
                  className="min-h-[200px] text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4 pt-3 border-t">
          <Button variant="outline" type="button" onClick={onClose} disabled={sending}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSend} disabled={isSendDisabled}>
            {sending ? <Spinner variant="circle" className="size-4" /> : <IconSend className="size-4" />}
            {t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}