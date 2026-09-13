"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconEye, IconFile, IconTrash, IconCheck, IconLoader2, IconLock, IconChartBar, IconTrendingUp, IconFileText, IconListDetails, IconVideo, IconUsersGroup, IconAward, IconDeviceFloppy, IconBan } from "@tabler/icons-react";
import { type Candidature } from "@/models/candidature-model";
import { DialogEnum, type DialogType } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUpdateCandidature } from "@/hooks/use-candidatures";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { stepPosition, STEP_VARIANTS, type PipelineStep } from "../pipeline";
import { usePermissions } from "@/hooks/use-permissions";

type ScoreField =
  | "score_cv_screening"
  | "score_online_quiz"
  | "score_online_meeting"
  | "score_f2f_meeting"
  | "score_final_decision";

const scoringFields: Array<{ field: ScoreField; step: PipelineStep }> = [
  { field: "score_cv_screening", step: "cv_screening" },
  { field: "score_online_quiz", step: "online_quiz" },
  { field: "score_online_meeting", step: "online_meeting" },
  { field: "score_f2f_meeting", step: "f2f_meeting" },
  { field: "score_final_decision", step: "final_decision" },
];

const statusVariants: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  invited: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function FileLink({ path, label, fallback }: { path?: string; label: string; fallback?: string }) {
      console.log("****path:", path);

   if (!path) {
    return <span className="text-sm text-muted-foreground">{fallback || "-"}</span>;
  }
  return (
    <a
      href={path}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-sm text-blue-600 underline"
    >
      <IconFile className="size-4" />
      {label}
    </a>
  );
}

interface CandidatureActionModalProps {
  candidature?: Candidature;
  open: boolean;
  onClose: () => void;
  mode?: DialogType;
  onConfirm?: () => void;
  isDeleting?: boolean;
}

export function CandidatureActionModal({
  candidature,
  open,
  onClose,
  mode,
  onConfirm,
  isDeleting,
}: CandidatureActionModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { modulePermissions } = usePermissions();
  const canUpdateCandidatures = modulePermissions.candidatures.canUpdate;
  const { mutate: updateCandidature, isPending: isSavingNotes } = useUpdateCandidature();
  const { mutate: saveScores, isPending: isSavingScores } = useUpdateCandidature();

  const [notes, setNotes] = useState(candidature?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [prevNotesKey, setPrevNotesKey] = useState<string>();
  const notesKey = `${candidature?.id ?? "none"}:${candidature?.notes ?? ""}`;
  if (notesKey !== prevNotesKey) {
    setPrevNotesKey(notesKey);
    setNotes(candidature?.notes ?? "");
    setNotesSaved(false);
  }

  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(scoringFields.map(({ field }) => [field, candidature?.[field] == null ? "" : String(candidature[field])]))
  );
  const [scoresSaved, setScoresSaved] = useState(false);
  const [prevScoresKey, setPrevScoresKey] = useState<string>();
  const scoresKey = `${candidature?.id ?? "none"}:${scoringFields.map(({ field }) => String(candidature?.[field] ?? "")).join("|")}`;
  if (scoresKey !== prevScoresKey) {
    setPrevScoresKey(scoresKey);
    setScoreDraft(
      Object.fromEntries(scoringFields.map(({ field }) => [field, candidature?.[field] == null ? "" : String(candidature[field])]))
    );
    setScoresSaved(false);
  }

  const currentStepPosition = stepPosition(candidature?.step);

  const handleClose = () => {
    onClose();
  };

  const handleSaveNotes = () => {
    if (!candidature) return;
    updateCandidature(
      { id: candidature.id, data: { notes } },
      {
        onSuccess: () => {
          setNotesSaved(true);
          queryClient.invalidateQueries({ queryKey: ["candidatures"] });
          queryClient.invalidateQueries({ queryKey: ["candidature"] });
          setTimeout(() => setNotesSaved(false), 2500);
        },
      }
    );
  };

  const handleSaveScores = () => {
    if (!candidature) return;
    const data: Partial<Record<ScoreField, number>> = {};
    for (const { field } of scoringFields) {
      const raw = (scoreDraft[field] ?? "").trim();
      const parsed = raw === "" ? 0 : Number(raw);
      data[field] = Number.isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed);
    }
    saveScores(
      { id: candidature.id, data: data as Partial<Candidature> },
      {
        onSuccess: () => {
          setScoresSaved(true);
          queryClient.invalidateQueries({ queryKey: ["candidatures"] });
          queryClient.invalidateQueries({ queryKey: ["candidature"] });
          setTimeout(() => setScoresSaved(false), 2500);
        },
      }
    );
  };

  const isView = mode === DialogEnum.VIEW;
  const isDelete = mode === DialogEnum.DELETE;

  if (isDelete && candidature) {
    console.log("****candidature:", candidature);
    return (
      <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-destructive/10 text-destructive flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconTrash className="size-5" />
              </div>
              {t("delete_candidature")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              {t("delete_candidature_confirmation", { name: candidature.full_name })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Spinner variant="circle" />
                  {t("deleting")}
                </>
              ) : (
                t("delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isView || !candidature) {
    return null;
  }

  const displayStatus = candidature?.status || "pending";

  return (
    <>
      <Dialog open={open} onOpenChange={(state) => { if (!state) handleClose(); }}>
        <DialogContent className="sm:max-w-4xl h-[85vh] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-3 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconEye className="size-5" />
              </div>
              {t("view_candidature")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between px-1 mt-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{t("status")}:</span>
              <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase leading-none inline-block",
                  statusVariants[displayStatus] || ""
                )}>
                  {t(`candidature_status_${displayStatus}`)}
                </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3 flex flex-1 flex-col min-h-0">
            <TabsList className="w-fit shrink-0">
              <TabsTrigger value="details">{t("details")}</TabsTrigger>
              <TabsTrigger value="notes">{t("notes_feedback")}</TabsTrigger>
              <TabsTrigger value="scoring">{t("scoring")}</TabsTrigger>
              {displayStatus === "rejected" && (
                <TabsTrigger value="rejection"><span className="flex items-center gap-1"><IconBan className="size-3.5" />{t("rejection_reason")}</span></TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="details" className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="space-y-4">
          {(() => {
            const isDuo = !!candidature.full_name2;
            const np = () => t("not_provided");
            const name1 =
              candidature.first_name || candidature.last_name
                ? `${candidature.first_name ?? ""} ${candidature.last_name ?? ""}`.trim()
                : candidature.full_name;
            const name2 =
              candidature.first_name2 || candidature.last_name2
                ? `${candidature.first_name2 ?? ""} ${candidature.last_name2 ?? ""}`.trim()
                : candidature.full_name2;
            return (
              <>
                <div className={cn("grid gap-6", isDuo ? "grid-cols-2" : "grid-cols-1")}>
                  <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
                    <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">{t(isDuo ? "applicant_info" : "applicant_info_solo")}</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("full_name")}:</span>
                        <span className="text-sm break-words">{name1 || np()}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("gender")}:</span>
                        <span className="text-sm break-words">{candidature.gender1 || np()}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("phone")}:</span>
                        <span className="text-sm break-words">{candidature.phone1 || np()}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("email")}:</span>
                        <span className="text-sm break-words">{candidature.email1 || np()}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("degree")}:</span>
                        <span className="text-sm break-words">{candidature.degree1 || np()}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("university")}:</span>
                        <span className="text-sm break-words">{candidature.university || np()}</span>
                      </div>
                      <div className="border-t pt-2 mt-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">{t("files")}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground w-32">{t("cv")}:</span>
                            <FileLink path={candidature.path_cv} label={t("cv")} fallback={np()} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground w-32">{t("motivation_letter")}:</span>
                            <FileLink path={candidature.path_lettre_motivation} label={t("motivation_letter")} fallback={np()} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isDuo && (
                    <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
                      <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">{t("second_person_info")}</h3>
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("full_name2")}:</span>
                          <span className="text-sm break-words">{name2 || np()}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("gender2")}:</span>
                          <span className="text-sm break-words">{candidature.gender2 || np()}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("phone")}:</span>
                          <span className="text-sm break-words">{candidature.phone2 || np()}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("email")}:</span>
                          <span className="text-sm break-words">{candidature.email2 || np()}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("degree")}:</span>
                          <span className="text-sm break-words">{candidature.degree2 || np()}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("university")}:</span>
                          <span className="text-sm break-words">{candidature.university2 || np()}</span>
                        </div>
                        <div className="border-t pt-2 mt-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">{t("files")}</p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("cv")}:</span>
                              <FileLink path={candidature.path_cv2} label={t("cv")} fallback={np()} />
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("motivation_letter")}:</span>
                              <FileLink path={candidature.path_lettre_motivation2} label={t("motivation_letter")} fallback={np()} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-muted/20">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">{t("application_details")}</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("method")}:</span>
                      <span className="text-sm break-words">{({
                        office: t("method_office"),
                        hybrid: t("hybrid"),
                        remote: t("method_remote"),
                      } as Record<string, string>)[candidature.methode] ?? (candidature.methode || np())}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("subject")}:</span>
                      <span className="text-sm break-words">{candidature.subject_name || np()}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("duration")}:</span>
                      <span className="text-sm break-words">{candidature.duration || np()}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{t("start_date")}:</span>
                      <span className="text-sm break-words">{(() => {
                        if (!candidature.start_date) return np()
                        const parts = candidature.start_date.slice(0, 10).split("-")
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : candidature.start_date
                      })()}</span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
            </TabsContent>
            <TabsContent value="notes" className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 pb-1">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{t("notes_feedback")}</h3>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <textarea
                    id="candidature-notes"
                    value={notes}
                    readOnly={!canUpdateCandidatures}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setNotesSaved(false);
                    }}
                    placeholder={t("notes_placeholder")}
                    rows={11}
                    className="w-full resize-none rounded-xl border-2 border-slate-400 bg-transparent px-4 py-3 text-sm leading-6 placeholder:text-muted-foreground shadow-sm transition-colors focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:border-slate-500 dark:bg-transparent dark:placeholder:text-muted-foreground dark:focus:border-slate-400 dark:focus:ring-slate-500/30"
                  />
                  <div className="flex justify-end text-[11px] text-muted-foreground">{notes.length} {t("characters")}</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="scoring" className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
              {(() => {
                const totalScore = Math.round(
                  scoringFields.reduce((acc, { field }) => acc + (Number(scoreDraft[field]) || 0), 0) / scoringFields.length
                );
                const totalPct = Math.round((totalScore / 20) * 100);
                const scoreMeta: Record<ScoreField, { titleKey: string; descKey: string; accent: string; iconWrap: string; iconColor: string; sliderClass: string }> = {
                  score_cv_screening: { titleKey: "pipeline_step_cv_screening", descKey: "scoring_desc_cv_screening", accent: "border-l-[#1d7cc7]", iconWrap: "bg-[#1d7cc7]/10 border-[#1d7cc7]/20", iconColor: "text-[#1d7cc7] dark:text-[#5aa3d8]", sliderClass: "accent-[#1d7cc7]" },
                  score_online_quiz: { titleKey: "pipeline_step_online_quiz", descKey: "scoring_desc_online_quiz", accent: "border-l-sky-500", iconWrap: "bg-sky-500/10 border-sky-500/20", iconColor: "text-sky-600 dark:text-sky-400", sliderClass: "accent-sky-600" },
                  score_online_meeting: { titleKey: "pipeline_step_online_meeting", descKey: "scoring_desc_online_meeting", accent: "border-l-[#12b9da]", iconWrap: "bg-[#12b9da]/10 border-[#12b9da]/20", iconColor: "text-[#0e9db8] dark:text-[#4fd2e6]", sliderClass: "accent-[#12b9da]" },
                  score_f2f_meeting: { titleKey: "pipeline_step_f2f_meeting", descKey: "scoring_desc_f2f_meeting", accent: "border-l-amber-500", iconWrap: "bg-amber-500/10 border-amber-500/20", iconColor: "text-amber-600 dark:text-amber-400", sliderClass: "accent-amber-600" },
                  score_final_decision: { titleKey: "pipeline_step_final_decision", descKey: "scoring_desc_final_decision", accent: "border-l-emerald-500", iconWrap: "bg-emerald-500/10 border-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400", sliderClass: "accent-emerald-600" },
                };
                const IconMap: Record<ScoreField, any> = {
                  score_cv_screening: IconFileText,
                  score_online_quiz: IconListDetails,
                  score_online_meeting: IconVideo,
                  score_f2f_meeting: IconUsersGroup,
                  score_final_decision: IconAward,
                };
                return (
                  <div className="space-y-5">
                    {/* Cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {scoringFields.map(({ field, step }) => {
                        const raw = scoreDraft[field] ?? "";
                        const numeric = raw === "" ? 0 : Number(raw) || 0;
                        const locked = stepPosition(step) > currentStepPosition;
                        const isCurrent = step === (candidature?.step || "cv_screening");
                        const meta = scoreMeta[field];
                        const Icon = IconMap[field];
                        const isHighlighted = isCurrent && !locked;
                        return (
                          <div
                            key={field}
                            className={cn(
                              "group relative flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md",
                              isHighlighted ? "border-[#1d7cc7]/30 ring-1 ring-[#1d7cc7]/15 shadow-[#1d7cc7]/10" : "border-border",
                              locked && "opacity-60",
                              `border-l-4 ${meta.accent}`
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold leading-none">{t(meta.titleKey)}</p>
                              </div>
                              {locked ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted border px-2.5 py-1 text-xs text-muted-foreground"><IconLock className="size-3" /> {t("locked_step")}</span>
                              ) : isHighlighted ? (
                                <span className="inline-flex items-center rounded-full bg-[#1d7cc7]/10 text-[#1d7cc7] dark:text-[#5aa3d8] border border-[#1d7cc7]/20 px-2.5 py-1 text-[11px] font-medium">{t("current_step")}</span>
                              ) : numeric > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-1 text-xs"><IconCheck className="size-3" /> {t("scored")}</span>
                              ) : (
                                <span className="inline-flex rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-1 text-xs">{t("not_scored")}</span>
                              )}
                            </div>

                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold tabular-nums">{numeric}</span>
                              <span className="text-sm text-muted-foreground">/ 20</span>
                              <span className="ml-auto text-xs font-medium px-2 py-1 rounded-md bg-muted border text-muted-foreground">{raw === "" ? "0" : numeric} {t("pts")}</span>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={20}
                              step={1}
                              disabled={locked || !canUpdateCandidatures}
                              value={numeric}
                              onChange={(e) => { setScoreDraft((prev) => ({ ...prev, [field]: e.target.value })); setScoresSaved(false); }}
                              className={cn("h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted disabled:cursor-not-allowed", !locked && meta.sliderClass)}
                            />
                            <input type="number" min={0} max={20} disabled={locked} value={raw} onChange={(e) => { setScoreDraft((prev) => ({ ...prev, [field]: e.target.value })); setScoresSaved(false); }} placeholder="—" className="sr-only" />
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })()}
            </TabsContent>
            <TabsContent value="rejection" className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 pb-1">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{t("rejection_reason")}</h3>
                    </div>
                  </div>
                  {candidature.rejection_reason && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2.5 py-1 text-[11px] font-medium">
                      <IconBan className="size-3" />
                      {t("candidature_status_rejected")}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  {candidature.rejection_reason ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-sm leading-6 text-foreground">{candidature.rejection_reason}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("no_rejection_reason_recorded")}</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        <DialogFooter className="shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={handleClose}>
              {t("close")}
            </Button>
            {activeTab === "notes" && canUpdateCandidatures && (
              <>
                {notesSaved && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <IconCheck className="size-3.5" />
                    {t("notes_saved")}
                  </span>
                )}
                <Button onClick={handleSaveNotes} disabled={isSavingNotes} className="gap-1.5">
                  {isSavingNotes ? <><IconLoader2 className="size-4 animate-spin" />{t("saving")}</> : <><IconDeviceFloppy className="size-4" />{t("save_notes")}</>}
                </Button>
              </>
            )}
            {activeTab === "scoring" && canUpdateCandidatures && (
              <>
                {scoresSaved && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <IconCheck className="size-3.5" />
                    {t("notes_saved")}
                  </span>
                )}
                <Button onClick={handleSaveScores} disabled={isSavingScores} className="rounded-xl px-6 gap-1.5">
                  {isSavingScores ? <><IconLoader2 className="size-4 animate-spin" />{t("saving")}</> : <><IconDeviceFloppy className="size-4" />{t("save_scores")}</>}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
