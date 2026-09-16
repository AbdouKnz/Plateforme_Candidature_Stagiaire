"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { DatePicker } from "@/components/date-picker";
import { format } from 'date-fns'
import { IconMail, IconSend, IconEye, IconAlertCircle, IconCalendarEvent } from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Candidature, RejectionReason } from "@/models/candidature-model";
import { getEmailPreview, getRejectionReasons, sendEmail } from "@/service/candidatures";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAlertStore } from "@/stores/alert-store";
import { AlertEnum } from "@/models/alert-model";
import { nextPipelineStep } from "../pipeline";
import { useSubjects } from "@/hooks/use-subjects";
import { useUpdateCandidature } from "@/hooks/use-candidatures";

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
  candidature: Candidature;
  templateType: "confirmation" | "acceptance" | "disapproval" | "reopening";
  targetStep?: string;
  bulkIndex?: number;
  bulkTotal?: number;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Convert an HTML string into a human-readable plain-text version suitable
// for the editing textarea: <a href="…">text</a> becomes just "text", <br>/
// <p> become newlines, and any remaining tags are stripped. The original
// HTML is preserved separately so the sent email keeps clickable links.
function stripHtml(html: string): string {
  if (!html) return "";
  let text = html;
  // Replace anchor tags with their visible text content.
  text = text.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  // Replace <br> variants with newlines.
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Replace </p> with double newlines.
  text = text.replace(/<\/p>/gi, "\n");
  // Strip any remaining HTML tags.
  text = text.replace(/<[^>]+>/g, "");
  // Decode a few common entities.
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
  return text.trim();
}

// Ensure the quiz link is visible as text inside a view card. Templates
// usually render [Link] as a clickable anchor (<a href="…">label</a>),
// which stripHtml reduces to just "label" — hiding the URL HR is supposed
// to review and edit. When the stripped text doesn't already contain the
// link, append it on its own line so it stays visible and editable; the
// (possibly edited) card text is exactly what gets sent.
function withVisibleLink(text: string, link: string): string {
  const l = (link || "").trim();
  if (!l || text.includes(l)) return text;
  return text ? `${text}\n${l}` : l;
}

export function SendEmailModal({ open, onClose, onSent, candidature, templateType, targetStep, bulkIndex, bulkTotal }: SendEmailModalProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  // Human-readable version of the body shown in the textarea: anchor tags
  // like <a href="…">Address</a> appear as just "Address". The original HTML
  // is kept in editedBody and is what gets sent when the user has not
  // modified the body, so clickable links are preserved in the real email.
  const [displayBody, setDisplayBody] = useState("");
  const [bodyModified, setBodyModified] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[] | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
  const [quizLink, setQuizLink] = useState("");
  // Second member's quiz link for pair applications. Member 1 keeps quizLink,
  // member 2 gets quizLink2. For solo applications this stays unused.
  const [quizLink2, setQuizLink2] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [f2fLink, setF2fLink] = useState("");
  const [startDate, setStartDate] = useState("");
  // Per-member editable bodies for pair quiz emails: each view card owns its
  // own body so each applicant can receive a fully independent email.
  const [member2Body, setMember2Body] = useState("");
  const [member2BodyModified, setMember2BodyModified] = useState(false);
  // Raw HTML body for member 2 (with clickable links) used for the actual send
  // when member 2's textarea was NOT edited. Member 1's raw HTML is kept in
  // editedBody, so it needs no separate state.
  const [member2HtmlBody, setMember2HtmlBody] = useState("");
  // Guards against out-of-order preview responses: opening the modal (and
  // link auto-fill) fires several preview fetches in a row; only the latest
  // response may update the cards, otherwise a stale link-less preview could
  // overwrite the fresh one.
  const previewRequestRef = useRef(0);

  const { data: subjects } = useSubjects();

  const isPair = useMemo(
    () =>
      Boolean(candidature.full_name2 && candidature.full_name2.trim() !== ''),
    [candidature.full_name2]
  );
  const member1Label = useMemo(
    () =>
      candidature.full_name?.trim() ||
      candidature.email1?.trim() ||
      t('candidate_1', 'Candidate 1'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidature.full_name, candidature.email1]
  );
  const member2Label = useMemo(
    () =>
      candidature.full_name2?.trim() ||
      candidature.email2?.trim() ||
      t('candidate_2', 'Candidate 2'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidature.full_name2, candidature.email2]
  );
  const derivedNextStep = useMemo(() => nextPipelineStep(candidature.step), [candidature.step]);
  const nextStep = targetStep || derivedNextStep || "";
  const isAcceptance = templateType === "acceptance";
  const isQuiz = isAcceptance && nextStep === "online_quiz";
  const isOnlineMeeting = isAcceptance && nextStep === "online_meeting";
  const isF2F = isAcceptance && nextStep === "f2f_meeting";
  const isFinal = isAcceptance && nextStep === "final_decision";
  const effectiveStep = isAcceptance ? (nextStep || "") : "";
  const emailTypeForRequest = useMemo(() => {
    if (!isAcceptance) return templateType;
    if (nextStep === "online_quiz") return "online_quiz";
    if (nextStep === "online_meeting") return "online_meeting";
    if (nextStep === "f2f_meeting") return "f2f_meeting";
    if (nextStep === "final_decision") return "final_decision";
    return templateType;
  }, [isAcceptance, nextStep, templateType]);
  const effectiveStepForRequest = useMemo(() => {
    if (!isAcceptance) return "";
    if (nextStep === "online_quiz" || nextStep === "online_meeting" || nextStep === "f2f_meeting" || nextStep === "final_decision") return "";
    return nextStep;
  }, [isAcceptance, nextStep]);
  const updateCandidatureMutation = useUpdateCandidature();

  const formattedStartDate = useMemo(() => formatDate(startDate), [startDate]);

  const startDateObj = useMemo(() => {
    if (!startDate) return undefined;
    const d = new Date(startDate + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [startDate]);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calendar range: from the current year (e.g. 2026) up to a far-future
  // year so the year dropdown contains only usable years and HR can freely
  // scroll through the months without being capped at December of this year.
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 20;

  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    if (!date) {
      setStartDate("");
      return;
    }
    setStartDate(format(date, "yyyy-MM-dd"));
  }, []);

  const loadPreview = useCallback(async () => {
    const requestId = ++previewRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const preview = await getEmailPreview(candidature.id, emailTypeForRequest, effectiveStepForRequest, "", "", selectedRejectionReason, quizLink, meetingLink, f2fLink, formattedStartDate, isPair ? quizLink2 : "");
      if (requestId !== previewRequestRef.current) return;
      setEditedSubject(preview.subject);
      setEditedBody(preview.body || "");
      setDisplayBody(withVisibleLink(stripHtml(preview.body || ""), quizLink));
      // Member 2's own version (own [Link]); falls back to member 1's text
      // when the backend has no distinct second body (e.g. same link).
      const rawMember2 = preview.body2 || preview.body || "";
      setMember2HtmlBody(rawMember2);
      setMember2Body(withVisibleLink(stripHtml(rawMember2), (isPair ? quizLink2 : "") || quizLink));
      setBodyModified(false);
      setMember2BodyModified(false);
    } catch (err: any) {
      if (requestId !== previewRequestRef.current) return;
      setError(err?.response?.data?.error || t("error_loading_template"));
    } finally {
      if (requestId === previewRequestRef.current) setLoading(false);
    }
  }, [candidature.id, emailTypeForRequest, effectiveStepForRequest, selectedRejectionReason, quizLink, quizLink2, isPair, meetingLink, f2fLink, formattedStartDate, t]);

  useEffect(() => {
    if (open) loadPreview();
  }, [open, loadPreview]);

  useEffect(() => {
    if (!open || templateType !== "disapproval") return;
    let cancelled = false;
    getRejectionReasons()
      .then((all) => {
        if (cancelled) return;
        const step = candidature.step || "cv_screening";
        const forStep = all[step] ?? [];
        setRejectionReasons(forStep.length > 0 ? forStep : Object.values(all).flat());
        setSelectedRejectionReason("");
      })
      .catch(() => {
        if (!cancelled) setRejectionReasons([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, templateType, candidature.id, candidature.step]);

  // Auto-fill the links from the candidate's chosen subject so HR only has to
  // press Send: the linked value is embedded directly inside the mail body.

  useEffect(() => {
    if (!open) return;
    if (!subjects) return;
    setQuizLink("");
    setQuizLink2("");
    setMeetingLink("");
    setF2fLink("");
    const names = (candidature.subject_name || "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const findByName = (n: string) =>
      subjects.find((s) => s.name === n) ??
      subjects.find((s) => (s.name || "").toLowerCase() === n.toLowerCase());
    const resolveLink = (pick: (s: NonNullable<typeof subjects>[number]) => string | undefined): string => {
      let auto = "";
      for (const n of names) {
        const s = findByName(n);
        if (!s) continue;
        const link = pick(s)?.trim();
        if (link) {
          auto = link;
          break;
        }
      }
      return auto;
    };
    if (isQuiz) {
      const auto = resolveLink((s) => s.online_quiz_link);
      setQuizLink(auto);
      // Pre-fill member 2 with the same default; HR can then change it.
      setQuizLink2(auto);
      return;
    }
    if (isOnlineMeeting) {
      setMeetingLink(resolveLink((s) => s.online_meeting_link));
      return;
    }
    if (isF2F) {
      setF2fLink(resolveLink((s) => s.f2f_meeting_link));
      return;
    }
  }, [open, nextStep, isQuiz, isOnlineMeeting, isF2F, subjects, candidature.subject_name]);

  const handleSend = async () => {
    setSending(true);
    try {
      // Each applicant's email is fully independent for pair quiz sends:
      // member 1 uses body 1 (their own textarea), member 2 uses body 2.
      // Unedited textareas send the original HTML (clickable links kept);
      // edited ones send the plain-text version as-is.
      const overrideBody1 = bodyModified ? displayBody : editedBody;
      const overrideBody2 = member2BodyModified ? member2Body : member2HtmlBody;

      await sendEmail(candidature.id, { 
        type: emailTypeForRequest,
        step: effectiveStepForRequest,
        rejection_reason: templateType === "disapproval" ? selectedRejectionReason : "",
        quiz_link: isQuiz ? quizLink : "",
        quiz_link2: isQuiz && isPair ? quizLink2 : "",
        meeting_link: isOnlineMeeting ? meetingLink : "",
        f2f_meeting_link: isF2F ? f2fLink : "",
        start_date: isFinal ? formattedStartDate : "",
        body: overrideBody1,
        body2: isQuiz && isPair ? overrideBody2 : "",
      });
      // For acceptance, also advance the candidature to the target step
      if (templateType === "acceptance" && effectiveStep) {
        const isFinalStep = effectiveStep === "final_decision";
        try {
          await updateCandidatureMutation.mutateAsync({
            id: candidature.id,
            data: { step: effectiveStep, status: isFinalStep ? "accepted" : "pending" },
          });
        } catch (e) {
          // Advance failed, but email was sent — still show success and invalidate
          console.warn("Advance after email failed", e);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      queryClient.invalidateQueries({ queryKey: ["candidature"] });
      // Optimistic cache update for immediate feedback
      queryClient.getQueriesData<any[]>({ queryKey: ["candidatures"] })
        .forEach(([queryKey]) => {
          queryClient.setQueryData<any[]>(queryKey, (old) =>
            old?.map((c) => {
              if (c.id !== candidature.id) return c;
              if (templateType === "disapproval") return { ...c, status: "rejected" as const, rejection_reason: selectedRejectionReason };
              if (templateType === "acceptance" && effectiveStep) {
                const isFinalStep = effectiveStep === "final_decision";
                return { ...c, step: effectiveStep, status: isFinalStep ? "accepted" as const : "pending" as const };
              }
              return { ...c, status: "accepted" as const };
            }),
          );
        });
      showAlert({ message: t("email_sent_successfully"), type: AlertEnum.SUCCESS });
      if (onSent) {
        onSent();
      } else {
        onClose();
      }
    } catch (err: any) {
      showAlert({
        message: err?.response?.data?.error || t("error_sending_email"),
        type: AlertEnum.ERROR,
      });
    } finally {
      setSending(false);
    }
  };

  const isSendDisabled = (() => {
    if (sending || loading || !!error) return true;
    if (templateType === "disapproval" && (rejectionReasons?.length ?? 0) > 0 && !selectedRejectionReason) return true;
    // Quiz links no longer have a dedicated input: HR edits the link directly
    // inside each card's email body, so no link validation is needed.
    if (isOnlineMeeting && !meetingLink) return true;
    if (isF2F && !f2fLink) return true;
    if (isFinal && !formattedStartDate) return true;
    return false;
  })();

  return (
    <Dialog open={open} onOpenChange={(state) => { if (!state) onClose(); }}>
      <DialogContent className={isQuiz && isPair ? "sm:max-w-5xl max-h-[90vh] overflow-y-auto" : "sm:max-w-2xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <IconMail className="size-5" />
            </div>
            {templateType === "disapproval" ? t("send_rejection_email") : t("send_confirmation_email")}
            {bulkIndex != null && bulkTotal != null && (
              <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {t("bulk_progress", { current: bulkIndex + 1, total: bulkTotal })}
              </span>
            )}
          </DialogTitle>
          {isAcceptance && nextStep && (
            <p className="text-xs text-muted-foreground">Next step: {t(`pipeline_step_${nextStep}`)}</p>
          )}
        </DialogHeader>

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
          <div className="space-y-4 mt-3">
            {!(isQuiz && isPair) && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <IconEye className="size-4 shrink-0" />
                <span>{t("send_email_to")}</span>
                <strong className="text-foreground">
                  {candidature.full_name || candidature.email1}
                </strong>
                <span>({candidature.email1})</span>
                {candidature.full_name2 && (
                  <span className="text-xs">
                    + {candidature.full_name2} ({candidature.email2})
                  </span>
                )}
              </div>
            )}
            {templateType === "disapproval" && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
                <Label className="flex items-center gap-1">
                  <IconAlertCircle className="size-4" />
                  {t("rejection_reason")}
                </Label>
                {rejectionReasons === null ? (
                  <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                    <Spinner variant="circle" className="size-4" />
                    {t("loading")}
                  </div>
                ) : rejectionReasons.length === 0 ? (
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
              </div>
            )}
            {isFinal && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
                <Label className="flex items-center gap-1">
                  <IconCalendarEvent className="size-4" />
                  {t("start_date")}
                </Label>
                <DatePicker
                  selected={startDateObj}
                  onSelect={handleStartDateSelect}
                  placeholder={t("select_start_date")}
                  disabled={sending}
                  fromDate={minDate}
                  fromYear={currentYear}
                  toYear={maxYear}
                  disableWeekends
                />
                {formattedStartDate && <p className="text-xs text-muted-foreground">{formattedStartDate}</p>}
              </div>
            )}
            {isQuiz && !quizLink.trim() && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                <IconAlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{t("quiz_link_missing_warning")}</span>
              </div>
            )}
            {isQuiz && isPair ? (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border p-3 shadow-sm">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{member1Label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{candidature.email1}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("subject")}</Label>
                    <Textarea value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} className="min-h-[60px] text-sm" disabled={sending} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("email_body_member_1", { name: member1Label })}</Label>
                    <Textarea value={displayBody} onChange={(e) => { setDisplayBody(e.target.value); setBodyModified(true); }} className="min-h-[200px] text-sm font-mono" disabled={sending} />
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border p-3 shadow-sm">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{member2Label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{candidature.email2}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("subject")}</Label>
                    <Textarea value={editedSubject} onChange={(e) => setEditedSubject(e.target.value)} className="min-h-[60px] text-sm" disabled={sending} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("email_body_member_2", { name: member2Label })}</Label>
                    <Textarea value={member2Body} onChange={(e) => { setMember2Body(e.target.value); setMember2BodyModified(true); }} className="min-h-[200px] text-sm font-mono" disabled={sending} />
                  </div>
                </div>
              </div>
            ) : (
              <>
            {isAcceptance && !isQuiz && !isOnlineMeeting && !isF2F && !isFinal && (
              <div className="p-3 border rounded-lg bg-[#1d7cc7]/5 border-[#1d7cc7]/10">
                <p className="text-sm text-[#155a8a] dark:text-[#8fc3e5]">
                  {t("email_will_be_sent_from_template")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`pipeline_step_${nextStep}`)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("subject")}</Label>
              <Textarea
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="min-h-[60px] text-sm"
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("email_body")}</Label>
              <Textarea
                value={displayBody}
                onChange={(e) => {
                  setDisplayBody(e.target.value);
                  setBodyModified(true);
                }}
                className="min-h-[200px] text-sm font-mono"
                disabled={sending}
              />
            </div>
              </>
            )}
          </div>
        )}

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
