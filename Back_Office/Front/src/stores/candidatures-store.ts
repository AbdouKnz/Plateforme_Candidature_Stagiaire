import { DialogType } from "@/models/alert-model";
import { CandidatureQueryParams } from "@/models/candidature-model";
import { create } from "zustand";

interface EmailModalData {
  candidatureId: number;
  templateType: "confirmation" | "acceptance" | "disapproval";
}

interface CandidaturesState {
  openCandidature: DialogType | null;
  setOpenCandidature: (dialogType: DialogType | null) => void;
  currentCandidatureId: number | null;
  setCurrentCandidatureId: (id: number | null) => void;
  queryParams: CandidatureQueryParams;
  setQueryParams: (params: Partial<CandidatureQueryParams>) => void;
  emailModalData: EmailModalData | null;
  setEmailModalData: (data: EmailModalData | null) => void;
}

export const useCandidaturesStore = create<CandidaturesState>((set) => ({
  openCandidature: null,
  setOpenCandidature: (openCandidature) => set({ openCandidature }),
  currentCandidatureId: null,
  setCurrentCandidatureId: (id) => set({ currentCandidatureId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
  emailModalData: null,
  setEmailModalData: (data) => set({ emailModalData: data }),
}));
