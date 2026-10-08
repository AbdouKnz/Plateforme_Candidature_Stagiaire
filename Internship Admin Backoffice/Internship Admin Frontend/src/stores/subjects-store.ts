import { DialogType } from "@/models/alert-model";
import { SubjectQueryParams } from "@/models/subject-model";
import { create } from "zustand";

interface SubjectsState {
  openSubject: DialogType | null;
  setOpenSubject: (dialogType: DialogType | null) => void;
  currentSubjectId: number | null;
  setCurrentSubjectId: (id: number | null) => void;
  queryParams: SubjectQueryParams;
  setQueryParams: (params: Partial<SubjectQueryParams>) => void;
}

export const useSubjectsStore = create<SubjectsState>((set) => ({
  openSubject: null,
  setOpenSubject: (openSubject) => set({ openSubject }),
  currentSubjectId: null,
  setCurrentSubjectId: (id) => set({ currentSubjectId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));
