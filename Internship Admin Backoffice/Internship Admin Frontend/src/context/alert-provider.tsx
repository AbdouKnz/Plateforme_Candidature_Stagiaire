"use client";

import { ConfirmAlert } from "@/components/shared/alert/confirm-alert";

export function AlertProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ConfirmAlert />
    </>
  );
}
