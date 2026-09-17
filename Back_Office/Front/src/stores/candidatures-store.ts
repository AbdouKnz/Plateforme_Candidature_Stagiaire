import { DialogType } from "@/models/alert-model";
import { CandidatureQueryParams } from "@/models/candidature-model";
import { create } from "zustand";
import { PipelineStep } from "@/apps/candidatures/pipeline";

export interface StepFilters {
  candidature_type?: string;
  gender?: string;
  degree?: string;
  subject_name?: string;
  score_sort?: string;
  score_min?: string;
  score_max?: string;
}

interface EmailModalData {
  candidatureId: number;
  templateType: "confirmation" | "acceptance" | "disapproval";
  targetStep?: string;
}

interface CandidaturesState {
  openCandidature: DialogType | null;
  setOpenCandidature: (dialogType: DialogType | null) => void;
  currentCandidatureId: number | null;
  setCurrentCandidatureId: (id: number | null) => void;
  queryParams: CandidatureQueryParams;
  setQueryParams: (params: Partial<CandidatureQueryParams>) => void;
  resetFilterQueryParams: () => void;
  stepFilters: Partial<Record<PipelineStep | "all", StepFilters>>;
  setStepFilterParams: (step: PipelineStep | "all", params: Partial<StepFilters>) => void;
  resetStepFilterParams: (step: PipelineStep | "all") => void;
  // One-shot tab request for the view card (e.g. open directly on "scoring").
  // Consumed and cleared by the modal when it opens.
  viewInitialTab: string | null;
  setViewInitialTab: (tab: string | null) => void;
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
  resetFilterQueryParams: () =>
    set((state) => ({
      queryParams: {
        search: state.queryParams.search,
      },
    })),
  stepFilters: {},
  setStepFilterParams: (step, params) =>
    set((state) => ({
      stepFilters: {
        ...state.stepFilters,
        [step]: { ...state.stepFilters[step], ...params },
      },
    })),
  resetStepFilterParams: (step) =>
    set((state) => ({
      stepFilters: {
        ...state.stepFilters,
        [step]: {},
      },
    })),
  viewInitialTab: null,
  setViewInitialTab: (tab) => set({ viewInitialTab: tab }),
  emailModalData: null,
  setEmailModalData: (data) => set({ emailModalData: data }),
}));
