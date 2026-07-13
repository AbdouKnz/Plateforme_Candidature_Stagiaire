import type { DialogType } from "@/models/alert-model";
import type { EmailLogQueryParams } from "@/models/email-log-model";
import { create } from "zustand";

interface EmailLogsState {
  openEmailLog: DialogType | null;
  setOpenEmailLog: (dialogType: DialogType | null) => void;
  currentEmailLogId: number | null;
  setCurrentEmailLogId: (id: number | null) => void;
  queryParams: EmailLogQueryParams;
  setQueryParams: (params: Partial<EmailLogQueryParams>) => void;
}

export const useEmailLogsStore = create<EmailLogsState>((set) => ({
  openEmailLog: null,
  setOpenEmailLog: (openEmailLog) => set({ openEmailLog }),
  currentEmailLogId: null,
  setCurrentEmailLogId: (id) => set({ currentEmailLogId: id }),
  queryParams: { page: 1, pageSize: 10 },
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));