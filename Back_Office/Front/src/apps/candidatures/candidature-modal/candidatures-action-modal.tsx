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
import { IconEye, IconFile, IconTrash, IconNote, IconCheck, IconLoader2, IconLock, IconChartBar } from "@tabler/icons-react";
import { type Candidature } from "@/models/candidature-model";
import { DialogEnum, type DialogType } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUpdateCandidature } from "@/hooks/use-candidatures";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { stepPosition, STEP_VARIANTS, type PipelineStep } from "../pipeline";

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
  const { mutate: updateCandidature, isPending: isSavingNotes } = useUpdateCandidature();
  const { mutate: saveScores, isPending: isSavingScores } = useUpdateCandidature();

  const [notes, setNotes] = useState(candidature?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);

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
  const scoresKey = `${candidature?.id ?? "none"}`;
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconEye className="size-5" />
              </div>
              {t("view_candidature")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between px-1 mt-2">
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

          <Tabs defaultValue="details" className="mt-3">
            <TabsList className="w-fit">
              <TabsTrigger value="details">{t("details")}</TabsTrigger>
              <TabsTrigger value="scoring">{t("scoring")}</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-3">
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
                  </div>
                </div>

                {/* Notes / Feedback section */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 flex items-center gap-1.5">
                    <IconNote className="size-4" />
                    {t("notes_feedback")}
                  </h3>
                  <div className="mt-3 space-y-2">
                    <textarea
                      id="candidature-notes"
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setNotesSaved(false);
                      }}
                      placeholder={t("notes_placeholder")}
                      rows={4}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors"
                    />
                    <div className="flex items-center justify-end gap-2">
                      {notesSaved && (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <IconCheck className="size-3.5" />
                          {t("notes_saved")}
                        </span>
                      )}
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="gap-1.5"
                      >
                        {isSavingNotes ? (
                          <>
                            <IconLoader2 className="size-3.5 animate-spin" />
                            {t("saving")}
                          </>
                        ) : (
                          t("save_notes")
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
            </TabsContent>
            <TabsContent value="scoring" className="mt-3">
              <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                    <IconChartBar className="size-4" />
                    {t("scoring")}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {t("score_out_of_100")}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {scoringFields.map(({ field, step }) => {
                    const labelKey = `pipeline_step_${step}`;
                    const locked = stepPosition(step) > currentStepPosition;
                    const isCurrent = step === (candidature?.step || "cv_screening");
                    const raw = scoreDraft[field] ?? "";
                    const numeric = raw === "" ? 0 : Number(raw) || 0;
                    return (
                      <div
                        key={field}
                        className={cn(
                          "relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors",
                          isCurrent && !locked && "border-primary/40 ring-1 ring-primary/20",
                          locked && "opacity-55"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "text-[11px] font-semibold uppercase tracking-wide rounded-md px-2 py-1",
                            STEP_VARIANTS[step]
                          )}>
                            {t(labelKey)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isCurrent && !locked && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide rounded bg-primary/10 text-primary px-1.5 py-0.5">
                                {t("current_step")}
                              </span>
                            )}
                            {locked ? (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase">
                                <IconLock className="size-3" />
                                {t("locked_step")}
                              </span>
                            ) : numeric > 0 ? (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 uppercase">
                                <IconCheck className="size-3" />
                                {t("scored")}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase">
                                {t("not_scored")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold tabular-nums leading-none">
                            {numeric}
                          </span>
                          <span className="text-xs text-muted-foreground mb-0.5">/ 100</span>
                        </div>

                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          disabled={locked}
                          value={numeric}
                          onChange={(e) => {
                            setScoreDraft((prev) => ({ ...prev, [field]: e.target.value }));
                            setScoresSaved(false);
                          }}
                          className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed"
                        />

                        <input
                          type="number"
                          min={0}
                          max={100}
                          disabled={locked}
                          value={raw}
                          onChange={(e) => {
                            setScoreDraft((prev) => ({ ...prev, [field]: e.target.value }));
                            setScoresSaved(false);
                          }}
                          placeholder="—"
                          title={t("score_editable")}
                          className={cn(
                            "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-center text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring",
                            raw === ""
                              ? "text-muted-foreground placeholder:text-muted-foreground/50"
                              : "text-foreground",
                            locked && "cursor-not-allowed"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  {scoresSaved && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <IconCheck className="size-3.5" />
                      {t("notes_saved")}
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveScores}
                    disabled={isSavingScores}
                    className="gap-1.5"
                  >
                    {isSavingScores ? (
                      <>
                        <IconLoader2 className="size-3.5 animate-spin" />
                        {t("saving")}
                      </>
                    ) : (
                      t("save_scores")
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
