"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDownloadLink, cn } from "@/lib/utils";
import {
  prepareSessionReset,
  verifyResetPassword,
  confirmSessionReset,
  type PrepareResetResult,
} from "@/service/candidatures";
import {
  IconAlertTriangle,
  IconCheck,
  IconDownload,
  IconFileSpreadsheet,
  IconKey,
  IconLoader2,
  IconRotateClockwise,
} from "@tabler/icons-react";

export type ResetStep =
  | "CONFIRM"
  | "PASSWORD"
  | "FILENAME"
  | "PREPARING"
  | "EXCEL_READY"
  | "RESETTING"
  | "SUCCESS"
  | "ERROR";

interface SessionResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionResetModal({ open, onOpenChange }: SessionResetModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Internal state machine
  const [step, setStep] = useState<ResetStep>("CONFIRM");

  // Temporary password in local state ONLY
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Progress animation state
  const [progress, setProgress] = useState(0);

  // Download Blob & filename kept strictly in memory
  const [excelData, setExcelData] = useState<PrepareResetResult | null>(null);
  const [customFilename, setCustomFilename] = useState("");

  // Generic error message for ERROR step
  const [errorMessage, setErrorMessage] = useState("");
  const [canRetryConfirm, setCanRetryConfirm] = useState(false);

  // Ref to cancel interval on unmount/transition
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean state when modal opens or closes. Entry point is the intro card;
  // password is verified before the filename step.
  const resetModalState = () => {
    setStep("CONFIRM");
    setPassword("");
    setPasswordError("");
    setVerifying(false);
    setProgress(0);
    setExcelData(null);
    setCustomFilename("");
    setErrorMessage("");
    setCanRetryConfirm(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleClose = () => {
    // Disallow close during critical reset mutation
    if (step === "RESETTING") return;
    resetModalState();
    onOpenChange(false);
  };

  // Simulated smooth progress animation (0% -> ~92%) while waiting for backend
  const startProgressAnimation = () => {
    setProgress(10);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          return prev; // Never reach 100% until response arrives!
        }
        // Progress smoothly slows down as it gets higher
        const increment = prev < 40 ? 8 : prev < 70 ? 4 : prev < 85 ? 2 : 1;
        return Math.min(prev + increment, 92);
      });
    }, 280);
  };

  const stopProgressAnimation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopProgressAnimation();
    };
  }, []);

  // Password gate: cheap verify-only call. Wrong password stays on this
  // screen with an inline error; correct password advances to FILENAME.
  const handleVerifyPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifying) return;
    if (!password.trim()) {
      setPasswordError(t("password_required", "Password is required"));
      return;
    }
    setPasswordError("");
    setVerifying(true);
    try {
      await verifyResetPassword(password);
      setStep("FILENAME");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setPasswordError(t("incorrect_reset_password", "Incorrect reset password"));
      } else {
        setPasswordError(
          err?.response?.data?.error || err?.message || t("unknown_error_occurred", "An unexpected error occurred.")
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  // Filename -> Summary: backup generation happens here (password already
  // verified; the 401 branch below stays as a safety net).
  const handleStartPrepare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setPasswordError("");
    setStep("PREPARING");
    startProgressAnimation();

    try {
      const result = await prepareSessionReset(password);
      stopProgressAnimation();
      setProgress(100);
      setExcelData(result);
      if (!customFilename.trim()) {
        setCustomFilename(result.filename.replace(/\.xlsx$/i, ""));
      }
      setStep("EXCEL_READY");
    } catch (err: any) {
      stopProgressAnimation();
      setProgress(0);

      // Handle wrong password response
      let errorText = t("failed_to_generate_excel", "Failed to generate Excel file");
      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        // Stay on PASSWORD step with inline error
        setPasswordError(t("incorrect_reset_password", "Incorrect reset password"));
        setStep("PASSWORD");
        return;
      }

      // Check if server sent JSON inside blob
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.error) errorText = parsed.error;
        } catch {}
      } else if (err?.response?.data?.error) {
        errorText = err.response.data.error;
      }

      setErrorMessage(errorText);
      setStep("ERROR");
    }
  };

  // Step 4 -> Download Blob + Step 5: Call /reset/confirm
  const handleDownloadAndReset = async () => {
    if (!excelData) return;

    // 1. Immediately trigger the browser download of the already-generated Blob
    const downloadName = customFilename.trim() ? `${customFilename.trim()}.xlsx` : excelData.filename;
    createDownloadLink(excelData.blob, downloadName);

    // 2. Transition to RESETTING
    setStep("RESETTING");

    try {
      // 3. Call reset confirm endpoint with the same verified password
      await confirmSessionReset(password);

      // 4. On success: invalidate query caches and clear password
      await queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      await queryClient.invalidateQueries({ queryKey: ["candidatures", "pipeline"] });
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["audits"] });

      setPassword(""); // Clear password from component memory
      setStep("SUCCESS");
    } catch (err: any) {
      let errText = t("reset_failed_rollback", "Failed to reset session in database. Changes were rolled back.");
      if (err?.response?.data?.error) {
        errText = err.response.data.error;
      }
      setErrorMessage(errText);
      setCanRetryConfirm(true);
      setStep("ERROR");
    }
  };

  // Retry confirming the reset after download error
  const handleRetryConfirm = async () => {
    setStep("RESETTING");
    try {
      await confirmSessionReset(password);
      await queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      await queryClient.invalidateQueries({ queryKey: ["candidatures", "pipeline"] });
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      await queryClient.invalidateQueries({ queryKey: ["audits"] });

      setPassword("");
      setStep("SUCCESS");
    } catch (err: any) {
      let errText = t("reset_failed_rollback", "Failed to reset session in database. Changes were rolled back.");
      if (err?.response?.data?.error) {
        errText = err.response.data.error;
      }
      setErrorMessage(errText);
      setCanRetryConfirm(true);
      setStep("ERROR");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md">
        {/* ── STEP 1: INTRO (process recap, entry point) ── */}
        {step === "CONFIRM" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:mx-0">
                <IconAlertTriangle className="size-6" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold">
                {t("reset_recruitment_session", "Reset Recruitment Session")}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-start text-sm text-muted-foreground">
                <p>
                  {t(
                    "reset_session_warning_1",
                    "This action will permanently clear all applications, candidate scores, and pipeline progress from the database."
                  )}
                </p>
                <p className="font-medium text-foreground">
                  {t(
                    "reset_session_warning_2",
                    "A complete 3-sheet Excel backup (Subjects, Applications, and KPIs) will be generated before any deletion occurs."
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "reset_session_warning_3",
                    "The database is only cleared after you click 'Download File'. This operation is irreversible."
                  )}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("cancel", "Cancel")}
              </Button>
              <Button variant="destructive" onClick={() => setStep("PASSWORD")}>
                {t("reset_session", "Reset Session")}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* ── STEP 2: PASSWORD (verified on Continue before anything else) ── */}
        {step === "PASSWORD" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyPassword();
            }}
          >
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
                <IconKey className="size-6" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold">
                {t("enter_reset_password", "Enter Reset Password")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-start text-sm text-muted-foreground">
                {t(
                  "enter_reset_password_desc",
                  "Please enter the environment reset password to authorize this operation."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-2 text-start">
              <Label htmlFor="session-reset-password">
                {t("reset_password", "Reset Password")}
              </Label>
              <Input
                id="session-reset-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                autoFocus
                className={cn(passwordError && "border-destructive focus-visible:ring-destructive")}
              />
              {passwordError && (
                <p className="text-xs font-medium text-destructive">{passwordError}</p>
              )}
            </div>

            <AlertDialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("CONFIRM")} disabled={verifying}>
                {t("back", "Back")}
              </Button>
              <Button type="submit" disabled={verifying}>
                {verifying && <IconLoader2 className="mr-2 size-4 animate-spin" />}
                {t("continue", "Continue")}
              </Button>
            </AlertDialogFooter>
          </form>
        )}

        {/* ── STEP 3: FILENAME (password already verified) ── */}
        {step === "FILENAME" && (
          <form onSubmit={handleStartPrepare}>
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
                <IconFileSpreadsheet className="size-6" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold">
                {t("enter_filename", "Enter file name")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-start text-sm text-muted-foreground">
                {t(
                  "enter_filename_desc",
                  "Choose a name for the Excel backup file."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-2 text-start">
              <Label htmlFor="session-reset-filename">
                {t("file_name", "File name")}
              </Label>
              <div className="flex items-center">
                <Input
                  id="session-reset-filename"
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder={t("filename_placeholder", "e.g. session_backup")}
                  autoFocus
                  className="h-9 rounded-r-none text-xs font-mono"
                />
                <span className="flex h-9 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-xs font-mono text-muted-foreground">
                  .xlsx
                </span>
              </div>
            </div>

            <AlertDialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("PASSWORD")}
              >
                {t("back", "Back")}
              </Button>
              <Button type="submit">
                {t("create", "Create")}
              </Button>
            </AlertDialogFooter>
          </form>
        )}

        {/* ── STEP 3: PREPARING (with animated progress bar) ── */}
        {step === "PREPARING" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
                <IconLoader2 className="size-6 animate-spin" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold">
                {t("preparing_excel_file", "Preparing your Excel file...")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-start text-sm text-muted-foreground">
                {t(
                  "generating_backup_snapshot",
                  "Generating in-memory snapshot of subjects, applications, and statistics. No database data has been modified."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-6 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">{t("progress", "Progress")}</span>
                <span className="font-mono text-primary">{progress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <Button disabled variant="outline" className="opacity-50">
                <IconDownload className="mr-2 size-4" />
                {t("download_file", "Download File")}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* ── STEP 4: EXCEL READY TO DOWNLOAD ── */}
        {step === "EXCEL_READY" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 sm:mx-0">
                <IconFileSpreadsheet className="size-6" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {t("excel_file_ready", "Excel file ready")}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-start text-sm text-muted-foreground">
                <p>
                  {t(
                    "excel_backup_generated_success",
                    "The Excel backup  has been successfully generated."
                  )}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="custom-filename" className="text-xs font-semibold text-foreground">
                    {t("file_name", "File name")}
                  </Label>
                  <div className="flex items-center">
                    <Input
                      id="custom-filename"
                      type="text"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      className="h-9 rounded-r-none text-xs font-mono"
                    />
                    <span className="flex h-9 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-xs font-mono text-muted-foreground">
                      .xlsx
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium text-destructive">
                  {t(
                    "click_download_to_commit",
                    "Clicking 'Download File' will download the backup to your computer and permanently reset the session in the database."
                  )}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* 100% Progress Bar */}
            <div className="my-4 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">{t("ready", "Ready")}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">100%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-500/20">
                <div className="h-full w-full rounded-full bg-emerald-500 transition-all" />
              </div>
            </div>

            <AlertDialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("cancel", "Cancel")}
              </Button>
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleDownloadAndReset}
              >
                <IconDownload className="mr-2 size-4" />
                {t("download_file", "Download File")}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* ── STEP 5: RESETTING (Executing DB Transaction) ── */}
        {step === "RESETTING" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
                <IconLoader2 className="size-6 animate-spin" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold">
                {t("resetting_session", "Resetting session in database...")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-start text-sm text-muted-foreground">
                {t(
                  "resetting_session_desc",
                  "Executing database transaction and resetting recruitment session. Please wait..."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 flex items-center justify-center">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          </>
        )}

        {/* ── STEP 6: SUCCESS ── */}
        {step === "SUCCESS" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 sm:mx-0">
                <IconCheck className="size-6" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold">
                {t("session_reset_complete", "Session Reset Complete")}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-1 text-start text-sm text-muted-foreground">
                <p>
                  {t(
                    "session_reset_complete_desc",
                    "The recruitment session has been successfully reset. The Excel backup has been saved to your computer."
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("frontend_refreshed", "The dashboard and candidate lists have been refreshed.")}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <Button onClick={handleClose}>
                {t("done", "Done")}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* ── ERROR STATE ── */}
        {step === "ERROR" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive sm:mx-0">
                <IconAlertTriangle className="size-6" />
              </div>
              <AlertDialogTitle className="text-start text-xl font-bold text-destructive">
                {t("operation_failed", "Operation Failed")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-start text-sm text-muted-foreground">
                {errorMessage || t("unknown_error_occurred", "An unexpected error occurred.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("close", "Close")}
              </Button>
              {canRetryConfirm ? (
                <Button variant="destructive" onClick={handleRetryConfirm}>
                  <IconRotateClockwise className="mr-2 size-4" />
                  {t("retry_reset", "Retry Reset")}
                </Button>
              ) : (
                <Button onClick={() => setStep("PASSWORD")}>
                  {t("try_again", "Try Again")}
                </Button>
              )}
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

