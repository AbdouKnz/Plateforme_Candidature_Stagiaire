"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/date-picker";
import { format, nextMonday } from 'date-fns'
import { IconMail, IconSend, IconEye, IconAlertCircle, IconCalendarEvent, IconLink } from "@tabler/icons-react";
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

export function SendEmailModal({ open, onClose, onSent, candidature, templateType, targetStep, bulkIndex, bulkTotal }: SendEmailModalProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewHour, setInterviewHour] = useState("");
  const [interviewMinute, setInterviewMinute] = useState("");
  const [pendingHour, setPendingHour] = useState("08");
  const [pendingMinute, setPendingMinute] = useState("00");
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[] | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
  const [quizLink, setQuizLink] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [startDate, setStartDate] = useState("");

  const { data: subjects } = useSubjects();

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

  const interviewTime = useMemo(() => {
    if (!interviewHour || !interviewMinute) return "";
    return `${interviewHour}:${interviewMinute}`;
  }, [interviewHour, interviewMinute]);

  const formattedDate = useMemo(() => formatDate(interviewDate), [interviewDate]);
  const formattedStartDate = useMemo(() => formatDate(startDate), [startDate]);

  const interviewDateObj = useMemo(() => {
    if (!interviewDate) return undefined;
    const d = new Date(interviewDate + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [interviewDate]);

  const startDateObj = useMemo(() => {
    if (!startDate) return undefined;
    const d = new Date(startDate + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [startDate]);

  const minDate = useMemo(() => {
    const d = nextMonday(new Date());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date) {
      setInterviewDate("");
      return;
    }
    setInterviewDate(format(date, "yyyy-MM-dd"));
  }, []);

  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    if (!date) {
      setStartDate("");
      return;
    }
    setStartDate(format(date, "yyyy-MM-dd"));
  }, []);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const preview = await getEmailPreview(candidature.id, emailTypeForRequest, effectiveStepForRequest, formattedDate, interviewTime, selectedRejectionReason, quizLink, meetingLink, formattedStartDate);
      setEditedSubject(preview.subject);
      setEditedBody(preview.body || "");
    } catch (err: any) {
      setError(err?.response?.data?.error || t("error_loading_template"));
    } finally {
      setLoading(false);
    }
  }, [candidature.id, emailTypeForRequest, effectiveStepForRequest, formattedDate, interviewTime, selectedRejectionReason, quizLink, meetingLink, formattedStartDate, t]);

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

  // Auto-fill the quiz link from the candidate's chosen subject so HR only
  // has to press Send. Falls back to manual selection when the subject has
  // no quiz link (the dropdown stays available as an override).
  useEffect(() => {
    if (!open) return;
    setMeetingLink("");
    if (!isQuiz) {
      setQuizLink("");
      return;
    }
    const names = (candidature.subject_name || "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    let auto = "";
    if (subjects) {
      const findByName = (n: string) =>
        subjects.find((s) => s.name === n) ??
        subjects.find((s) => (s.name || "").toLowerCase() === n.toLowerCase());
      for (const n of names) {
        const link = findByName(n)?.online_quiz_link?.trim();
        if (link) {
          auto = link;
          break;
        }
      }
    }
    setQuizLink(auto);
  }, [open, nextStep, isQuiz, subjects, candidature.subject_name]);

  const handleSend = async () => {
    setSending(true);
    try {
      await sendEmail(candidature.id, { 
        type: emailTypeForRequest,
        step: effectiveStepForRequest,
        interview_date: (isOnlineMeeting || isF2F) ? formattedDate : "",
        interview_time: (isOnlineMeeting || isF2F) ? interviewTime : "",
        rejection_reason: templateType === "disapproval" ? selectedRejectionReason : "",
        quiz_link: isQuiz ? quizLink : "",
        meeting_link: isOnlineMeeting ? meetingLink : "",
        start_date: isFinal ? formattedStartDate : "",
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
              if (templateType === "disapproval") return { ...c, status: "rejected" as const };
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
    if (isQuiz && !quizLink) return true;
    if (isOnlineMeeting && (!meetingLink || !formattedDate || !interviewTime)) return true;
    if (isF2F && (!formattedDate || !interviewTime)) return true;
    if (isFinal && !formattedStartDate) return true;
    return false;
  })();

  return (
    <Dialog open={open} onOpenChange={(state) => { if (!state) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
            {isOnlineMeeting && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <IconLink className="size-4" />
                    {t("meeting_link")}
                  </Label>
                  <Input placeholder="https://..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <IconCalendarEvent className="size-4" />
                      {t("interview_date")}
                    </Label>
                    <DatePicker
                      selected={interviewDateObj}
                      onSelect={handleDateSelect}
                      placeholder={t("interview_date")}
                      disabled={sending}
                      fromDate={minDate}
                      month={minDate}
                      disableWeekends
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <IconCalendarEvent className="size-4" />
                      {t("interview_time")}
                    </Label>
                    <div className="flex gap-1">
                      <Select value={pendingHour} onValueChange={setPendingHour}>
                        <SelectTrigger className="flex-1 h-9 text-sm">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-48">
                            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map(h => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <span className="flex items-center text-muted-foreground">:</span>
                      <Select value={pendingMinute} onValueChange={setPendingMinute}>
                        <SelectTrigger className="flex-1 h-9 text-sm">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-48">
                            {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")).map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => {
                          setInterviewHour(pendingHour);
                          setInterviewMinute(pendingMinute);
                        }}
                        disabled={sending}
                      >
                        {t("validate")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isF2F && (
              <div className="grid grid-cols-2 gap-4 p-3 border rounded-lg bg-muted/20">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <IconCalendarEvent className="size-4" />
                    {t("interview_date")}
                  </Label>
                  <DatePicker
                    selected={interviewDateObj}
                    onSelect={handleDateSelect}
                    placeholder={t("interview_date")}
                    disabled={sending}
                    fromDate={minDate}
                    month={minDate}
                    disableWeekends
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <IconCalendarEvent className="size-4" />
                    {t("interview_time")}
                  </Label>
                  <div className="flex gap-1">
                    <Select value={pendingHour} onValueChange={setPendingHour}>
                      <SelectTrigger className="flex-1 h-9 text-sm">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <span className="flex items-center text-muted-foreground">:</span>
                    <Select value={pendingMinute} onValueChange={setPendingMinute}>
                      <SelectTrigger className="flex-1 h-9 text-sm">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")).map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 px-3"
                      onClick={() => {
                        setInterviewHour(pendingHour);
                        setInterviewMinute(pendingMinute);
                      }}
                      disabled={sending}
                    >
                      {t("validate")}
                    </Button>
                  </div>
                </div>
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
                  month={minDate}
                  disableWeekends
                />
                {formattedStartDate && <p className="text-xs text-muted-foreground">{formattedStartDate}</p>}
              </div>
            )}
            {isAcceptance && !isQuiz && !isOnlineMeeting && !isF2F && !isFinal && (
              <div className="p-3 border rounded-lg bg-violet-500/5 border-violet-500/10">
                <p className="text-sm text-violet-700 dark:text-violet-300">
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
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="min-h-[200px] text-sm font-mono"
                disabled={sending}
              />
            </div>
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
