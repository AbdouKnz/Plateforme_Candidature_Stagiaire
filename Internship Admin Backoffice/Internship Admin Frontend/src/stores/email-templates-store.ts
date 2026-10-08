import { DialogType } from "@/models/alert-model";
import { EmailTemplateQueryParams } from "@/models/email-template-model";
import { create } from "zustand";

interface EmailTemplatesState {
  openEmailTemplate: DialogType | null;
  setOpenEmailTemplate: (dialogType: DialogType | null) => void;
  currentEmailTemplateId: number | null;
  setCurrentEmailTemplateId: (id: number | null) => void;
  queryParams: EmailTemplateQueryParams;
  setQueryParams: (params: Partial<EmailTemplateQueryParams>) => void;
}

export const useEmailTemplatesStore = create<EmailTemplatesState>((set) => ({
  openEmailTemplate: null,
  setOpenEmailTemplate: (openEmailTemplate) => set({ openEmailTemplate }),
  currentEmailTemplateId: null,
  setCurrentEmailTemplateId: (id) => set({ currentEmailTemplateId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));