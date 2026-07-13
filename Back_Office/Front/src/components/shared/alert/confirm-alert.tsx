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
import { cn } from "@/lib/utils";
import { AlertEnum } from "@/models/alert-model";
import { useAlertStore } from "@/stores/alert-store";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

export function ConfirmAlert() {
  const { isOpen, message, type, onConfirm, hideAlert } = useAlertStore();
  const handleConfirm = () => {
    onConfirm?.();
    hideAlert();
  };

  useEffect(() => {
    if (isOpen && type == AlertEnum.SUCCESS) {
      const timer = setTimeout(() => {
        hideAlert();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type, hideAlert]);

  const Icon =
    type === AlertEnum.ERROR
      ? XCircle
      : type === AlertEnum.WARNING
      ? AlertTriangle
      : CheckCircle;

  const bgColor =
    type === AlertEnum.ERROR
      ? "bg-destructive/10"
      : type === AlertEnum.WARNING
      ? "bg-warning/10"
      : "bg-success/10";

  const iconColor =
    type === AlertEnum.ERROR
      ? "text-destructive"
      : type === AlertEnum.WARNING
      ? "text-warning"
      : "text-success";

  const iconAnimation =
    type === AlertEnum.ERROR
      ? "animate-pulse"
      : type === AlertEnum.WARNING
      ? "animate-bounce"
      : "animate-bounce";
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="w-120 data-[state=open]:!zoom-in-0 data-[state=closed]:!zoom-out-0 origin-center duration-400">
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            <div
              className={cn(
                "mb-2 mx-auto flex h-16 w-16 items-center justify-center rounded-full",
                bgColor
              )}
            >
              <Icon className={cn("h-9 w-9", iconColor, iconAnimation)} />
            </div>
            {message}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogAction
            onClick={handleConfirm}
            className={buttonVariants({
              variant:
                type === AlertEnum.ERROR
                  ? "destructive"
                  : type === AlertEnum.WARNING
                  ? "warning"
                  : "success",
              size: "lg",
            })}
          >
            Okay
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
