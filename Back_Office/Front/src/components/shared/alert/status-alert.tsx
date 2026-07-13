"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { IconLock, IconLockOpen } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onConfirm: () => void;
  isBlocked: boolean;
  title?: string;
  blockLoadingText?: string;
  unblockLoadingText?: string;
  unblockButtonText?: string;
  blockButtonText?: string;
}

export function StatusAlert({
  open,
  onClose,
  isBlocked,
  isLoading,
  onConfirm,
  title,
  blockLoadingText,
  unblockLoadingText,
  unblockButtonText,
  blockButtonText,
}: Props) {
  const { t } = useTranslation();

  const displayTitle = title;
  const displayBlockLoadingText = blockLoadingText ;
  const displayUnblockLoadingText = unblockLoadingText ;
  const displayUnblockButtonText = unblockButtonText ;
  const displayBlockButtonText = blockButtonText;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="w-122">
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            {isBlocked ? (
              <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <IconLock className="h-7 w-7 text-destructive " />
              </div>
            ) : (
              <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600/10">
                <IconLockOpen className="h-7 w-7 text-green-600" />
              </div>
            )}
            {displayTitle}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel onClick={onClose}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({
              variant: isBlocked ? "destructive2" : "success",
            })}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              isBlocked ? (
                <>
                  <Spinner variant="circle" />
                  {displayBlockLoadingText}
                </>
              ) : (
                <>
                  <Spinner variant="circle" />
                  {displayUnblockLoadingText}
                </>
              )
            ) : (
              <>
                {isBlocked ? <IconLock /> : <IconLockOpen />}
                {isBlocked ? displayBlockButtonText : displayUnblockButtonText}{" "}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}