import { DialogType } from "@/models/alert-model";
import { ID } from "@/models/api";
import { AuditQueryParams } from "@/models/audit-model";
import { create } from "zustand";

interface AuditState {
  openAudit: DialogType | null;
  setOpenAudit: (dialogType: DialogType | null) => void;

  currentAuditId: ID;
  setCurrentAuditId: (id: ID) => void;

  queryParams: AuditQueryParams;
  setQueryParams: (filters: AuditQueryParams) => void;
  resetFilterQueryParams: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  openAudit: null,
  setOpenAudit: (dialogType) => set({ openAudit: dialogType }),

  currentAuditId: null,
  setCurrentAuditId: (id) => set({ currentAuditId: id }),

  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),

  resetFilterQueryParams: () =>
    set((state) => ({
      queryParams: {
        search: state.queryParams.search,
        page: state.queryParams.page,
        pageSize: state.queryParams.pageSize,
      },
    })),
}));
