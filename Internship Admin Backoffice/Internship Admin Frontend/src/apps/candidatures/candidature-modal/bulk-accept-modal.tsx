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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { format, startOfDay, addDays } from "date-fns";
import { IconMail, IconSend, IconAlertCircle, IconCalendarEvent } from "@tabler/icons-react";
import type { Candidature } from "@/models/candidature-model";
import { getEmailPreview, bulkAcceptEmails } from "@/service/candidatures";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAlertStore } from "@/stores/alert-store";
import { AlertEnum } from "@/models/alert-model";
import { nextPipelineStep } from "../pipeline";
import { useSubjects } from "@/hooks/use-subjects";

interface BulkAcceptModalProps {
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

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ONE email card for the whole selection: preview loaded once from the first
// candidature, shared fields (links / date / custom body) apply to every row,
// and a single Send click invites all rows at once.
export function BulkAcceptModal({ open, onClose, onSent, candidatures, step }: BulkAcceptModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
  const { data: subjects } = useSubjects();

  const ids = candidatures.map((c) => c.id);
  const sample = candidatures[0];
  const nextStep = nextPipelineStep(step);
  const isQuiz = nextStep === "online_quiz";
  const isOnlineMeeting = nextStep === "online_meeting";
  const isF2F = nextStep === "f2f_meeting";
  const isFinal = nextStep === "final_decision";
  // EXACT same template mapping as the single-send modal (send-email-modal):
  // the template depends on the next step, not a fixed "acceptance" type.
  const emailTypeForRequest =
    nextStep === "online_quiz" ? "online_quiz"
    : nextStep === "online_meeting" ? "online_meeting"
    : nextStep === "f2f_meeting" ? "f2f_meeting"
    : nextStep === "final_decision" ? "final_decision"
    : "acceptance";
  const stepForRequest =
    nextStep === "online_quiz" || nextStep === "online_meeting" || nextStep === "f2f_meeting" || nextStep === "final_decision"
      ? ""
      : (nextStep || "");

  const [subject, setSubject] = useState("");
  const [displayBody, setDisplayBody] = useState("");
  const [bodyModified, setBodyModified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [quizLink, setQuizLink] = useState("");
  const [f2fLink, setF2fLink] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [startDate, setStartDate] = useState("");

  // Links stored per subject on the backend — prefill from the sample row.
  // Online-meeting link is resolved automatically server-side per subject,
  // so no link/date/time card is shown for that step.
  useEffect(() => {
    if (!open) return;
    setQuizLink("");
    setF2fLink("");
    if (!sample) return;
    const match = subjects?.find((s) => s.name === sample.subject_name);
    setQuizLink(match?.online_quiz_link ?? "");
    setF2fLink(match?.f2f_meeting_link ?? "");
  }, [open, sample, subjects]);

  // Single preview for the whole bulk, using the same type/step as single-send
  // (step-dependent template). Names/addresses resolved server-side per row.
  // Online-meeting rows need no inputs: the link is auto-filled from the
  // subject and no date/time is required.
  const loadPreview = useCallback(async () => {
    if (!sample) return;
    setLoading(true);
    setError(null);
    try {
      const preview = await getEmailPreview(
        sample.id,
        emailTypeForRequest,
        stepForRequest,
        "",
        "",
        "",
        quizLink,
        "",
        f2fLink,
        startDate,
      );
      setSubject(preview.subject);
      if (!bodyModified) {
        setDisplayBody(stripHtml(preview.body || ""));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t("error_loading_preview");
      setError(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample?.id, emailTypeForRequest, stepForRequest, quizLink, f2fLink, startDate]);

  useEffect(() => {
    if (!open) return;
    setBodyModified(false);
    setDisplayBody("");
    loadPreview();
  }, [open, loadPreview]);

  useEffect(() => {
    if (open && !bodyModified) loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizLink, f2fLink, startDate]);

  const handleSend = async () => {
    if (isF2F && !f2fLink.trim()) {
      showAlert({ message: t("f2f_meeting_link_required"), type: AlertEnum.ERROR });
      return;
    }
    if (isF2F && !interviewDate) {
      showAlert({ message: t("interview_datetime_required"), type: AlertEnum.ERROR });
      return;
    }
    if (isFinal && !startDate) {
      showAlert({ message: t("start_date_required"), type: AlertEnum.ERROR });
      return;
    }
    setSending(true);
    try {
      const result = await bulkAcceptEmails({
        ids,
        type: emailTypeForRequest,
        step: stepForRequest || undefined,
        quiz_link: quizLink.trim() || undefined,
        f2f_meeting_link: isF2F ? f2fLink.trim() : undefined,
        interview_date: isF2F ? interviewDate || undefined : undefined,
        start_date: startDate || undefined,
        body: bodyModified ? displayBody : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      showAlert({
        message: t("bulk_accept_success", { count: result?.sent ?? ids.length }),
        type: AlertEnum.SUCCESS,
      });
      onSent?.();
    } catch (err: any) {
      showAlert({
        message: err?.response?.data?.error || err?.message || t("error_sending_email"),
        type: AlertEnum.ERROR,
      });
    } finally {
      setSending(false);
    }
  };

  const isSendDisabled = sending || loading || !!error;

  const handleInterviewDateSelect = (date: Date | undefined) => {
    setInterviewDate(date ? format(date, "yyyy-MM-dd") : "");
  };
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date ? format(date, "yyyy-MM-dd") : "");
  };

  if (!open || !sample) return null;

  const formattedStartDate = startDate ? formatDate(startDate) : "";
  const currentYear = new Date().getFullYear();
  const needsScheduling = isQuiz || isF2F || isFinal;

  // Online-meeting step: nothing to fill — the link is inserted automatically
  // per subject on the backend and no date/time is required.
  const showOnlineMeetingNote = isOnlineMeeting;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMail className="size-5" />
            {t("bulk_accept_title")}
            <span className="text-sm font-normal text-muted-foreground">
              ({t("bulk_recipients_count", { count: ids.length })})
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("bulk_accept_hint", { count: ids.length })}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {t(`pipeline_step_${step}`)} → {nextStep ? t(`pipeline_step_${nextStep}`) : "—"}
          </p>
        </DialogHeader>
        <div className="space-y-4 mt-3">
          {showOnlineMeetingNote && (
            <div className="p-3 border rounded-lg bg-[#1d7cc7]/5 border-[#1d7cc7]/10">
              <p className="text-sm text-[#155a8a] dark:text-[#8fc3e5]">
                {t("email_will_be_sent_from_template")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("bulk_online_meeting_auto_link")}
              </p>
            </div>
          )}
          {isF2F && (
            <div className="space-y-2 p-3 border rounded-lg bg-orange-500/5 border-orange-500/10">
              <Label>{t("f2f_meeting_link")}</Label>
              <Input value={f2fLink} onChange={(e) => setF2fLink(e.target.value)} placeholder="https://..." className="text-sm" disabled={sending} />
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <IconCalendarEvent className="size-4" />
                  {t("interview_date")}
                </Label>
                <DatePicker selected={interviewDate ? new Date(`${interviewDate}T00:00:00`) : undefined} onSelect={handleInterviewDateSelect} placeholder={t("select_interview_date")} disabled={sending} fromDate={startOfDay(new Date())} fromYear={currentYear} toYear={currentYear + 2} disableWeekends />
              </div>
            </div>
          )}
          {isFinal && (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <Label className="flex items-center gap-1">
                <IconCalendarEvent className="size-4" />
                {t("start_date")}
              </Label>
              <DatePicker selected={startDate ? new Date(`${startDate}T00:00:00`) : undefined} onSelect={handleStartDateSelect} placeholder={t("select_start_date")} disabled={sending} fromDate={startOfDay(addDays(new Date(), 1))} fromYear={currentYear} toYear={currentYear + 5} disableWeekends />
              {formattedStartDate && <p className="text-xs text-muted-foreground">{formattedStartDate}</p>}
            </div>
          )}
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
                <strong className="text-foreground">{t("bulk_recipients_count", { count: ids.length })}</strong>
              </div>
              <p className="text-xs text-muted-foreground">{t("bulk_accept_applies_to_all")}</p>
              {!needsScheduling && (
                <div className="p-3 border rounded-lg bg-[#1d7cc7]/5 border-[#1d7cc7]/10">
                  <p className="text-sm text-[#155a8a] dark:text-[#8fc3e5]">{t("email_will_be_sent_from_template")}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("email_subject")}</Label>
                <Textarea value={subject} readOnly className="min-h-[60px] text-sm" />
              </div>
              <div className="space-y-2">
                <Label>{t("email_body")}</Label>
                <Textarea value={displayBody} onChange={(e) => { setDisplayBody(e.target.value); setBodyModified(true); }} className="min-h-[200px] text-sm font-mono" disabled={sending} />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t("bulk_accept_preview_note", { name: sample.full_name || sample.email1 })}</p>
        </div>
        <DialogFooter className="gap-2 mt-4 pt-3 border-t">
          <Button variant="outline" type="button" onClick={onClose} disabled={sending}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSend} disabled={isSendDisabled}>
            {sending ? <Spinner variant="circle" className="size-4" /> : <IconSend className="size-4" />}
            {t("send")} ({ids.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
