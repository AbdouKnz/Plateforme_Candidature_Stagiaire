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
import { DatePicker } from "@/components/date-picker";
import { format, nextMonday } from 'date-fns'
import { IconMail, IconSend, IconEye, IconAlertCircle, IconCalendarEvent } from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Candidature } from "@/models/candidature-model";
import { getEmailPreview, sendEmail } from "@/service/candidatures";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useAlertStore } from "@/stores/alert-store";
import { AlertEnum } from "@/models/alert-model";

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  candidature: Candidature;
  templateType: "confirmation" | "acceptance" | "disapproval" | "reopening";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function SendEmailModal({ open, onClose, candidature, templateType }: SendEmailModalProps) {
  const { t } = useTranslation();
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

  const interviewTime = useMemo(() => {
    if (!interviewHour || !interviewMinute) return "";
    return `${interviewHour}:${interviewMinute}`;
  }, [interviewHour, interviewMinute]);

  const formattedDate = useMemo(() => formatDate(interviewDate), [interviewDate]);

  const interviewDateObj = useMemo(() => {
    if (!interviewDate) return undefined;
    const d = new Date(interviewDate + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [interviewDate]);

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

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const preview = await getEmailPreview(candidature.id, templateType, formattedDate, interviewTime);
      setEditedSubject(preview.subject);
      setEditedBody(preview.body || "");
    } catch (err: any) {
      setError(err?.response?.data?.error || t("error_loading_template"));
    } finally {
      setLoading(false);
    }
  }, [candidature.id, templateType, formattedDate, interviewTime, t]);

  useEffect(() => {
    if (open) loadPreview();
  }, [open, loadPreview]);

  const handleSend = async () => {
    setSending(true);
    try {
      await sendEmail(candidature.id, { 
        type: templateType,
        interview_date: templateType === "acceptance" ? formattedDate : "",
        interview_time: templateType === "acceptance" ? interviewTime : "",
      });
      queryClient.getQueriesData<any[]>({ queryKey: ["candidatures"] })
        .forEach(([queryKey]) => {
          queryClient.setQueryData<any[]>(queryKey, (old) =>
            old?.map((c) => c.id === candidature.id ? { ...c, status: templateType === "disapproval" ? "rejected" : "invited" } : c),
          );
        });
      showAlert({ message: t("email_sent_successfully"), type: AlertEnum.SUCCESS });
      onClose();
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
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <IconMail className="size-5" />
            </div>
            {templateType === "disapproval" ? t("send_rejection_email") : t("send_confirmation_email")}
          </DialogTitle>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconEye className="size-4" />
              {t("send_email_to")} <strong>{candidature.email1}</strong>
            </div>
            {templateType === "acceptance" && (
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
          <Button type="button" onClick={handleSend} disabled={sending || loading || !!error}>
            {sending ? <Spinner variant="circle" className="size-4" /> : <IconSend className="size-4" />}
            {t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
