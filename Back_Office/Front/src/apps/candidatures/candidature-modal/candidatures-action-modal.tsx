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
import { IconEye, IconFile, IconTrash } from "@tabler/icons-react";
import { Candidature } from "@/models/candidature-model";
import { DialogEnum, DialogType } from "@/models/alert-model";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";

const statusVariants: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  invited: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function FileLink({ path, label, fallback }: { path?: string; label: string; fallback?: string }) {
  if (!path) {
    return <span className="text-sm text-muted-foreground">{fallback || "-"}</span>;
  }
  return (
    <a
      href={"/" + path}
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
  const handleClose = () => {
    onClose();
  };

  const isView = mode === DialogEnum.VIEW;
  const isDelete = mode === DialogEnum.DELETE;

  if (isDelete && candidature) {
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

        <div className="space-y-4 mt-3">
          {(() => {
            const isDuo = !!candidature.full_name2;
            const np = () => t("not_provided");
            return (
              <>
                <div className={cn("grid gap-6", isDuo ? "grid-cols-2" : "grid-cols-1")}>
                  <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
                    <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">{t(isDuo ? "applicant_info" : "applicant_info_solo")}</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32">{t("full_name")}:</span>
                        <span className="text-sm">{candidature.full_name || np()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32">{t("gender")}:</span>
                        <span className="text-sm">{candidature.gender1 || np()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32">{t("phone")}:</span>
                        <span className="text-sm">{candidature.phone1 || np()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32">{t("email")}:</span>
                        <span className="text-sm">{candidature.email1 || np()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32">{t("degree")}:</span>
                        <span className="text-sm">{candidature.degree1 || np()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-32">{t("university")}:</span>
                        <span className="text-sm">{candidature.university || np()}</span>
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32">{t("full_name")}:</span>
                          <span className="text-sm">{candidature.full_name2 || np()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32">{t("gender")}:</span>
                          <span className="text-sm">{candidature.gender2 || np()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32">{t("phone")}:</span>
                          <span className="text-sm">{candidature.phone2 || np()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32">{t("email")}:</span>
                          <span className="text-sm">{candidature.email2 || np()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32">{t("degree")}:</span>
                          <span className="text-sm">{candidature.degree2 || np()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-32">{t("university")}:</span>
                          <span className="text-sm">{candidature.university2 || np()}</span>
                        </div>
                        <div className="border-t pt-2 mt-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">{t("files")}</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground w-32">{t("cv")}:</span>
                              <FileLink path={candidature.path_cv2} label={t("cv")} fallback={np()} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground w-32">{t("motivation_letter")}:</span>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32">{t("method")}:</span>
                      <span className="text-sm">{({
                        office: t("method_office"),
                        hybrid: t("hybrid"),
                        remote: t("method_remote"),
                      } as Record<string, string>)[candidature.methode] ?? (candidature.methode || np())}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32">{t("subject")}:</span>
                      <span className="text-sm">{candidature.subject_name || np()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32">{t("start_date")}:</span>
                      <span className="text-sm">{candidature.start_date ? candidature.start_date.split("-").reverse().join("/") : np()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-32">{t("duration")}:</span>
                      <span className="text-sm">{candidature.duration || np()}</span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
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
